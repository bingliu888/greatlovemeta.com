import { createId, createSession, getDatabase, sha256 } from "../../../../lib/auth";

type CodeRow = { id: string; codeHash: string; expiresAt: number; attempts: number; usedAt: number | null };
type UserRow = { id: string; displayName: string };

export async function POST(request: Request) {
  const payload = await request.json() as { email?: string; code?: string; lang?: string };
  const lang = payload.lang === "zh" ? "zh" : "en";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const code = payload.code ?? "";
  if (!/^\d{6}$/.test(code)) return Response.json({ error: lang === "zh" ? "请输入 6 位验证码。" : "Enter the 6-digit code." }, { status: 400 });
  const secret = process.env.AUTH_CODE_SECRET;
  if (!secret) return Response.json({ error: lang === "zh" ? "邮件登录正在配置中。" : "Email login is being configured." }, { status: 503 });
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const record = await database.prepare("SELECT id, code_hash AS codeHash, expires_at AS expiresAt, attempts, used_at AS usedAt FROM passwordless_login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1").bind(email).first<CodeRow>();
  const invalid = () => Response.json({ error: lang === "zh" ? "验证码无效或已过期。" : "The code is invalid or expired." }, { status: 401 });
  if (!record || record.usedAt || record.attempts >= 5 || record.expiresAt <= now) return invalid();
  if (await sha256(`${secret}:${email}:${code}`) !== record.codeHash) { await database.prepare("UPDATE passwordless_login_codes SET attempts = attempts + 1 WHERE id = ?").bind(record.id).run(); return invalid(); }
  await database.prepare("UPDATE passwordless_login_codes SET used_at = ? WHERE id = ?").bind(now, record.id).run();
  let user = await database.prepare("SELECT id, display_name AS displayName FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user) {
    const id = createId(); const displayName = email.split("@")[0].slice(0, 60) || "GreatLove Meta player";
    await database.prepare("INSERT INTO users (id, email, display_name, password_hash, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, email, displayName, `passwordless$${await sha256(crypto.randomUUID())}`, lang, now).run();
    user = { id, displayName };
  }
  const session = await createSession(user.id);
  return Response.json({ redirect: `/${lang}/dashboard` }, { headers: { "Set-Cookie": session.cookie } });
}
