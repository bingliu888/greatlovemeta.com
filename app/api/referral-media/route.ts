import { sha256 } from "../../../lib/auth";
import { requestUser } from "../../../lib/request-user";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { referralMedia } from "../../../db/schema";

type ImageResponse = { data?: Array<{ b64_json?: string }>; error?: { message?: string } };

const STYLE_PROMPTS: Record<string, string> = {
  anime: "A polished contemporary anime illustration with expressive color, graceful shapes, warm cinematic light, refined editorial composition, and mature visual appeal.",
  classic: "An elegant GreatLove Meta card-table still life: refined dark wood, ivory felt, subtle Chinese decorative motifs, neatly arranged playing cards with no readable ranks, and warm gallery lighting. Absolutely no people, hands, faces, bodies, or silhouettes.",
  festive: "A sophisticated Chinese paper-cut inspired anime illustration with vermilion, warm ivory, jade green, celebratory ribbons, playing-card motifs, and tasteful festive energy.",
  minimal: "A minimalist editorial composition about portable digital identity and global connection, with an abstract globe, linked nodes, deep green and warm ivory negative space, and clean geometric lighting. Absolutely no people, hands, faces, bodies, or silhouettes.",
};

const MAX_MEDIA_ITEMS = 12;
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;

function bucket() {
  const binding = (globalThis as unknown as { __GREATLOVEMETA_BUCKET__?: R2Bucket }).__GREATLOVEMETA_BUCKET__;
  if (!binding) throw new Error("Media storage is unavailable");
  return binding;
}

function publicItem(item: typeof referralMedia.$inferSelect) {
  return { id: item.id, kind: item.kind, mimeType: item.mimeType, name: item.name, createdAt: item.createdAt * 1000, url: `/api/referral-media?id=${encodeURIComponent(item.id)}` };
}

export async function GET(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const db = getDb();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    const items = await db.select().from(referralMedia).where(eq(referralMedia.userId, user.id)).orderBy(desc(referralMedia.createdAt)).limit(MAX_MEDIA_ITEMS);
    return Response.json({ items: items.map(publicItem) });
  }
  const [item] = await db.select().from(referralMedia).where(and(eq(referralMedia.id, id), eq(referralMedia.userId, user.id))).limit(1);
  if (!item) return Response.json({ error: "Media not found." }, { status: 404 });
  const object = await bucket().get(item.objectKey);
  if (!object) return Response.json({ error: "Media file is unavailable." }, { status: 404 });
  return new Response(object.body, { headers: { "content-type": item.mimeType, "content-length": String(item.sizeBytes), "cache-control": "private, max-age=300", "content-disposition": `inline; filename="${item.name.replace(/["\\]/g, "_")}"` } });
}

export async function PUT(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "video" ? "video" : "image";
  if (!(file instanceof File) || !file.size || file.size > MAX_MEDIA_BYTES || !file.type.startsWith(`${kind}/`)) return Response.json({ error: "Invalid media file." }, { status: 400 });
  const id = crypto.randomUUID();
  const objectKey = `referral-media/${user.id}/${id}`;
  const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || `${kind}-${id}`;
  const storage = bucket();
  await storage.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
  const db = getDb();
  const createdAt = Math.floor(Date.now() / 1000);
  try {
    await db.insert(referralMedia).values({ id, userId: user.id, kind, objectKey, mimeType: file.type, name, sizeBytes: file.size, createdAt });
  } catch (error) {
    await storage.delete(objectKey);
    throw error;
  }
  const items = await db.select().from(referralMedia).where(eq(referralMedia.userId, user.id)).orderBy(desc(referralMedia.createdAt));
  for (const old of items.slice(MAX_MEDIA_ITEMS)) { await storage.delete(old.objectKey); await db.delete(referralMedia).where(eq(referralMedia.id, old.id)); }
  const [saved] = await db.select().from(referralMedia).where(eq(referralMedia.id, id)).limit(1);
  return Response.json({ item: publicItem(saved) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  const db = getDb();
  const [item] = await db.select().from(referralMedia).where(and(eq(referralMedia.id, id), eq(referralMedia.userId, user.id))).limit(1);
  if (!item) return Response.json({ error: "Media not found." }, { status: 404 });
  await bucket().delete(item.objectKey);
  await db.delete(referralMedia).where(eq(referralMedia.id, item.id));
  return Response.json({ ok: true });
}

function cleanPrompt(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "AI image setup is not complete yet." }, { status: 503 });

  const body = await request.json().catch(() => ({})) as { language?: string; style?: string; stylePrompt?: string };
  const zh = body.language === "zh";
  const style = Object.hasOwn(STYLE_PROMPTS, body.style || "") ? body.style! : "anime";
  const custom = cleanPrompt(body.stylePrompt);
  const excludesPeople = style === "classic" || style === "minimal";
  const prompt = [
    "Create a square, high-quality social invitation BACKGROUND for GreatLoveMeta.com, a trusted bilingual digital-citizen identity and global community platform.",
    STYLE_PROMPTS[style],
    custom ? `User art direction: ${custom}. Follow it only when it does not conflict with the mandatory rules below.` : "",
    zh ? "Use contemporary Chinese cultural warmth with global connectivity and constructive civic participation." : "Use a contemporary international mood centered on global connectivity and constructive civic participation.",
    excludesPeople
      ? "MANDATORY: this is a still-life scene only. Do not show any human, person, face, hand, arm, body, crowd, portrait, reflection, shadow, or human silhouette."
      : "If people are present, render them as a diverse, tasteful anime-style global community; avoid photorealistic faces.",
    "Leave the lower 40 percent relatively calm and uncluttered so the website can add exact referral text afterward.",
    "MANDATORY: generate background art only. Do not include words, text, letters, numbers, URLs, referral codes, logos, QR codes, watermarks, captions, or signs.",
    "Do not show national political campaign symbols, gambling, weapons, alcohol, or hostile imagery.",
  ].filter(Boolean).join(" ");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "OpenAI-Safety-Identifier": await sha256(`greatlovemeta-share:${user.id}`),
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini",
      prompt,
      size: "1024x1024",
      quality: "low",
      output_format: "png",
      n: 1,
    }),
  });
  const data = await response.json().catch(() => ({})) as ImageResponse;
  const image = data.data?.[0]?.b64_json;
  if (!response.ok || !image) {
    return Response.json({ error: data.error?.message || "The invitation image could not be generated." }, { status: 502 });
  }
  return Response.json({ image: `data:image/png;base64,${image}` });
}
