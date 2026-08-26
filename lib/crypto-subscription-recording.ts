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
