import { classAccess, classByCode } from "@/lib/classrooms";
import { getDatabase, getSessionUser } from "@/lib/auth";
import { canManageClass } from "@/lib/class-managers";
import { CLASS_ROOM_OBJECT_KEYS_SQL } from "@/lib/class-room-resource-sql";

export async function GET(request:Request,{params}:{params:Promise<{code:string}>}){const{code}=await params,room=await classByCode(code);if(!room)return Response.json({error:"Course not found"},{status:404});const user=await getSessionUser(request),access=await classAccess(room,user);if(!access.allowed)return Response.json({error:"reason" in access?access.reason:"Access denied"},{status:403});return Response.json({room,access});}
export async function PATCH(request:Request,{params}:{params:Promise<{code:string}>}){const{code}=await params,room=await classByCode(code),user=await getSessionUser(request);if(!room||!user)return Response.json({error:"Not found"},{status:404});if(room.isHelpRoom)return Response.json({error:"Help room configuration is managed by the platform"},{status:403});if(!await canManageClass(room,user))return Response.json({error:"Manager access required"},{status:403});const body=await request.json()as Record<string,unknown>,title=String(body.title||room.title).trim().slice(0,120),description=String(body.description??room.description).trim().slice(0,2000),subject=String(body.subject??room.subject).trim().slice(0,80),classType=body.classType==="private"?"private":body.classType==="trial"?"trial":"public",streamingMode=body.streamingMode==="audio"?"audio":"video",realtimeMode=body.realtimeMode==="webinar"?"webinar":body.realtimeMode==="livestream"?"livestream":"group_call",startsAt=Math.floor(new Date(String(body.startsAt||new Date(room.startsAt*1000).toISOString())).getTime()/1000),duration=Math.max(15,Math.min(480,Number(body.durationMinutes)||room.durationMinutes)),trial=classType==="trial"?1440:0,tuition=classType==="trial"?Math.max(0,Math.min(10_000_000,Math.round(Number(body.tuition??room.tuitionCents/100)*100))):0;if(title.length<3||!Number.isFinite(startsAt))return Response.json({error:"Invalid course"},{status:400});if(room.streamActive&&(streamingMode!==room.streamingMode||realtimeMode!==room.realtimeMode))return Response.json({error:"Media and interaction modes are locked while streaming is active"},{status:409});await getDatabase().prepare("UPDATE class_rooms SET title=?,description=?,subject=?,class_type=?,streaming_mode=?,realtime_mode=?,starts_at=?,duration_minutes=?,trial_minutes=?,tuition_cents=?,mute_all=0,updated_at=? WHERE id=?").bind(title,description,subject,classType,streamingMode,realtimeMode,startsAt,duration,trial,tuition,Math.floor(Date.now()/1000),room.id).run();return Response.json({ok:true});}
export async function DELETE(request:Request,{params}:{params:Promise<{code:string}>}) {
  const {code}=await params,room=await classByCode(code),user=await getSessionUser(request);
  if(!room||!user)return Response.json({error:"Not found"},{status:404});
  if(room.isHelpRoom)return Response.json({error:"Help room cannot be deleted here"},{status:403});
  if(!await canManageClass(room,user))return Response.json({error:"Manager access required"},{status:403});
  if(room.providerMeetingId)return Response.json({error:"Leave the live room before deleting this class."},{status:409});
  const db=getDatabase();
  const pendingCreate=await db.prepare(`SELECT 1 FROM class_provider_create_attempts WHERE room_id=? LIMIT 1`)
    .bind(room.id).first();
  if(pendingCreate)return Response.json({error:"Provider room creation is still being reconciled."},{status:409});
  const pendingJob=await db.prepare(`SELECT 1 FROM class_provider_teardown_jobs WHERE room_id=? LIMIT 1`)
    .bind(room.id).first();
  if(pendingJob)return Response.json({error:"Provider room cleanup is still pending."},{status:409});
  const objects=(await db.prepare(CLASS_ROOM_OBJECT_KEYS_SQL)
    .bind(room.id,room.id,room.id).run<{r2Key:string}>()).results||[];
  if(objects.length){
    const {env}=await import("cloudflare:workers"),bucket=env.CLASS_FILES as unknown as
      {delete(keys:string|string[]):Promise<unknown>}|undefined;
    if(!bucket)return Response.json({error:"Class storage is unavailable"},{status:503});
    const keys=objects.map(item=>item.r2Key);
    for(let offset=0;offset<keys.length;offset+=1000)
      await bucket.delete(keys.slice(offset,offset+1000));
  }
  await db.prepare("DELETE FROM class_rooms WHERE id=?").bind(room.id).run();
  return Response.json({ok:true});
}
