import type { SessionUser } from "./auth";
import {
  BOOTSTRAP_ADMIN_EMAIL,
  requireMember,
  requirePermanentAdmin
} from "./smartpay-access";

export { requireMember, requirePermanentAdmin };
export const isPermanentAdmin = (member: Pick<SessionUser, "email">) =>
  member.email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
