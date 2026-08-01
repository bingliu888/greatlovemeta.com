import { sha256 } from "../../../lib/auth";

type ChatMessage = { role?: unknown; content?: unknown };
type ResponseData = {
  error?: { message?: string };
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  status?: string;
};

function outputText(data: ResponseData) {
  const direct = data.output_text?.trim();
  if (direct) return direct;
  return data.output
    ?.flatMap(item => item.content || [])
    .filter(item => item.type === "output_text" && typeof item.text === "string")
    .map(item => item.text!.trim())
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "AI service setup is not complete yet." }, { status: 503 });
  const body = await request.json().catch(() => null) as { language?: unknown; messages?: ChatMessage[] } | null;
  const language = body?.language === "zh" ? "zh" : "en";
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-12).flatMap(message => {
    const role = message.role === "assistant" ? "Assistant" : message.role === "user" ? "User" : null;
    const content = typeof message.content === "string" ? message.content.trim().slice(0, 2000) : "";
    return role && content ? [`${role}: ${content}`] : [];
  }) : [];
  if (!messages.length) return Response.json({ error: "A question is required." }, { status: 400 });
  const visitor = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "OpenAI-Safety-Identifier": await sha256(`greatlovemeta-public:${visitor}`) }, body: JSON.stringify({ model: "gpt-5.6-luna", instructions: `You are Guru, the bilingual public assistant for GreatLoveMeta.com. Answer in ${language === "zh" ? "Simplified Chinese" : "English"}. Be clear, neutral, concise, and practical. Help with the GreatLove ecosystem, AI agents, RWA concepts, NFTs, membership, Community, Live Chat, events, projects and site guidance. Distinguish facts from opinions, identify uncertainty, and never invent credentials, project status, legal rights, or event details.`, input: messages.join("\n"), reasoning: { effort: "low" }, text: { verbosity: "low" }, max_output_tokens: 1200 }) });
  const data = await response.json().catch(() => ({})) as ResponseData;
  if (!response.ok) return Response.json({ error: data.error?.message || "The AI service could not answer." }, { status: 502 });
  const reply = outputText(data);
  return reply ? Response.json({ reply }) : Response.json({ error: data.status === "incomplete" ? "The answer was interrupted. Please send your question again." : "The AI service returned an empty answer." }, { status: 502 });
}
