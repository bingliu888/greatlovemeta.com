import { isAdminUser } from "@/lib/admin-access";
import { createId, getDatabase, type SessionUser } from "@/lib/auth";
import type { ClassRoom } from "@/lib/classrooms";

export const CLASS_TRIAL_SECONDS = 7 * 24 * 60 * 60;

export async function isClassCoHost(roomId: string, user: SessionUser | null) {
  if (!user) return false;
  return Boolean(await getDatabase().prepare("SELECT 1 FROM class_cohosts WHERE room_id=? AND user_id=? LIMIT 1").bind(roomId,user.id).first());
}

export async function canManageClass(room: Pick<ClassRoom,"id"|"hostUserId">, user: SessionUser | null) {
  if (!user) return false;
  if (user.id === room.hostUserId || await isAdminUser(user)) return true;
  return isClassCoHost(room.id,user);
}

export async function classCoHosts(roomId: string) {
  const result=await getDatabase().prepare(`SELECT u.id,u.email,u.display_name AS displayName,c.created_at AS createdAt
    FROM class_cohosts c JOIN users u ON u.id=c.user_id WHERE c.room_id=? ORDER BY c.created_at`).bind(roomId).run<{id:string;email:string;displayName:string;createdAt:number}>();
  return result.results||[];
}

async function registeredUser(emailValue:string) {
  const email=emailValue.trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email))throw new Error("INVALID_EMAIL");
  const target=await getDatabase().prepare("SELECT id,email,display_name AS displayName FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first<{id:string;email:string;displayName:string}>();
  if(!target)throw new Error("MEMBER_NOT_FOUND");
  return target;
}

export async function addClassCoHost(room:Pick<ClassRoom,"id"|"hostUserId">,actor:SessionUser,email:string){
  const target=await registeredUser(email);if(target.id===room.hostUserId)throw new Error("ALREADY_HOST");
  await getDatabase().prepare("INSERT INTO class_cohosts(room_id,user_id,added_by_user_id,created_at) VALUES(?,?,?,?) ON CONFLICT(room_id,user_id) DO NOTHING").bind(room.id,target.id,actor.id,Math.floor(Date.now()/1000)).run();
}
export async function removeClassCoHost(roomId:string,userId:string){await getDatabase().prepare("DELETE FROM class_cohosts WHERE room_id=? AND user_id=?").bind(roomId,userId).run();}

export async function classSubscribers(roomId:string){
  const result=await getDatabase().prepare(`SELECT s.user_id AS id,s.email,u.display_name AS displayName,s.updated_at AS updatedAt
    FROM class_subscriptions s JOIN users u ON u.id=s.user_id WHERE s.room_id=? AND s.status='active' ORDER BY s.updated_at DESC`).bind(roomId).run<{id:string;email:string;displayName:string;updatedAt:number}>();
  return result.results||[];
}
export async function addClassSubscriber(roomId:string,actor:SessionUser,email:string){const target=await registeredUser(email),now=Math.floor(Date.now()/1000);await getDatabase().prepare(`INSERT INTO class_subscriptions(room_id,user_id,email,status,added_by_user_id,created_at,updated_at) VALUES(?,?,?,'active',?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET email=excluded.email,status='active',added_by_user_id=excluded.added_by_user_id,updated_at=excluded.updated_at`).bind(roomId,target.id,target.email,actor.id,now,now).run();}
export async function removeClassSubscriber(roomId:string,userId:string){await getDatabase().prepare("UPDATE class_subscriptions SET status='cancelled',updated_at=? WHERE room_id=? AND user_id=?").bind(Math.floor(Date.now()/1000),roomId,userId).run();}

export async function paidClassAccess(room:Pick<ClassRoom,"id"|"classType"|"tuitionCents">,user:SessionUser|null,startTrial=false){
  if(room.classType!=="trial"||room.tuitionCents<=0)return {allowed:true as const,status:"free" as const};
  if(!user)return {allowed:false as const,reason:"SIGN_IN_REQUIRED" as const};
  const now=Math.floor(Date.now()/1000),db=getDatabase();
  const current=await db.prepare("SELECT status,trial_ends_at AS trialEndsAt FROM class_subscriptions WHERE room_id=? AND user_id=? LIMIT 1").bind(room.id,user.id).first<{status:string;trialEndsAt:number|null}>();
  if(current?.status==="active")return {allowed:true as const,status:"active" as const};
  if(current?.status==="trial"&&Number(current.trialEndsAt||0)>now)return {allowed:true as const,status:"trial" as const,trialEndsAt:Number(current.trialEndsAt)};
  if(current&&(current.status==="trial"||current.status==="expired")){await db.prepare("UPDATE class_subscriptions SET status='expired',updated_at=? WHERE room_id=? AND user_id=?").bind(now,room.id,user.id).run();return {allowed:false as const,reason:"PAYMENT_REQUIRED" as const};}
  if(!startTrial)return {allowed:false as const,reason:"TRIAL_AVAILABLE" as const};
  const ends=now+CLASS_TRIAL_SECONDS;
  await db.prepare(`INSERT INTO class_subscriptions(room_id,user_id,email,status,trial_started_at,trial_ends_at,created_at,updated_at) VALUES(?,?,?,'trial',?,?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET status='trial',trial_started_at=excluded.trial_started_at,trial_ends_at=excluded.trial_ends_at,updated_at=excluded.updated_at`).bind(room.id,user.id,user.email,now,ends,now,now).run();
  return {allowed:true as const,status:"trial" as const,trialEndsAt:ends};
}
