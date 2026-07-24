import { and, count, desc, eq, sum } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../db";
import { notificationPreferences, referralCodes, referrals, rewardLedger, subscriptions, users } from "../../../db/schema";
import { createId } from "../../../lib/auth";
import { getPublishedPrices } from "../../../lib/paypal";
import { requestUser } from "../../../lib/request-user";

const REFERRAL_CODE_LENGTH = 6;
const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(REFERRAL_CODE_LENGTH));
  return Array.from(bytes, value => REFERRAL_ALPHABET[value % REFERRAL_ALPHABET.length]).join("");
}

async function nextAvailableReferralCode() {
  const db = getDb();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = makeCode();
    const [existing] = await db.select({ id: referralCodes.id }).from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
    if (!existing) return code;
  }
  throw new Error("Unable to create a unique referral code");
}

async function ensureReferralCode(userId: string) {
  const db = getDb();
  let [row] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  if (row && !REFERRAL_CODE_PATTERN.test(row.code)) {
    const code = await nextAvailableReferralCode();
    await db.update(referralCodes).set({ code }).where(eq(referralCodes.id, row.id));
    row = { ...row, code };
  }
  for (let attempt = 0; !row && attempt < 4; attempt += 1) {
    await db.insert(referralCodes).values({ id: createId(), userId, code: await nextAvailableReferralCode(), createdAt: Math.floor(Date.now() / 1000) }).onConflictDoNothing();
    [row] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  }
  if (!row) throw new Error("Unable to create referral code");
  return row;
}

async function claimReferral(userId: string, suppliedCode?: string) {
  const code = (suppliedCode || (await cookies()).get("greatlovemeta_referral_code")?.value || "").trim().toUpperCase();
  if (!code) return { claimed: false, reason: "missing" as const };
  if (!REFERRAL_CODE_PATTERN.test(code)) return { claimed: false, reason: "invalid" as const };
  const db = getDb();
  const [owner] = await db.select({ id: referralCodes.id, userId: referralCodes.userId }).from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
  if (!owner) return { claimed: false, reason: "invalid" as const };
  if (owner.userId === userId) return { claimed: false, reason: "self" as const };
  const now = Math.floor(Date.now() / 1000);
  await db.insert(referrals).values({ id: createId(), referralCodeId: owner.id, referredUserId: userId, createdAt: now, updatedAt: now }).onConflictDoNothing();
  const [referral] = await db.select().from(referrals).where(eq(referrals.referredUserId, userId)).limit(1);
  if (!referral || referral.referralCodeId !== owner.id) return { claimed: false, reason: "assigned" as const };
  await db.insert(rewardLedger).values({ id: createId(), userId, points: 100, reason: "referral_join", reference: `referral:${referral.id}:referred`, createdAt: now }).onConflictDoNothing();
  await db.insert(rewardLedger).values({ id: createId(), userId: owner.userId, points: 100, reason: "referral_invite", reference: `referral:${referral.id}:referrer`, createdAt: now }).onConflictDoNothing();
  return { claimed: true, reason: "ok" as const };
}

export async function GET() {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  await claimReferral(user.id);
  const db = getDb();
  const code = await ensureReferralCode(user.id);
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
  const [balance] = await db.select({ value: sum(rewardLedger.points) }).from(rewardLedger).where(eq(rewardLedger.userId, user.id));
  const [pending] = await db.select({ value: count() }).from(referrals).where(and(eq(referrals.referralCodeId, code.id), eq(referrals.status, "pending")));
  const [qualified] = await db.select({ value: count() }).from(referrals).where(and(eq(referrals.referralCodeId, code.id), eq(referrals.status, "qualified")));
  const [preference] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, user.id)).limit(1);
  const [attribution] = await db.select({ id: referrals.id }).from(referrals).where(eq(referrals.referredUserId, user.id)).limit(1);
  const joined = await db.select({ id: users.id, referralId: referrals.id, displayName: users.displayName, status: referrals.status, joinedAt: referrals.createdAt, memberSince: users.createdAt }).from(referrals).innerJoin(users, eq(referrals.referredUserId, users.id)).where(eq(referrals.referralCodeId, code.id)).orderBy(desc(referrals.createdAt)).limit(50);
  const ledger = await db.select({ id: rewardLedger.id, points: rewardLedger.points, reason: rewardLedger.reason, reference: rewardLedger.reference, createdAt: rewardLedger.createdAt }).from(rewardLedger).where(eq(rewardLedger.userId, user.id)).orderBy(desc(rewardLedger.createdAt)).limit(50);
  return Response.json({ pricing: await getPublishedPrices(), subscription: subscription ?? null, referral: { code: code.code, url: `https://greatlovemeta.com/r/${code.code}`, pending: pending.value, qualified: qualified.value, discountEligible: Boolean(attribution), needsReferral: !attribution, joined }, points: Number(balance.value ?? 0), rewardHistory: ledger, notifications: preference ?? { language: user.preferredLanguage, marketingEmail: false, productEmail: true, reminderEmail: true } });
}

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = (await request.json()) as { action?: string; referralCode?: string; recipientId?: string; points?: number; language?: string; marketingEmail?: boolean; productEmail?: boolean; reminderEmail?: boolean };
  if (payload.action === "claim_referral") {
    const result = await claimReferral(user.id, payload.referralCode);
    const status = result.reason === "invalid" || result.reason === "self" || result.reason === "assigned" ? 400 : 200;
    return Response.json(result, { status });
  }
  if (payload.action === "tip") {
    const recipientId = String(payload.recipientId || ""); const points = Math.floor(Number(payload.points));
    if (!recipientId || ![10, 25, 50, 100].includes(points)) return Response.json({ error: "Invalid tip" }, { status: 400 });
    if (recipientId === user.id) return Response.json({ error: "self" }, { status: 400 });
    const db = getDb();
    const [recipient] = await db.select({ id: users.id }).from(users).where(eq(users.id, recipientId)).limit(1);
    if (!recipient) return Response.json({ error: "not_found" }, { status: 404 });
    const [balance] = await db.select({ value: sum(rewardLedger.points) }).from(rewardLedger).where(eq(rewardLedger.userId, user.id));
    if (Number(balance.value ?? 0) < points) return Response.json({ error: "insufficient" }, { status: 400 });
    const transfer = createId(); const now = Math.floor(Date.now() / 1000);
    await db.insert(rewardLedger).values({ id: createId(), userId: user.id, points: -points, reason: "community_tip_sent", reference: `tip:${transfer}:sent`, createdAt: now });
    await db.insert(rewardLedger).values({ id: createId(), userId: recipientId, points, reason: "community_tip_received", reference: `tip:${transfer}:received`, createdAt: now });
    return Response.json({ ok: true, transfer, points });
  }
  const now = Math.floor(Date.now() / 1000);
  const values = { userId: user.id, language: payload.language === "zh" ? "zh" : "en", marketingEmail: Boolean(payload.marketingEmail), productEmail: payload.productEmail !== false, reminderEmail: payload.reminderEmail !== false, updatedAt: now };
  await getDb().insert(notificationPreferences).values(values).onConflictDoUpdate({ target: notificationPreferences.userId, set: values });
  return Response.json({ ok: true, notifications: values });
}
