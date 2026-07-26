import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("English and Chinese routes use matching content", async () => {
  const home = await readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8");
  assert.match(home, /en:\s*\{/);
  assert.match(home, /zh:\s*\{/);
  assert.match(home, /lang === "zh" \? "成员" : "MEMBERS"/);
  assert.match(home, /lang === "zh" \? "AI 学习" : "AI learning"/);
});

test("Guru launcher is icon-only and public", async () => {
  const floating = await readFile(new URL("../components/FloatingAssistant.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/[lang]/assistant/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(floating, /<b>/);
  assert.doesNotMatch(page, /redirect\(/);
});
