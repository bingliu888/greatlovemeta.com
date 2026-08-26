import { getDatabase, getSessionUser } from "../../../lib/auth";
import { ensureRefId } from "../../../lib/ref-id";
import { isSiteLanguage } from "../../../lib/site-locale";
import { saveMemberWallet } from "../../../lib/wallet-binding";

function bucket() {
  const value = (globalThis as unknown as { __GREATLOVEMETA_BUCKET__?: R2Bucket }).__GREATLOVEMETA_BUCKET__;
  if (!value) throw new Error("Profile storage unavailable");
  return value;
}

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const avatarUserId = new URL(request.url).searchParams.get("avatar");
  if (avatarUserId) {
    const avatar = await getDatabase().prepare("SELECT object_key AS objectKey, mime_type AS mimeType FROM user_avatars WHERE user_id = ?").bind(avatarUserId).first<{ objectKey: string; mimeType: string }>();
    if (!avatar) return new Response(null, { status: 404 });
    const object = await bucket().get(avatar.objectKey);
    if (!object) return new Response(null, { status: 404 });
    return new Response(object.body, { headers: { "content-type": avatar.mimeType, "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
  }
  const introducer = await getDatabase().prepare("SELECT owner.display_name AS displayName, r.status AS status FROM referrals r JOIN referral_codes rc ON rc.id = r.referral_code_id JOIN users owner ON owner.id = rc.user_id WHERE r.referred_user_id = ? LIMIT 1").bind(user.id).first<{ displayName: string; status: string }>();
  const avatar = await getDatabase().prepare("SELECT user_id AS userId FROM user_avatars WHERE user_id = ?").bind(user.id).first<{ userId: string }>();
  const wallet = await getDatabase().prepare("SELECT wallet_address AS walletAddress FROM users WHERE id = ?").bind(user.id).first<{ walletAddress: string | null }>();
  return Response.json({ profile: { displayName: user.displayName, preferredLanguage: user.preferredLanguage, walletAddress: wallet?.walletAddress ?? "", refId: await ensureRefId(user.id), imageUrl: avatar ? `/api/profile?avatar=${encodeURIComponent(user.id)}` : "" }, introducer: introducer ?? null });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Photo is required" }, { status: 400 });
    const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!accepted.has(file.type) || file.size > 5 * 1024 * 1024) return Response.json({ error: "Invalid photo" }, { status: 400 });
    const previous = await getDatabase().prepare("SELECT object_key AS objectKey FROM user_avatars WHERE user_id = ?").bind(user.id).first<{ objectKey: string }>();
    const objectKey = `avatars/${user.id}/${crypto.randomUUID()}`;
    await bucket().put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const now = Math.floor(Date.now() / 1000);
    await getDatabase().prepare("INSERT INTO user_avatars (user_id, object_key, mime_type, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET object_key = excluded.object_key, mime_type = excluded.mime_type, updated_at = excluded.updated_at").bind(user.id, objectKey, file.type, now).run();
    if (previous?.objectKey) await bucket().delete(previous.objectKey);
    return Response.json({ imageUrl: `/api/profile?avatar=${encodeURIComponent(user.id)}&v=${now}` });
  }
  const payload = await request.json() as { displayName?: string; preferredLanguage?: string; walletAddress?: string };
  const hasProfile = typeof payload.displayName === "string";
  const hasWallet = Object.prototype.hasOwnProperty.call(payload, "walletAddress");
  if (!hasProfile && !hasWallet) return Response.json({ error: "No profile changes supplied" }, { status: 400 });
  const displayName = payload.displayName?.trim().slice(0, 60);
  if (hasProfile && (!displayName || displayName.length < 2)) return Response.json({ error: "Display name is required" }, { status: 400 });
  const preferredLanguage = isSiteLanguage(String(payload.preferredLanguage || "")) ? String(payload.preferredLanguage) : user.preferredLanguage;
  const walletAddress = payload.walletAddress?.trim() || "";
  if (hasWallet && walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return Response.json({ error: "Enter a valid EVM wallet address" }, { status: 400 });
  try {
    if (hasProfile) await getDatabase().prepare("UPDATE users SET display_name = ?, preferred_language = ? WHERE id = ?").bind(displayName, preferredLanguage, user.id).run();
    const savedWallet = hasWallet ? await saveMemberWallet(user.id, walletAddress) : undefined;
    return Response.json({ profile: { displayName: displayName ?? user.displayName, preferredLanguage: hasProfile ? preferredLanguage : user.preferredLanguage, walletAddress: savedWallet ?? walletAddress } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "WALLET_ALREADY_IN_USE") return Response.json({ error: "This wallet belongs to another account with subscription history" }, { status: 409 });
    if (reason === "INVALID_WALLET") return Response.json({ error: "Enter a valid EVM wallet address" }, { status: 400 });
    return Response.json({ error: "Unable to save the account profile" }, { status: 500 });
  }
}
