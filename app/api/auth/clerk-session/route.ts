import { createClerkClient, verifyToken } from "@clerk/backend";
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
    const claims = await verifyToken(token, { jwtKey, authorizedParties: [new URL(request.url).origin] });
    const userId = claims.sub;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const clerkUser = await createClerkClient({ secretKey, publishableKey }).users.getUser(userId);
    if (clerkUser.banned || clerkUser.locked) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const primaryEmail = clerkUser.emailAddresses.find(address => address.id === clerkUser.primaryEmailAddressId)
      || clerkUser.emailAddresses[0];
    const email = primaryEmail?.emailAddress.trim().toLowerCase();
    if (!email) return Response.json({ error: "Email required" }, { status: 400 });
    const emailVerified = primaryEmail.verification?.status === "verified";
    const session = await createSessionForClerkUser(
      userId,
      email,
      emailVerified && email === "bingliu@cybeye.com" ? "Admin" : /^bingliu\+([^@]+)@/i.exec(email)?.[1] || clerkUser.fullName || clerkUser.firstName || email.split("@")[0] || "GreatLove Meta",
      emailVerified,
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
