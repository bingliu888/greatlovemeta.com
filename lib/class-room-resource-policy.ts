import { isAdminUser } from "@/lib/admin-access";
import { getDatabase, type SessionUser } from "@/lib/auth";
import { CLASS_AUDIO_NOTE_ENTITLEMENT_SQL } from "@/lib/class-room-resource-sql";

export const MAX_CLASS_MATERIAL_BYTES = 15 * 1024 * 1024;
export const MAX_CLASS_MATERIALS = 100;
export const MAX_CLASS_AUDIO_NOTES = 100;
export const RECORDING_MIN_PAID_SECONDS = 7 * 86400;

export async function classUserEmailVerified(user: SessionUser) {
  const row = await getDatabase().prepare("SELECT email_verified AS verified FROM users WHERE id=? LIMIT 1")
    .bind(user.id).first<{verified:number}>();
  return row?.verified === 1;
}

// Require an active GreatLoveMeta subscription with more than seven days remaining.
export async function canAddClassAudioNote(user: SessionUser) {
  if (await isAdminUser(user)) return true;
  const after = Math.floor(Date.now() / 1000) + RECORDING_MIN_PAID_SECONDS;
  const row = await getDatabase().prepare(CLASS_AUDIO_NOTE_ENTITLEMENT_SQL)
    .bind(user.id,after)
    .first<{eligible:number}>();
  return row?.eligible === 1;
}

export const CLASS_MATERIAL_TYPES = new Set([
  "application/pdf", "application/json", "text/plain", "text/csv",
  "text/markdown", "image/jpeg", "image/png", "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function safeClassFileName(value: string | null) {
  let decoded = String(value || "file");
  try { decoded = decodeURIComponent(decoded); } catch { /* use safe raw name */ }
  return decoded.normalize("NFKC").replace(/[\u0000-\u001f\u007f/\\]+/g,"_")
    .replace(/\s+/g," ").trim().slice(0,120) || "file";
}

export async function classFileBucket() {
  const { env } = await import("cloudflare:workers");
  return env.CLASS_FILES as unknown as R2Bucket | undefined;
}
