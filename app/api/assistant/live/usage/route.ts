import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { liveVoiceUsage, subscriptions } from "../../../../../db/schema";
import { requestUser } from "../../../../../lib/request-user";

const FREE_SECONDS = 600;
const dateKey = () => new Date().toISOString().slice(0, 10);

async function status(userId: string) {
  const db = getDb();
  const [subscription] = await db.select({ status: subscriptions.status }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const paid = subscription?.status === "active" || subscription?.status === "trialing";
  const day = dateKey();
  const [usage] = await db.select().from(liveVoiceUsage).where(and(eq(liveVoiceUsage.userId, userId), eq(liveVoiceUsage.usageDate, day))).limit(1);
  const usedSeconds = usage?.usedSeconds ?? 0;
  return { paid, usedSeconds, remainingSeconds: paid ? null : Math.max(0, FREE_SECONDS - usedSeconds), day };
}

export async function GET() {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  return Response.json(await status(user.id));
}

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const current = await status(user.id);
  if (current.paid) return Response.json(current);
  const body = await request.json().catch(() => ({})) as { seconds?: unknown };
  const seconds = Math.max(1, Math.min(60, Math.floor(Number(body.seconds) || 0)));
  const db = getDb();
  const id = `${user.id}:${current.day}`;
  const now = Math.floor(Date.now() / 1000);
  await db.insert(liveVoiceUsage).values({ id, userId: user.id, usageDate: current.day, usedSeconds: seconds, updatedAt: now }).onConflictDoUpdate({ target: liveVoiceUsage.id, set: { usedSeconds: sql`min(${FREE_SECONDS}, ${liveVoiceUsage.usedSeconds} + ${seconds})`, updatedAt: now } });
  return Response.json(await status(user.id));
}
