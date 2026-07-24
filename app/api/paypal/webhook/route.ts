import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentWebhookEvents, referralCodes, referrals, rewardLedger, subscriptions } from "../../../../db/schema";
import { createId } from "../../../../lib/auth";
import { callPayPal, getPayPalConfig } from "../../../../lib/paypal";

type Event = { id: string; event_type: string; resource?: Record<string, unknown> };

async function verified(request: Request, event: Event) {
  const config = await getPayPalConfig();
  if (!config?.webhookId) return false;
  const result = await callPayPal<{ verification_status: string }>(config, "/v1/notifications/verify-webhook-signature", { method: "POST", body: JSON.stringify({ auth_algo: request.headers.get("paypal-auth-algo"), cert_url: request.headers.get("paypal-cert-url"), transmission_id: request.headers.get("paypal-transmission-id"), transmission_sig: request.headers.get("paypal-transmission-sig"), transmission_time: request.headers.get("paypal-transmission-time"), webhook_id: config.webhookId, webhook_event: event }) });
  return result.verification_status === "SUCCESS";
}

export async function POST(request: Request) {
  const event = (await request.json()) as Event;
  if (!event.id || !event.event_type || !(await verified(request, event))) return Response.json({ error: "Invalid webhook" }, { status: 400 });
  const db = getDb();
  if ((await db.select().from(paymentWebhookEvents).where(eq(paymentWebhookEvents.id, event.id)).limit(1))[0]) return Response.json({ ok: true, duplicate: true });
  const paypalId = String(event.resource?.billing_agreement_id ?? event.resource?.id ?? "");
  const [subscription] = paypalId ? await db.select().from(subscriptions).where(eq(subscriptions.paypalSubscriptionId, paypalId)).limit(1) : [];
  const now = Math.floor(Date.now() / 1000);
  if (subscription) {
    const state: Record<string, string> = { "BILLING.SUBSCRIPTION.ACTIVATED": "trialing", "BILLING.SUBSCRIPTION.CANCELLED": "cancelled", "BILLING.SUBSCRIPTION.SUSPENDED": "suspended", "BILLING.SUBSCRIPTION.EXPIRED": "expired", "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "past_due", "PAYMENT.SALE.COMPLETED": "active" };
    if (state[event.event_type]) await db.update(subscriptions).set({ status: state[event.event_type], updatedAt: now }).where(eq(subscriptions.id, subscription.id));
    if (event.event_type === "PAYMENT.SALE.COMPLETED" && subscription.referralId) {
      const [referral] = await db.select().from(referrals).where(eq(referrals.id, subscription.referralId)).limit(1);
      if (referral?.status === "pending") {
        const [owner] = await db.select({ userId: referralCodes.userId }).from(referralCodes).where(eq(referralCodes.id, referral.referralCodeId)).limit(1);
        const { env } = await import("cloudflare:workers");
        const points = Number((env as unknown as Record<string, string | undefined>).REFERRAL_REWARD_POINTS ?? "0");
        await db.update(referrals).set({ status: "qualified", firstPaymentId: String(event.resource?.id ?? event.id), qualifiedAt: now, rewardedAt: points > 0 ? now : null, updatedAt: now }).where(eq(referrals.id, referral.id));
        if (owner && points > 0) await db.insert(rewardLedger).values({ id: createId(), userId: owner.userId, points, reason: "qualified_referral", reference: `referral:${referral.id}`, createdAt: now }).onConflictDoNothing();
      }
    }
    if ((event.event_type === "PAYMENT.SALE.REFUNDED" || event.event_type === "PAYMENT.SALE.REVERSED") && subscription.referralId) {
      const [referral] = await db.select().from(referrals).where(eq(referrals.id, subscription.referralId)).limit(1);
      if (referral?.status === "qualified") {
        const [credit] = await db.select().from(rewardLedger).where(eq(rewardLedger.reference, `referral:${referral.id}`)).limit(1);
        await db.update(referrals).set({ status: "reversed", updatedAt: now }).where(eq(referrals.id, referral.id));
        if (credit) await db.insert(rewardLedger).values({ id: createId(), userId: credit.userId, points: -credit.points, reason: "referral_payment_reversed", reference: `referral-reversal:${referral.id}`, createdAt: now }).onConflictDoNothing();
      }
    }
  }
  await db.insert(paymentWebhookEvents).values({ id: event.id, eventType: event.event_type, processedAt: now });
  return Response.json({ ok: true });
}
