import { BOOTSTRAP_ADMIN_EMAIL } from "./smartpay-access";
import { database } from "./db";
import { ensureReferralCode, normalizeReferralCode } from "./referrals";
import { REF_ID_PATTERN } from "./ref-id";

export async function smartPayProductOwnerRefId() {
  const owner = await database().prepare(`SELECT id FROM users
    WHERE lower(email)=lower(?) AND email_verified=1
    ORDER BY created_at DESC LIMIT 1`)
    .bind(BOOTSTRAP_ADMIN_EMAIL)
    .first<{ id: string }>();
  if (!owner) throw new Error("SMARTPAY5_PRODUCT_OWNER_UNAVAILABLE");
  const refId = normalizeReferralCode((await ensureReferralCode(owner.id)).code);
  if (!REF_ID_PATTERN.test(refId)) throw new Error("SMARTPAY5_PRODUCT_OWNER_UNAVAILABLE");
  return refId;
}
