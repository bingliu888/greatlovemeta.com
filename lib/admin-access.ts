import { currentUser } from "@clerk/nextjs/server";
import { getDatabase, getSessionUser, type SessionUser } from "./auth";
import { matchesFreshPermanentAdminIdentity } from "./permanent-admin-identity";
export const BOOTSTRAP_ADMIN_EMAIL="bingliu@cybeye.com";
export function isBootstrapAdminEmail(email:string){return email.trim().toLowerCase()===BOOTSTRAP_ADMIN_EMAIL}
export async function isPermanentAdminUser(user:SessionUser|null){
  if(!user||!isBootstrapAdminEmail(user.email))return false;
  const local=await getDatabase().prepare("SELECT email,email_verified AS emailVerified FROM users WHERE id=? LIMIT 1")
    .bind(user.id).first<{email:string;emailVerified:number}>();
  if(!local||!local.emailVerified||!isBootstrapAdminEmail(local.email))return false;
  try{return matchesFreshPermanentAdminIdentity(local,await currentUser(),BOOTSTRAP_ADMIN_EMAIL)}catch{return false}
}
export async function isAdminUser(user:SessionUser|null){if(!user)return false;if(isBootstrapAdminEmail(user.email)){if(!await isPermanentAdminUser(user))return false;const now=Math.floor(Date.now()/1000);await getDatabase().prepare("INSERT OR IGNORE INTO platform_user_roles(user_id,role,updated_by_user_id,created_at,updated_at) VALUES(?,?,?,?,?)").bind(user.id,"admin",user.id,now,now).run();return true;}const row=await getDatabase().prepare("SELECT role FROM platform_user_roles WHERE user_id=? LIMIT 1").bind(user.id).first<{role:string}>();return row?.role==="admin"}
export async function getAdminUser(request?:Request){const user=await getSessionUser(request);return await isPermanentAdminUser(user)?user:null}

export async function isTeacherUser(user: Parameters<typeof isAdminUser>[0]) {
  if (!user) return false;
  if (await isAdminUser(user)) return true;
  const database = getDatabase();
  const row = await database.prepare("SELECT subscriber_override AS subscriberOverride FROM platform_member_access WHERE user_id=? AND status='active' LIMIT 1").bind(user.id).first() as { subscriberOverride?: number } | null;
  return Number(row?.subscriberOverride || 0) === 1;
}
