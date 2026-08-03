import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("interactive text AI supports China routing and a manual provider preference", async () => {
  const [provider, api, control, assistant] = await Promise.all([
    read("../lib/text-ai-provider.ts"),
    read("../app/api/ai-provider/route.ts"),
    read("../components/AiProviderPreference.tsx"),
    read("../app/api/assistant/route.ts"),
  ]);
  assert.match(provider, /deepseek-v4-flash/);
  assert.match(provider, /api\.deepseek\.com\/chat\/completions/);
  assert.match(provider, /api\.openai\.com\/v1\/responses/);
  assert.match(provider, /requestCountry\(request\) === "CN"/);
  assert.match(provider, /thinking: \{ type: "disabled" \}/);
  assert.match(api, /HttpOnly; SameSite=Lax/);
  assert.match(control, /Automatic \(recommended\)/);
  assert.match(control, /Images, voice, and moderation continue to use specialist models/);
  assert.match(assistant, /textAiFetch\(request/);
});

test("DeepSeek key remains server-only", async () => {
  const [provider, control] = await Promise.all([
    read("../lib/text-ai-provider.ts"),
    read("../components/AiProviderPreference.tsx"),
  ]);
  assert.match(provider, /process\.env\.DEEPSEEK_API_KEY/);
  assert.doesNotMatch(control, /DEEPSEEK_API_KEY|api\.deepseek\.com/);
});

