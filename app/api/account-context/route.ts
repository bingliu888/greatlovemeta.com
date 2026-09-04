import { getSessionUser } from "../../../lib/auth";
import { isAdminUser, isPermanentAdminUser } from "../../../lib/admin-access";
export async function GET(request:Request){const user=await getSessionUser(request);return Response.json({signedIn:Boolean(user),isAdmin: await isAdminUser(user), isPermanentAdmin: await isPermanentAdminUser(user)},{headers:{"cache-control":"private, no-store"}})}
