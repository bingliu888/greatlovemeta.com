import { classAccess, classByCode } from "@/lib/classrooms";
import { canManageClass } from "@/lib/class-managers";
import { createId, getDatabase, getSessionUser } from "@/lib/auth";
import { CLASS_CHAT_RETENTION_SECONDS, SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL, SELECT_VISIBLE_CLASS_CHAT_SQL, canDeleteClassChatMessage } from "@/lib/class-chat-policy";
import { hasClassRoomMemberTab } from "@/lib/class-room-member-presence";

export const dynamic="force-dynamic";

async function context(request:Request,code:string){
  const room=await classByCode(code);
  if(!room)return {error:Response.json({error:"Course not found"},{status:404})};
  const user=await getSessionUser(request);
  if(!user)return {error:Response.json({error:"Sign in required"},{status:401})};
  if(!(await classAccess(room,user)).allowed)return {error:Response.json({error:"Access denied"},{status:403})};
  const present=await hasClassRoomMemberTab(room.id,user.id,request.headers.get("x-room-tab-id")||"");
  if(!present)return {error:Response.json({error:"Enter the room before using chat"},{status:403})};
  const supportAgent=await canManageClass(room,user);
  return {room,user,supportAgent};
}

export async function GET(request:Request,{params}:{params:Promise<{code:string}>}){
  const access=await context(request,(await params).code);
  if(access.error)return access.error;
  const {room,user,supportAgent}=access;
  const now=Math.floor(Date.now()/1000);
  const rows=await getDatabase().prepare(SELECT_VISIBLE_CLASS_CHAT_SQL)
    .bind(room!.id,now-CLASS_CHAT_RETENTION_SECONDS,supportAgent?1:0,user!.id,user!.id)
    .run<{id:string;senderUserId:string;senderName:string;recipientUserId:string|null;recipientName:string|null;senderIsSupportAgent:number;body:string;createdAt:number}>();
  const messages=(rows.results||[]).reverse().map(row=>({
    id:row.id,senderName:row.senderName,body:row.body,createdAt:row.createdAt,
    recipientName:supportAgent?row.recipientName:null,
    privateReply:row.recipientUserId!==null,
    canReply:Boolean(supportAgent&&row.senderIsSupportAgent===0),
    canDelete:canDeleteClassChatMessage({supportAgent:Boolean(supportAgent),userId:user!.id,senderUserId:row.senderUserId}),
  }));
  return Response.json({supportAgent,messages},{headers:{"cache-control":"private, no-store"}});
}

export async function POST(request:Request,{params}:{params:Promise<{code:string}>}){
  const access=await context(request,(await params).code);
  if(access.error)return access.error;
  const {room,user,supportAgent}=access;
  const input=await request.json().catch(()=>null) as {body?:string;replyToMessageId?:string}|null;
  const body=String(input?.body||"").trim();
  if(!body||body.length>2000)return Response.json({error:"Message must contain 1–2,000 characters"},{status:400});
  const replyId=String(input?.replyToMessageId||"").trim();
  if(replyId.length>128)return Response.json({error:"Invalid reply target"},{status:400});
  if(replyId&&!supportAgent)return Response.json({error:"Only the host team can reply privately"},{status:403});
  if(supportAgent&&!replyId)return Response.json({error:"Choose a member message to reply to"},{status:400});
  const now=Math.floor(Date.now()/1000),db=getDatabase();
  const target=replyId?await db.prepare(SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL)
    .bind(replyId,room!.id,now-CLASS_CHAT_RETENTION_SECONDS).first<{userId:string}>():null;
  if(replyId&&!target)return Response.json({error:"Reply target not found"},{status:404});
  await db.prepare(`INSERT INTO class_chat_messages
    (id,room_id,sender_user_id,sender_name,recipient_user_id,body,created_at)
    VALUES(?,?,?,?,?,?,?)`).bind(createId(),room!.id,user!.id,user!.displayName,target?.userId||null,body,now).run();
  await db.prepare(`DELETE FROM class_chat_messages WHERE room_id=? AND created_at<=?`)
    .bind(room!.id,now-CLASS_CHAT_RETENTION_SECONDS).run();
  return Response.json({ok:true},{status:201});
}

export async function DELETE(request:Request,{params}:{params:Promise<{code:string}>}){
  const access=await context(request,(await params).code);
  if(access.error)return access.error;
  const {room,user,supportAgent}=access;
  const input=await request.json().catch(()=>null) as {messageId?:string}|null;
  const id=String(input?.messageId||"").trim();
  if(!id||id.length>128)return Response.json({error:"Invalid message"},{status:400});
  const result=await getDatabase().prepare(`DELETE FROM class_chat_messages
    WHERE id=? AND room_id=? AND (sender_user_id=? OR ?=1)`)
    .bind(id,room!.id,user!.id,supportAgent?1:0).run();
  if(Number(result.meta?.changes||0)<1)return Response.json({error:"Message not found"},{status:404});
  return Response.json({ok:true});
}
