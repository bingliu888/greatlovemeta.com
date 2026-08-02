import { getDatabase, getSessionUser, type SessionUser } from "./auth";
export const BOOTSTRAP_ADMIN_EMAIL="bingliu@cybeye.com";
export function isBootstrapAdminEmail(email:string){return email.trim().toLowerCase()===BOOTSTRAP_ADMIN_EMAIL}
export async function isAdminUser(user:SessionUser|null){if(!user)return false;if(isBootstrapAdminEmail(user.email)){const now=Math.floor(Date.now()/1000);await getDatabase().prepare("INSERT OR IGNORE INTO platform_user_roles(user_id,role,updated_by_user_id,created_at,updated_at) VALUES(?,?,?,?,?)").bind(user.id,"admin",user.id,now,now).run();return true;}const row=await getDatabase().prepare("SELECT role FROM platform_user_roles WHERE user_id=? LIMIT 1").bind(user.id).first<{role:string}>();return row?.role==="admin"}
export async function getAdminUser(request?:Request){const user=await getSessionUser(request);return await isAdminUser(user)?user:null}
