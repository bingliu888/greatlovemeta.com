import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { referrals, subscriptions } from "../../../../db/schema";
import { createId } from "../../../../lib/auth";
import { callPayPal, getPayPalConfig, getPlanId } from "../../../../lib/paypal";
import { requestUser } from "../../../../lib/request-user";

type Created = { id: string; status: string; links?: Array<{ rel: string; href: string }> };

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = (await request.json()) as { cadence?: string; language?: string };
  const cadence = input.cadence === "annual" ? "annual" : "monthly";
  const language = input.language === "zh" ? "zh" : "en";
  const db = getDb();
  const [referral] = await db.select().from(referrals).where(eq(referrals.referredUserId, user.id)).limit(1);
  const plan = await getPlanId(cadence, Boolean(referral));
  const config = await getPayPalConfig();
  if (!config || !plan) return Response.json({ error: "Billing is being configured. No payment was attempted." }, { status: 503 });
  const created = await callPayPal<Created>(config, "/v1/billing/subscriptions", {
    method: "POST",
    headers: { "PayPal-Request-Id": `greatlovemeta-${user.id}-${cadence}-${Date.now()}` },
    body: JSON.stringify({ plan_id: plan, custom_id: `greatlovemeta:${user.id}:${referral?.id ?? "none"}`, application_context: { brand_name: "GreatLoveMeta.com", locale: language === "zh" ? "zh-CN" : "en-US", user_action: "SUBSCRIBE_NOW", return_url: `https://greatlovemeta.com/${language}/dashboard?billing=approved`, cancel_url: `https://greatlovemeta.com/${language}/pricing?billing=cancelled` } }),
  });
  const now = Math.floor(Date.now() / 1000);
  await db.insert(subscriptions).values({ id: createId(), userId: user.id, paypalSubscriptionId: created.id, paypalPlanId: plan, cadence, status: created.status.toLowerCase(), referralId: referral?.id, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: subscriptions.userId, set: { paypalSubscriptionId: created.id, paypalPlanId: plan, cadence, status: created.status.toLowerCase(), referralId: referral?.id, updatedAt: now } });
  const approvalUrl = created.links?.find(link => link.rel === "approve")?.href;
  if (!approvalUrl) return Response.json({ error: "PayPal did not return an approval URL." }, { status: 502 });
  return Response.json({ approvalUrl });
}
