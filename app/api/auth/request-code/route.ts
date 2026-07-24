import { createId, getDatabase, sha256 } from "../../../../lib/auth";

type Recent = { createdAt: number };

export async function POST(request: Request) {
  const payload = await request.json() as { email?: string; lang?: string };
  const lang = payload.lang === "zh" ? "zh" : "en";
  const email = payload.email?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: lang === "zh" ? "请输入有效邮箱。" : "Enter a valid email." }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;
  const secret = process.env.AUTH_CODE_SECRET;
  if (!apiKey || !from || !secret) return Response.json({ error: lang === "zh" ? "邮件登录正在配置中，请稍后再试。" : "Email login is being configured. Please try again later." }, { status: 503 });
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const latest = await database.prepare("SELECT created_at AS createdAt FROM passwordless_login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1").bind(email).first<Recent>();
  if (latest && now - latest.createdAt < 60) return Response.json({ error: lang === "zh" ? "请等待一分钟后重试。" : "Please wait one minute before requesting another code." }, { status: 429 });
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const id = createId();
  await database.prepare("INSERT INTO passwordless_login_codes (id, email, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)").bind(id, email, await sha256(`${secret}:${email}:${code}`), now + 600, now).run();
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: lang === "zh" ? "GreatLoveMeta.com 登录验证码" : "Your GreatLoveMeta.com login code", html: `<div style="font-family:Arial,sans-serif;max-width:520px"><h2>GreatLoveMeta.com</h2><p>${lang === "zh" ? "您的登录验证码是：" : "Your login code is:"}</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p><p>${lang === "zh" ? "验证码将在 10 分钟后失效。" : "This code expires in 10 minutes."}</p></div>` }) });
  if (!response.ok) { await database.prepare("DELETE FROM passwordless_login_codes WHERE id = ?").bind(id).run(); return Response.json({ error: lang === "zh" ? "暂时无法发送邮件，请稍后重试。" : "Unable to send email right now. Please try again." }, { status: 502 }); }
  return Response.json({ ok: true });
}
