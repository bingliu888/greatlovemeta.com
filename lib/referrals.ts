import { createId, getDatabase } from "./auth";
import { ensureRefId, normalizeRefId } from "./ref-id";

export const normalizeReferralCode = normalizeRefId;

export async function ensureReferralCode(userId: string) {
  return { code: await ensureRefId(userId) };
}

export async function awardReferralForSubscription(input: {
  userId: string;
  subscriptionId: string;
  providerPaymentReference: string;
}) {
  const db = getDatabase();
  const referral = await db.prepare(`SELECT r.id,r.referral_code_id AS referralCodeId,rc.user_id AS ownerUserId
    FROM referrals r JOIN referral_codes rc ON rc.id=r.referral_code_id
    WHERE r.referred_user_id=? AND r.qualified_at IS NULL LIMIT 1`)
    .bind(input.userId).first<{ id: string; referralCodeId: string; ownerUserId: string }>();
  if (!referral) return;
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare("UPDATE referrals SET status='qualified',first_payment_id=?,qualified_at=?,updated_at=? WHERE id=? AND qualified_at IS NULL")
      .bind(input.providerPaymentReference, now, now, referral.id),
    db.prepare("INSERT OR IGNORE INTO reward_ledger(id,user_id,points,reason,reference,created_at) VALUES(?,?,100,'qualified_referral',?,?)")
      .bind(createId(), referral.ownerUserId, `subscription:${input.subscriptionId}:owner`, now),
    db.prepare("INSERT OR IGNORE INTO reward_ledger(id,user_id,points,reason,reference,created_at) VALUES(?,?,100,'qualified_referral',?,?)")
      .bind(createId(), input.userId, `subscription:${input.subscriptionId}:member`, now)
  ]);
}
