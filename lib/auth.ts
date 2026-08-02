import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "glm_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const HASH_ITERATIONS = 210_000;

type D1Result<T> = { results?: T[]; success: boolean };
type Statement = {
  bind: (...values: unknown[]) => Statement;
  first: <T>() => Promise<T | null>;
  run: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
};
type Database = { prepare: (query: string) => Statement };

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: "en" | "zh";
};

function db(): Database {
  const binding = (globalThis as unknown as { __GREATLOVEMETA_DB__?: Database }).__GREATLOVEMETA_DB__;
  if (!binding) throw new Error("D1 binding DB is unavailable");
  return binding;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: HASH_ITERATIONS },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterations, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "pbkdf2-sha256" || Number(iterations) !== HASH_ITERATIONS || !saltValue || !hashValue) {
    return false;
  }
  const actual = await derivePassword(password, base64ToBytes(saltValue));
  const expected = base64ToBytes(hashValue);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

function randomToken(bytes = 32) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function createSession(userId: string) {
  const token = randomToken();
  const id = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  await db().prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).bind(id, userId, now + SESSION_SECONDS, now).run();
  return {
    token,
    cookie: `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
  };
}

export async function createSessionForClerkUser(userId: string, email: string, name: string) {
  const normalizedEmail = email.toLowerCase();
  let user = await db().prepare("SELECT id FROM users WHERE email = ?").bind(normalizedEmail).first<{ id: string }>();
  if (!user) {
    const now = Math.floor(Date.now() / 1000);
    const displayName = name.slice(0, 60);
    await db().prepare("INSERT INTO users (id, email, display_name, password_hash, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, normalizedEmail, displayName, `clerk$${await sha256(crypto.randomUUID())}`, "en", now).run();
    user = { id: userId };
  }
  return createSession(user.id);
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const found = header.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  const token = request ? cookieValue(request, COOKIE_NAME) : (await cookies()).get(COOKIE_NAME)?.value ?? null;
  let user: SessionUser | null = null;
  if (token) {
    try {
      const now = Math.floor(Date.now() / 1000);
      user = await db().prepare(
        "SELECT u.id, u.email, u.display_name AS displayName, u.preferred_language AS preferredLanguage FROM sessions s JOIN users u ON u.id = s.user_id LEFT JOIN platform_member_access a ON a.user_id = u.id WHERE s.id = ? AND COALESCE(a.status, 'active') = 'active' AND s.expires_at > ? LIMIT 1",
      ).bind(await sha256(token), now).first<SessionUser>();
    } catch {
      // A stale legacy session cookie must not turn a public page into an error page.
    }
  }
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() || clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (clerkUser && email) {
      user = await db().prepare("SELECT id, email, display_name AS displayName, preferred_language AS preferredLanguage FROM users WHERE email = ?").bind(email).first<SessionUser>();
      if (!user) {
        const now = Math.floor(Date.now() / 1000);
        const displayName = (clerkUser.fullName || clerkUser.firstName || email.split("@")[0] || "GreatLove Meta").slice(0, 60);
        await db().prepare("INSERT INTO users (id, email, display_name, password_hash, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(clerkUser.id, email, displayName, `clerk$${await sha256(crypto.randomUUID())}`, "en", now).run();
        user = { id: clerkUser.id, email, displayName, preferredLanguage: "en" };
      }
    }
  }
  if (!user) return null;
  const pendingCode = (await cookies()).get("greatlovemeta_referral_code")?.value?.toUpperCase();
  if (pendingCode) {
    const owner = await db().prepare("SELECT id, user_id AS userId FROM referral_codes WHERE code = ?").bind(pendingCode).first<{ id: string; userId: string }>();
    const subscription = await db().prepare("SELECT id FROM subscriptions WHERE user_id = ? LIMIT 1").bind(user.id).first<{ id: string }>();
    if (owner && owner.userId !== user.id && !subscription) {
      const now = Math.floor(Date.now() / 1000);
      await db().prepare("INSERT OR IGNORE INTO referrals (id, referral_code_id, referred_user_id, status, discount_percent, created_at, updated_at) VALUES (?, ?, ?, 'pending', 15, ?, ?)").bind(crypto.randomUUID(), owner.id, user.id, now, now).run();
    }
  }
  return user;
}

export async function deleteCurrentSession(request: Request) {
  const token = cookieValue(request, COOKIE_NAME);
  if (!token) return;
  await db().prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
}

export function getDatabase() {
  return db();
}

export function createId() {
  return crypto.randomUUID();
}
