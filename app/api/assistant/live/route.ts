import { sha256 } from "../../../../lib/auth";
import { requestUser } from "../../../../lib/request-user";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { liveVoiceUsage, subscriptions } from "../../../../db/schema";

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const db = getDb();
  const [subscription] = await db.select({ status: subscriptions.status }).from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
  const paid = subscription?.status === "active" || subscription?.status === "trialing";
  if (!paid) {
    const day = new Date().toISOString().slice(0, 10);
    const [usage] = await db.select({ seconds: liveVoiceUsage.usedSeconds }).from(liveVoiceUsage).where(and(eq(liveVoiceUsage.userId, user.id), eq(liveVoiceUsage.usageDate, day))).limit(1);
    if ((usage?.seconds ?? 0) >= 600) return Response.json({ error: "Today's 10-minute free Live allowance has been used. Upgrade to continue." }, { status: 429 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Live voice setup is not complete yet." }, { status: 503 });
  const sdp = await request.text();
  if (!sdp || sdp.length > 100_000) return Response.json({ error: "Invalid voice connection request." }, { status: 400 });
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify({ type: "realtime", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1-mini", instructions: "You are the bilingual live voice assistant for GreatLoveMeta.com. Match the user's language. Help with the GreatLove AI, RWA, NFT, membership and community ecosystem, plus site navigation, events and projects. Be concise, neutral, and explicit about uncertainty.", audio: { output: { voice: "marin" } } }));
  const response = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "OpenAI-Safety-Identifier": await sha256(`greatlovemeta:${user.id}`) }, body: form });
  const answer = await response.text();
  return new Response(answer, { status: response.status, headers: { "content-type": response.ok ? "application/sdp" : "application/json" } });
}
