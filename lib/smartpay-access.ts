import { currentUser } from "@clerk/nextjs/server";
import { getDatabase, getSessionUser, type SessionUser } from "./auth";
import { matchesFreshPermanentAdminIdentity } from "./permanent-admin-identity";

export const BOOTSTRAP_ADMIN_EMAIL = "bingliu@cybeye.com";

export type SmartPayMember = SessionUser & { payerWalletAddress: string | null; emailVerified: boolean };

export async function requireMember(request?: Request) {
  const member = await getSessionUser(request);
  if (!member) throw new Response("Unauthorized", { status: 401 });
  const profile = await getDatabase().prepare(`SELECT wallet_address AS payerWalletAddress,
      email_verified AS emailVerified FROM users WHERE id=? LIMIT 1`)
    .bind(member.id).first<{ payerWalletAddress: string | null; emailVerified: number }>();
  return {
    ...member,
    payerWalletAddress: profile?.payerWalletAddress || null,
    emailVerified: Boolean(profile?.emailVerified),
  };
}

export async function requirePermanentAdmin(request?: Request) {
  const member = await requireMember(request);
  if (!await hasFreshPermanentAdmin(member)) throw new Response("Forbidden", { status: 403 });
  return member;
}

export async function hasFreshPermanentAdmin(member: SmartPayMember) {
  if (!member.emailVerified || member.email.trim().toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL) return false;
  try {
    const identity = await currentUser();
    return matchesFreshPermanentAdminIdentity(member, identity, BOOTSTRAP_ADMIN_EMAIL);
  } catch {
    return false;
  }
}
