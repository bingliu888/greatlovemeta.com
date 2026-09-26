import { classAccess, classByCode } from "@/lib/classrooms";
import { getSessionUser } from "@/lib/auth";
import { claimClassRoomMember, classRoomOnlineMembers, releaseClassRoomMember, ROOM_TAB_ID } from "@/lib/class-room-member-presence";

export const dynamic = "force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{code:string}>}) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  if(!(await classAccess(room,user)).allowed)return Response.json({error:"Access denied"},{status:403});
  const members=await classRoomOnlineMembers(room.id);
  return Response.json({onlineCount:members.length,members},{headers:{"cache-control":"no-store"}});
}

export async function POST(request:Request,{params}:{params:Promise<{code:string}>}) {
  const room=await classByCode((await params).code);
  if(!room)return Response.json({error:"Course not found"},{status:404});
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  if(!(await classAccess(room,user)).allowed)return Response.json({error:"Access denied"},{status:403});
  const input=await request.json().catch(()=>null) as {action?:string;tabId?:string}|null;
  if(!input?.tabId||!ROOM_TAB_ID.test(input.tabId)||!(["heartbeat","leave"] as unknown[]).includes(input.action))
    return Response.json({error:"Invalid room presence request"},{status:400});
  if(input.action==="leave"){
    await releaseClassRoomMember(room.id,user.id,input.tabId);
    return Response.json({ok:true},{headers:{"cache-control":"no-store"}});
  }
  const claimed=await claimClassRoomMember(room.id,user.id,input.tabId,user.displayName);
  if(!claimed)return Response.json({error:"This account is already in this room on another device",errorCode:"ALREADY_IN_ROOM"},{status:409,headers:{"cache-control":"no-store"}});
  return Response.json({ok:true},{headers:{"cache-control":"no-store"}});
}
