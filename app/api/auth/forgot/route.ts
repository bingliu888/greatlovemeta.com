import { createId, getDatabase } from "../../../../lib/auth";

type UserRow = { id: string };

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string; lang?: string };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const user = await getDatabase().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (user) {
    const now = Math.floor(Date.now() / 1000);
    await getDatabase().prepare(
      "INSERT INTO password_reset_requests (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    ).bind(createId(), user.id, now + 3600, now).run();
  }
  return Response.json({ ok: true });
}
