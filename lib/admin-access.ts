import { getDatabase, getSessionUser, type SessionUser } from "./auth";
export const BOOTSTRAP_ADMIN_EMAIL="bingliu@cybeye.com";
export function isBootstrapAdminEmail(email:string){return email.trim().toLowerCase()===BOOTSTRAP_ADMIN_EMAIL}
export async function isAdminUser(user:SessionUser|null){if(!user)return false;if(isBootstrapAdminEmail(user.email))return true;const row=await getDatabase().prepare("SELECT role FROM platform_user_roles WHERE user_id=? LIMIT 1").bind(user.id).first<{role:string}>();return row?.role==="admin"}
export async function getAdminUser(request?:Request){const user=await getSessionUser(request);return await isAdminUser(user)?user:null}
