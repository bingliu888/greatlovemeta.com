import { requestUser } from "../../../lib/request-user";
import { getDatabase } from "../../../lib/auth";

export const dynamic = "force-dynamic";
const MAX_BYTES = 15 * 1024 * 1024;
const allowed = (type: string) => type.startsWith("image/") || type.startsWith("audio/") || type.startsWith("video/") || type === "application/pdf" || type === "text/plain";
function bucket() { const value = (globalThis as unknown as { __GREATLOVEMETA_BUCKET__?: R2Bucket }).__GREATLOVEMETA_BUCKET__; if (!value) throw new Error("Message storage unavailable"); return value; }
async function participant(threadId: string, userId: string) { return getDatabase().prepare("SELECT id FROM message_participants WHERE thread_id = ? AND user_id = ? AND deleted_at IS NULL").bind(threadId, userId).first(); }

export async function GET(request: Request) {
  const user = await requestUser(); if (!user) return Response.json({ error: "Authentication required" }, { status: 401 }); const url = new URL(request.url); const threadId = url.searchParams.get("thread") || ""; const id = url.searchParams.get("id") || ""; const db = getDatabase();
  if (!threadId || !id || !await participant(threadId, user.id)) return Response.json({ error: "Attachment not found" }, { status: 404 });
  const message = await db.prepare("SELECT body FROM messages WHERE thread_id = ? AND deleted_at IS NULL AND body LIKE ?").bind(threadId, `%\"id\":\"${id}\"%`).first<{ body: string }>();
  if (!message?.body.startsWith("__ATTACHMENT__|")) return Response.json({ error: "Attachment not found" }, { status: 404 });
  const meta = JSON.parse(message.body.slice(15)) as { name: string; mimeType: string; size: number }; const object = await bucket().get(`message-media/${threadId}/${id}`); if (!object) return Response.json({ error: "Attachment unavailable" }, { status: 404 });
  return new Response(object.body, { headers: { "content-type": meta.mimeType, "content-length": String(meta.size), "cache-control": "private, max-age=300", "content-disposition": `inline; filename="${meta.name.replace(/["\\]/g, "_")}"` } });
}

export async function POST(request: Request) {
  const user = await requestUser(); if (!user) return Response.json({ error: "Authentication required" }, { status: 401 }); const form = await request.formData(); const file = form.get("file"); const threadId = String(form.get("threadId") || ""); const db = getDatabase();
  if (!threadId || !(file instanceof File) || !file.size || file.size > MAX_BYTES || !allowed(file.type) || !await participant(threadId, user.id)) return Response.json({ error: "Invalid attachment" }, { status: 400 });
  const id = crypto.randomUUID(); const name = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(-100) || `attachment-${id}`; const meta = { id, name, mimeType: file.type || "application/octet-stream", size: file.size, url: `/api/message-media?thread=${encodeURIComponent(threadId)}&id=${encodeURIComponent(id)}` }; await bucket().put(`message-media/${threadId}/${id}`, file.stream(), { httpMetadata: { contentType: meta.mimeType } });
  try { const now = Math.floor(Date.now() / 1000); await db.prepare("INSERT INTO messages (id, thread_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), threadId, user.id, `__ATTACHMENT__|${JSON.stringify(meta)}`, now).run(); await db.prepare("UPDATE message_threads SET updated_at = ? WHERE id = ?").bind(now, threadId).run(); }
  catch (error) { await bucket().delete(`message-media/${threadId}/${id}`); throw error; }
  return Response.json({ attachment: meta }, { status: 201 });
}
