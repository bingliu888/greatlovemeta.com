import type { SessionUser } from "./auth";
import { isPermanentAdminUser } from "./admin-access";
import {
  hasFreshPermanentAdmin,
  requireMember,
  requirePermanentAdmin
} from "./smartpay-access";

export { hasFreshPermanentAdmin, requireMember, requirePermanentAdmin };
export const isPermanentAdmin = (member: SessionUser | null) =>
  isPermanentAdminUser(member);
