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
    content_type AS contentType,byte_size AS byteSize,file_name AS fileName
    FROM class_materials WHERE room_id=? AND id=? AND deleted_at IS NULL`).bind(room.id,id)
    .first<{objectKey:string;contentType:string;byteSize:number;fileName:string}>();
  if(!item)return new Response("Not found",{status:404});
  const storage=await classFileBucket();
  if(!storage)return new Response("Storage unavailable",{status:503});
  const object=await storage.get(item.objectKey);
  if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":item.contentType,
    "content-length":String(item.byteSize),"cache-control":"private, no-store",
    "content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(item.fileName)}`,
    "x-content-type-options":"nosniff"}});
}

// Preserve R2 objects for recovery. The room UI hides a deleted attachment,
// while a site operator can restore it without relying on provider backups.
export async function DELETE(request:Request,{params}:Context) {
  const {code,id}=await params,room=await classByCode(code);
  if(!room)return Response.json({error:"Not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user||!(await classAccess(room,user)).manager)
    return Response.json({error:"Manager access required"},{status:403});
  await getDatabase().prepare(`UPDATE class_materials SET deleted_at=?
    WHERE room_id=? AND id=? AND deleted_at IS NULL`)
    .bind(Math.floor(Date.now()/1000),room.id,id).run();
  return Response.json({ok:true});
}
