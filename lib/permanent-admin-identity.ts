type AdminMemberIdentity = { email: string; emailVerified: boolean | number };
type ClerkIdentitySnapshot = { banned?: boolean; locked?: boolean; primaryEmailAddressId?: string | null; emailAddresses: ReadonlyArray<{ id: string; emailAddress: string; verification?: { status?: string | null } | null }> };
export function matchesFreshPermanentAdminIdentity(member: AdminMemberIdentity, identity: ClerkIdentitySnapshot | null, permanentAdminEmail: string) {
  const expected = permanentAdminEmail.trim().toLowerCase();
  if (!member.emailVerified || member.email.trim().toLowerCase() !== expected || !identity || identity.banned || identity.locked) return false;
  if (!identity.primaryEmailAddressId) return false;
  const primary = identity.emailAddresses.find(address => address.id === identity.primaryEmailAddressId);
  const currentEmail = primary?.emailAddress.trim().toLowerCase() || "";
  return primary?.verification?.status === "verified" && currentEmail === expected && currentEmail === member.email.trim().toLowerCase();
}
