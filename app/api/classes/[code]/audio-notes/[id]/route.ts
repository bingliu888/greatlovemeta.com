import { getDatabase, getSessionUser } from "@/lib/auth";
import { classAccess, classByCode } from "@/lib/classrooms";
import { classFileBucket } from "@/lib/class-room-resource-policy";

type Context={params:Promise<{code:string;id:string}>};

export async function GET(request:Request,{params}:Context) {
  const {code,id}=await params,room=await classByCode(code);
  if(!room)return new Response("Not found",{status:404});
  const user=await getSessionUser(request);
  if(!user||!(await classAccess(room,user)).allowed)
    return new Response("Course access required",{status:user?403:401});
  const item=await getDatabase().prepare(`SELECT object_key AS objectKey,
    content_type AS contentType,byte_size AS byteSize
    FROM class_room_audio_notes WHERE room_id=? AND id=? AND deleted_at IS NULL`).bind(room.id,id)
    .first<{objectKey:string;contentType:string;byteSize:number}>();
  if(!item)return new Response("Not found",{status:404});
  const storage=await classFileBucket();
  if(!storage)return new Response("Storage unavailable",{status:503});
  const range=request.headers.get("range"),match=range?/^bytes=(\d+)-(\d*)$/.exec(range):null;
  let offset=0,length=item.byteSize,status=200,contentRange="";
  if(range&&!match)return new Response(null,{status:416,headers:{"content-range":`bytes */${item.byteSize}`}});
  if(match){
    offset=Number(match[1]);
    const end=match[2]?Number(match[2]):item.byteSize-1;
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(end)||offset>=item.byteSize||
      end<offset)return new Response(null,{status:416,headers:{"content-range":`bytes */${item.byteSize}`}});
    length=Math.min(end,item.byteSize-1)-offset+1;status=206;
    contentRange=`bytes ${offset}-${offset+length-1}/${item.byteSize}`;
  }
  const object=await storage.get(item.objectKey,status===206?{range:{offset,length}}:undefined);
  if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{status,headers:{"content-type":item.contentType,
    "content-length":String(length),"accept-ranges":"bytes",
    "cache-control":"private, no-store","x-content-type-options":"nosniff",
    ...(contentRange?{"content-range":contentRange}:{})}});
}

export async function DELETE(request:Request,{params}:Context) {
  const {code,id}=await params,room=await classByCode(code);
  if(!room)return Response.json({error:"Not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user||!(await classAccess(room,user)).manager)
    return Response.json({error:"Manager access required"},{status:403});
  await getDatabase().prepare(`UPDATE class_room_audio_notes SET deleted_at=?
    WHERE room_id=? AND id=? AND deleted_at IS NULL`)
    .bind(Math.floor(Date.now()/1000),room.id,id).run();
  return Response.json({ok:true});
}
