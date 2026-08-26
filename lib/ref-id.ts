import { getDatabase } from "./auth";

export const REF_ID_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeRefId(value: string) {
  return value.trim().toUpperCase();
}

function randomRefId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}

export async function ensureRefId(userId: string) {
  const db = getDatabase();
  let row = await db.prepare("SELECT code FROM referral_codes WHERE user_id=? LIMIT 1").bind(userId).first<{ code: string }>();
  if (row && REF_ID_PATTERN.test(normalizeRefId(row.code))) return normalizeRefId(row.code);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const code = randomRefId();
    const existing = await db.prepare("SELECT id FROM referral_codes WHERE upper(code)=? LIMIT 1").bind(code).first();
    if (existing) continue;
    if (row) await db.prepare("UPDATE referral_codes SET code=? WHERE user_id=?").bind(code, userId).run();
    else await db.prepare("INSERT OR IGNORE INTO referral_codes(id,user_id,code,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(), userId, code, Math.floor(Date.now()/1000)).run();
    row = await db.prepare("SELECT code FROM referral_codes WHERE user_id=? LIMIT 1").bind(userId).first<{ code: string }>();
    if (row && REF_ID_PATTERN.test(normalizeRefId(row.code))) return normalizeRefId(row.code);
  }
  throw new Error("REF_ID_UNAVAILABLE");
}
