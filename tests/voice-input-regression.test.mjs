import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const assistant = await readFile(new URL("../components/AssistantClient.tsx", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../app/[lang]/dashboard/page.tsx", import.meta.url), "utf8");

test("public microphone starts bilingual continuous Web Speech dictation", () => {
  assert.match(assistant, /SpeechRecognition\?: RecognitionConstructor/);
  assert.match(assistant, /webkitSpeechRecognition\?: RecognitionConstructor/);
  assert.match(assistant, /instance\.lang = zh \? "zh-CN" : "en-US"/);
  assert.match(assistant, /instance\.continuous = true/);
  assert.match(assistant, /instance\.interimResults = true/);
  assert.match(assistant, /instance\.start\(\)/);
  assert.match(assistant, /recognition\.current\?\.stop\(\)/);
  assert.doesNotMatch(assistant, /if \(!signedIn\)|window\.location\.href|getUserMedia|\/api\/assistant\/live/);
});

test("final and interim transcripts update the draft without auto-send", () => {
  const handler = assistant.match(/instance\.onresult = event => \{([\s\S]*?)\n    \};/)?.[1] ?? "";
  assert.match(handler, /result\.isFinal/);
  assert.match(handler, /recognitionBase\.current \+= finalText/);
  assert.match(handler, /setDraft\(`\$\{recognitionBase\.current\}\$\{interimText\}`\.trimStart\(\)\)/);
  assert.doesNotMatch(handler, /requestSubmit|submit\(/);
  assert.match(assistant, /Listening…/);
  assert.match(assistant, /正在聆听…/);
  assert.match(assistant, /role="alert"/);
});

test("signed-in dashboard exposes the bilingual Ask Guru voice shortcut", () => {
  assert.match(dashboard, /audioTitle: "Live Audio AI Chat"/);
  assert.match(dashboard, /audioTitle: "实时语音 AI 对话"/);
  assert.match(dashboard, /href=\{`\/\$\{lang\}\/assistant`\}/);
});
