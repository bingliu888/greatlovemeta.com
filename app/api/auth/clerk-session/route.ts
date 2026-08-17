import { verifyToken } from "@clerk/backend";
import { createSessionForClerkUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as Record<string, string | undefined>;
  const secretKey = runtime.CLERK_SECRET_KEY;
  const publishableKey = runtime.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const jwtKey = runtime.CLERK_JWT_KEY;
  if (!token || !secretKey || !publishableKey || !jwtKey) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const claims = await verifyToken(token, { jwtKey });
    const userId = claims.sub;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await request.json() as { email?: string; name?: string };
    const email = payload.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return Response.json({ error: "Verified email required" }, { status: 400 });
    const session = await createSessionForClerkUser(
      userId,
      email,
      email === "bingliu@cybeye.com" ? "Admin" : payload.name || email.split("@")[0] || "GreatLove Meta",
    );
    return Response.json({ ok: true }, { headers: { "Set-Cookie": session.cookie } });
  } catch (error) {
    const code =
      typeof error === "object" && error && "reason" in error && typeof error.reason === "string"
        ? error.reason
        : error instanceof Error
          ? error.name
          : "UnknownError";
    console.error("Clerk session bridge failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown session bridge error",
    });
    return Response.json({ error: "Unauthorized", code }, { status: 401 });
  }
}
