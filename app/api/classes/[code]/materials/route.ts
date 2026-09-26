import { boundedRequestBody } from "@/lib/bounded-request-body";
import { createId, getDatabase, getSessionUser } from "@/lib/auth";
import { classAccess, classByCode } from "@/lib/classrooms";
import { CLASS_MATERIAL_TYPES, MAX_CLASS_MATERIALS,
  MAX_CLASS_MATERIAL_BYTES, classFileBucket, classUserEmailVerified, safeClassFileName } from "@/lib/class-room-resource-policy";

type Context = {params:Promise<{code:string}>};

export async function GET(request:Request,{params}:Context) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user||!(await classAccess(room,user)).allowed)
    return Response.json({error:"Course access required"},{status:user?403:401});
  const materials=(await getDatabase().prepare(`SELECT id,file_name AS fileName,
    content_type AS contentType,byte_size AS fileSizeBytes,created_at AS createdAt
    FROM class_materials WHERE room_id=? AND deleted_at IS NULL
    ORDER BY created_at DESC,id DESC LIMIT 100`)
    .bind(room.id).run()).results||[];
  return Response.json({materials},{headers:{"cache-control":"no-store"}});
}

export async function POST(request:Request,{params}:Context) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  if(!(await classAccess(room,user)).manager)
    return Response.json({error:"Manager access required"},{status:403});
  if(!await classUserEmailVerified(user))
    return Response.json({error:"Verify your email before uploading files"},{status:403});
  const declared=Number(request.headers.get("x-file-size")||request.headers.get("content-length")||0),
    contentType=String(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase(),
    fileName=safeClassFileName(request.headers.get("x-file-name"));
  if(!Number.isSafeInteger(declared)||declared<1||declared>MAX_CLASS_MATERIAL_BYTES)
    return Response.json({error:"Choose a file up to 15 MB"},{status:413});
  if(!CLASS_MATERIAL_TYPES.has(contentType))
    return Response.json({error:"Unsupported attachment type"},{status:415});
  const storage=await classFileBucket();
  if(!storage)return Response.json({error:"File storage is unavailable"},{status:503});
  let body:ArrayBuffer;
  try{body=await boundedRequestBody(request,MAX_CLASS_MATERIAL_BYTES);}
  catch(error){return error instanceof Response?error:Response.json({error:"Invalid attachment"},{status:400});}
  if(body.byteLength!==declared)return Response.json({error:"Upload size mismatch"},{status:400});
  const id=createId(),key=`classes/${room.id}/materials/${id}-${fileName}`,
    now=Math.floor(Date.now()/1000),db=getDatabase();
  try{
    await storage.put(key,body,{httpMetadata:{contentType}});
    const result=await db.prepare(`INSERT INTO class_materials
      (id,room_id,uploader_user_id,file_name,content_type,object_key,byte_size,created_at)
      SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM class_materials
        WHERE room_id=? AND deleted_at IS NULL)<?`)
      .bind(id,room.id,user.id,fileName,contentType,key,declared,now,room.id,MAX_CLASS_MATERIALS).run();
    if(Number(result.meta?.changes||0)!==1)throw new Error("MATERIAL_LIMIT_REACHED");
    return Response.json({ok:true,id},{status:201});
  }catch(error){
    await storage.delete(key).catch(()=>undefined);
    const message=error instanceof Error?error.message:"MATERIAL_UPLOAD_FAILED";
    return Response.json({error:message==="MATERIAL_LIMIT_REACHED"?"This course already has 100 attachments":"Unable to upload attachment"},
      {status:message==="MATERIAL_LIMIT_REACHED"?409:500});
  }
}
