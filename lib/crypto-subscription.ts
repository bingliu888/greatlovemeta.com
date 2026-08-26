import type { SubscriptionPlanId } from "./subscription-plans";

export const CRYPTO_SUBSCRIPTION_SECOND_ID = "";
export const CRYPTO_SUBSCRIPTION_MAIN_IDS = {
  monthly: "greatlovemeta_membership_monthly",
  annual: "greatlovemeta_membership_annual"
} as const;

export type CryptoSubscriptionPlan = SubscriptionPlanId;

export function normalizeCryptoSubscriptionPlan(plan: unknown): CryptoSubscriptionPlan {
  return plan === "annual" ? plan : "monthly";
}

export function cryptoSubscriptionIdsForPlan(plan: string) {
  const billingPlan = normalizeCryptoSubscriptionPlan(plan);
  return { mainId: CRYPTO_SUBSCRIPTION_MAIN_IDS[billingPlan], secondId: CRYPTO_SUBSCRIPTION_SECOND_ID };
}

export function cryptoSubscriptionPlanForIds(mainId: string, secondId: string): CryptoSubscriptionPlan | null {
  if (secondId !== CRYPTO_SUBSCRIPTION_SECOND_ID) return null;
  const entry = Object.entries(CRYPTO_SUBSCRIPTION_MAIN_IDS).find(([, value]) => value === mainId);
  return entry?.[0] as CryptoSubscriptionPlan | undefined || null;
}
