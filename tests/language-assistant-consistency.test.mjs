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

test("Chinese surfaces consistently present the 大爱元宇宙 brand", async () => {
  const [home, header, footer, legal, collections, pricing, languageLayout] = await Promise.all([
    readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteFooter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LegalPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/collections/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/pricing/pricing-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(home, /accessCommunityTitle: "大爱元宇宙社区"/);
  assert.match(home, /officialCommunityTitle: "大爱元宇宙会员名录"/);
  assert.match(home, /大爱艺术世界/);
  assert.match(header, /lang === "zh" \? "大爱元宇宙" : "GreatLoveMeta\.com"/);
  assert.match(footer, /zh \? "大爱元宇宙" : "GreatLoveMeta\.com"/);
  assert.match(legal, /关于大爱元宇宙/);
  assert.match(collections, /由大爱元宇宙本站呈现/);
  assert.match(pricing, /大爱元宇宙高级会员/);
  assert.match(languageLayout, /template: "%s \| 大爱元宇宙"/);
});

test("Guru launcher is icon-only and public", async () => {
  const floating = await readFile(new URL("../components/FloatingAssistant.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/[lang]/assistant/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(floating, /<b>/);
  assert.doesNotMatch(page, /redirect\(/);
});

test("OpenAI text generation is pinned to GPT-5.6 Luna", async () => {
  const [route, live, image] = await Promise.all([
    readFile(new URL("../app/api/assistant/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/assistant/live/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/referral-media/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /model:\s*"gpt-5\.6-luna"/);
  assert.match(route, /reasoning:\s*\{\s*effort:\s*"low"\s*\}/);
  assert.doesNotMatch(route, /OPENAI_(?:TEXT_)?MODEL/);
  assert.match(live, /"gpt-realtime-2\.1-mini"/);
  assert.match(image, /"gpt-image-1-mini"/);
});
