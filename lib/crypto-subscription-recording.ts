import type { CryptoSubscriptionPlan } from "./crypto-subscription";

export function subscriptionMonths(plan: CryptoSubscriptionPlan) {
  return plan === "annual" ? 12 : 1;
}

export function subscriptionWindow(input: { now: number; months: number; currentPeriodEnd?: number | null }) {
  const now = Math.max(0, Math.floor(input.now));
  const start = Math.max(now, Math.max(0, Math.floor(input.currentPeriodEnd || 0)));
  const end = new Date(start * 1000);
  end.setUTCMonth(end.getUTCMonth() + Math.max(1, Math.floor(input.months)));
  return { start, end: Math.floor(end.getTime() / 1000) };
}

export const SMARTPAY5_SUBSCRIPTION_UPSERT_SQL = `WITH claim_ready AS (
  SELECT 1 FROM smartpay5_payment_claims
  WHERE lower(contract_address)=lower(?) AND lower(transaction_id)=lower(?)
    AND user_id=? AND entitlement_status='pending_sync'
), subscription_window(start_at) AS (
  SELECT MAX(?,COALESCE(MAX(current_period_ends_at),0))
  FROM subscriptions WHERE user_id=?
)
INSERT INTO subscriptions
  (id,user_id,paypal_subscription_id,paypal_plan_id,cadence,status,trial_ends_at,current_period_ends_at,
   cancel_at_period_end,referral_id,created_at,updated_at)
SELECT ?,?,NULL,NULL,?,'active',NULL,
  CAST(strftime('%s',start_at,'unixepoch','+' || ? || ' months') AS INTEGER),
  0,NULL,?,?
FROM subscription_window,claim_ready
WHERE 1
ON CONFLICT(user_id) DO UPDATE SET cadence=excluded.cadence,status='active',
  current_period_ends_at=excluded.current_period_ends_at,cancel_at_period_end=0,
  updated_at=excluded.updated_at`;

export function smartPay5SubscriptionUpsertValues(input: {
  contract: string;
  transactionId: string;
  subscriptionId: string;
  userId: string;
  cadence: CryptoSubscriptionPlan;
  months: number;
  paymentTime: number;
  verifiedAt: number;
}) {
  const months = Math.max(1, Math.floor(input.months));
  return {
    months,
    values: [input.contract,input.transactionId,input.userId,input.paymentTime,input.userId,
      input.subscriptionId,input.userId,input.cadence,months,input.paymentTime,input.verifiedAt] as const,
  };
}
