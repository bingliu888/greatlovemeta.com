import type { TextAiProviderPreference } from "../../../lib/text-ai-provider";

const COOKIE_NAME = "ai_provider_preference";
const YEAR = 60 * 60 * 24 * 365;

function currentPreference(request: Request): TextAiProviderPreference {
  const raw = request.headers.get("cookie") ?? "";
  const value = raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];
  return value === "openai" || value === "deepseek" ? value : "auto";
}

export async function GET(request: Request) {
  return Response.json({ preference: currentPreference(request) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { preference?: unknown } | null;
  const preference: TextAiProviderPreference = body?.preference === "openai" || body?.preference === "deepseek" ? body.preference : "auto";
  return Response.json(
    { preference },
    {
      headers: {
        "cache-control": "private, no-store",
        "set-cookie": `${COOKIE_NAME}=${preference}; Path=/; Max-Age=${YEAR}; Secure; HttpOnly; SameSite=Lax`,
      },
    },
  );
}

