import { boundedRequestStream } from "@/lib/bounded-request-body";
import { createId, getDatabase, getSessionUser } from "@/lib/auth";
import { classAccess, classByCode } from "@/lib/classrooms";
import { hasClassRoomMemberTab } from "@/lib/class-room-member-presence";
import { classFileBucket, canAddClassAudioNote, classUserEmailVerified, MAX_CLASS_AUDIO_NOTES } from "@/lib/class-room-resource-policy";
import { AUDIO_NOTE_TYPES, audioNoteDurationAllowed, MAX_AUDIO_NOTE_BYTES } from "@/lib/class-room-audio-note-policy";

type Context={params:Promise<{code:string}>};

export async function GET(request:Request,{params}:Context) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user||!(await classAccess(room,user)).allowed)
    return Response.json({error:"Course access required"},{status:user?403:401});
  const items=(await getDatabase().prepare(`SELECT id,content_type AS contentType,
    byte_size AS byteSize,recording_seconds AS recordingSeconds,source,
    created_at AS createdAt FROM class_room_audio_notes WHERE room_id=? AND deleted_at IS NULL
    ORDER BY created_at DESC,id DESC LIMIT 100`).bind(room.id).run()).results||[];
  return Response.json({items,canAdd:await canAddClassAudioNote(user)},
    {headers:{"cache-control":"no-store"}});
}

export async function POST(request:Request,{params}:Context) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  if(!(await classAccess(room,user)).manager)
    return Response.json({error:"Manager access required"},{status:403});
  if(!await canAddClassAudioNote(user))
    return Response.json({error:"Subscription required"},{status:402});
  if(!await classUserEmailVerified(user))
    return Response.json({error:"Verify your email before uploading recordings"},{status:403});
  if(!await hasClassRoomMemberTab(room.id,user.id,request.headers.get("x-room-tab-id")||""))
    return Response.json({error:"Join the course room before recording"},{status:403});
  const busy=await getDatabase().prepare(`SELECT 1 FROM class_media_presence
    WHERE room_id=? AND user_id=? AND active=1 AND (mic_on=1 OR camera_on=1)
      AND last_seen_at>? LIMIT 1`).bind(room.id,user.id,Math.floor(Date.now()/1000)-45).first();
  if(busy)return Response.json({error:"Turn off live media before adding a recording"},{status:409});
  const source=request.headers.get("x-recording-source")||"",
    seconds=Number(request.headers.get("x-recording-seconds")),
    claimed=Number(request.headers.get("x-recording-size")),
    contentType=String(request.headers.get("content-type")||"").split(";")[0].toLowerCase().trim(),
    extension=AUDIO_NOTE_TYPES[contentType];
  if(!audioNoteDurationAllowed(source,seconds))
    return Response.json({error:"Recording duration exceeds the allowed limit"},{status:400});
  if(!extension)return Response.json({error:"Supported audio file required"},{status:415});
  if(!Number.isSafeInteger(claimed)||claimed<1||claimed>MAX_AUDIO_NOTE_BYTES)
    return Response.json({error:"Choose audio up to 100 MB"},{status:413});
  const storage=await classFileBucket();
  if(!storage)return Response.json({error:"Recording storage is unavailable"},{status:503});
  const id=createId(),key=`classes/${room.id}/audio-notes/${id}.${extension}`;
  try{
    const stream=boundedRequestStream(request,MAX_AUDIO_NOTE_BYTES);
    const FixedLength=(globalThis as unknown as {FixedLengthStream?:new(size:number)=>{
      readable:ReadableStream<Uint8Array>;writable:WritableStream<Uint8Array>}}).FixedLengthStream;
    if(!FixedLength)throw new Error("FIXED_LENGTH_STREAM_UNAVAILABLE");
    const fixed=new FixedLength(claimed),piping=stream.body.pipeTo(fixed.writable);
    let object;
    try{[object]=await Promise.all([storage.put(key,fixed.readable,{httpMetadata:{contentType}}),piping]);}
    catch(error){await piping.catch(()=>undefined);throw error;}
    const storedSize=(object as {size?:number}|null)?.size;
    if(stream.receivedBytes()!==claimed||(storedSize&&storedSize!==claimed))
      throw new Error("UPLOAD_SIZE_MISMATCH");
    if(!(await classAccess(room,user)).manager||!await canAddClassAudioNote(user)||
      !await hasClassRoomMemberTab(room.id,user.id,request.headers.get("x-room-tab-id")||""))
      throw new Error("RECORDING_PERMISSION_CHANGED");
    const now=Math.floor(Date.now()/1000),db=getDatabase();
    const result=await db.prepare(`INSERT INTO class_room_audio_notes
      (id,room_id,uploader_user_id,object_key,content_type,byte_size,
        recording_seconds,source,created_at)
      SELECT ?,?,?,?,?,?,?,?,? WHERE
      (SELECT COUNT(*) FROM class_room_audio_notes WHERE room_id=? AND deleted_at IS NULL)<?`)
      .bind(id,room.id,user.id,key,contentType,claimed,Math.ceil(seconds),source,now,
        room.id,MAX_CLASS_AUDIO_NOTES).run();
    if(Number(result.meta?.changes||0)!==1)throw new Error("RECORDING_LIMIT_REACHED");
    return Response.json({id,status:"ready"},{status:201});
  }catch(error){
    await storage.delete(key).catch(()=>undefined);
    const message=error instanceof Error?error.message:"RECORDING_UPLOAD_FAILED";
    return Response.json({error:message==="RECORDING_LIMIT_REACHED"?
      "This room already has 100 recordings":"Unable to save recording",errorCode:message},
      {status:message==="RECORDING_LIMIT_REACHED"?409:500});
  }
}
