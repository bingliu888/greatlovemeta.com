export type TextAiProvider = "openai" | "deepseek";
export type TextAiProviderPreference = "auto" | TextAiProvider;

const PREFERENCE_COOKIE = "ai_provider_preference";
export const DEEPSEEK_TEXT_MODEL = "deepseek-v4-flash";

function cookiePreference(request: Request): TextAiProviderPreference {
  const raw = request.headers.get("cookie") ?? "";
  const value = raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${PREFERENCE_COOKIE}=`))?.split("=")[1];
  return value === "openai" || value === "deepseek" ? value : "auto";
}

export function requestCountry(request: Request) {
  const cfCountry = (request as Request & { cf?: { country?: string } }).cf?.country;
  return (cfCountry || request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
}

export function resolveTextAiProvider(request: Request): TextAiProvider {
  const preference = cookiePreference(request);
  if (preference !== "auto") return preference;
  return requestCountry(request) === "CN" ? "deepseek" : "openai";
}

type OpenAiRequestBody = {
  instructions?: string;
  input?: string;
  max_output_tokens?: number;
};

type DeepSeekResponse = {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
};

function authorization(headers: Headers) {
  return headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

/**
 * Routes OpenAI-compatible text requests by member preference and Cloudflare country.
 * DeepSeek responses are normalized to the OpenAI Responses shape so existing
 * route parsing and UI error behavior stay unchanged.
 */
export async function textAiFetch(request: Request, init: RequestInit) {
  const headers = new Headers(init.headers);
  const openAiKey = authorization(headers) || process.env.OPENAI_API_KEY || "";
  const deepSeekKey = process.env.DEEPSEEK_API_KEY || "";
  let provider = resolveTextAiProvider(request);
  if (provider === "deepseek" && !deepSeekKey && openAiKey) provider = "openai";
  if (provider === "openai" && !openAiKey && deepSeekKey) provider = "deepseek";

  if (provider === "openai") {
    if (!openAiKey) return Response.json({ error: { message: "AI service setup is not complete yet." } }, { status: 503 });
    headers.set("authorization", `Bearer ${openAiKey}`);
    return fetch("https://api.openai.com/v1/responses", { ...init, headers });
  }

  if (!deepSeekKey) return Response.json({ error: { message: "AI service setup is not complete yet." } }, { status: 503 });
  const source = JSON.parse(typeof init.body === "string" ? init.body : "{}") as OpenAiRequestBody;
  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${deepSeekKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_TEXT_MODEL,
      messages: [
        { role: "system", content: source.instructions ?? "" },
        { role: "user", content: source.input ?? "" },
      ],
      thinking: { type: "disabled" },
      max_tokens: Math.max(1, Math.min(source.max_output_tokens ?? 1200, 8192)),
    }),
    signal: init.signal,
  });
  const data = await upstream.json().catch(() => ({})) as DeepSeekResponse;
  if (!upstream.ok) {
    return Response.json({ error: { message: data.error?.message || "The AI service could not answer." } }, { status: upstream.status });
  }
  const outputText = data.choices?.[0]?.message?.content?.trim() ?? "";
  return Response.json(
    outputText ? { output_text: outputText, status: "completed", provider } : { error: { message: "The AI service returned an empty answer." } },
    { status: outputText ? 200 : 502 },
  );
}

