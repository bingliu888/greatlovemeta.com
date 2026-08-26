import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Chinese shared chrome localizes navigation and assistant accessibility labels", () => {
  const locale=read("lib/site-locale.ts");
  assert.match(read("components/LanguageMemory.tsx"), /interfaceText\(lang,"Switch website language","切换网站语言"\)/);
  assert.match(locale, /"Primary navigation","主导航"/);
  assert.match(locale, /"Footer navigation","页脚导航"/);
  assert.match(locale, /"Open AI assistant","打开智能助手"/);
});

test("all primary GreatLoveMeta surfaces render the shared public header once", () => {
  const directRoutes = [
    "app/[lang]/page.tsx",
    "app/[lang]/community/page.tsx",
    "app/[lang]/account/page.tsx",
    "app/[lang]/members/page.tsx",
    "app/[lang]/messages/page.tsx",
    "app/[lang]/dashboard/page.tsx",
    "app/[lang]/assistant/page.tsx",
    "app/[lang]/games/[game]/page.tsx",
    "app/[lang]/lucky-wheel/page.tsx",
    "app/[lang]/messages/live/[threadId]/page.tsx",
    "app/[lang]/share/page.tsx",
    "app/[lang]/pricing/pricing-client.tsx",
    "app/[lang]/project/day/[date]/page.tsx",
    "app/[lang]/project/build/[version]/page.tsx",
    "app/[lang]/project/report/[date]/page.tsx",
    "app/[lang]/project/task/[id]/page.tsx",
  ];

  for (const route of directRoutes) {
    const source = read(route);
    assert.equal((source.match(/<SiteHeader\b/g) || []).length, 1, `${route} must render exactly one SiteHeader`);
  }

  for (const component of ["components/EditorialPage.tsx", "components/ProjectDashboard.tsx", "components/LegalPage.tsx"]) {
    assert.equal((read(component).match(/<SiteHeader\b/g) || []).length, 1, `${component} must render exactly one SiteHeader`);
  }

  for (const [route, component] of Object.entries({
    "app/[lang]/news/page.tsx": "EditorialPage",
    "app/[lang]/events/page.tsx": "EditorialPage",
    "app/[lang]/project/page.tsx": "ProjectDashboard",
    "app/[lang]/about/page.tsx": "LegalPage",
    "app/[lang]/privacy/page.tsx": "LegalPage",
    "app/[lang]/terms/page.tsx": "LegalPage",
  })) {
    assert.match(read(route), new RegExp(`<${component}\\b`), `${route} must delegate to ${component}`);
  }
});

test("new messages and replies both provide a working bilingual Guru polish action", () => {
  const source = read("components/MessageCenter.tsx");
  assert.match(source, /async function improve\(\)/);
  assert.match(source, /fetch\("\/api\/assistant"/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /setDraft\(result\.reply\)/);
  assert.match(source, /disabled=\{busy \|\| !draft\.trim\(\)\}/);
  assert.equal((source.match(/"Polish with Guru"/g) || []).length, 2);
  assert.equal((source.match(/"请智能助手润色"/g) || []).length, 2);
  assert.match(source, /className="compose-actions"/);
  assert.match(source, /className="reply-box"/);
  assert.equal((source.match(/aria-label=\{zh \? "返回消息列表" : "Back to message list"\}/g) || []).length, 2);
  assert.match(source, /<textarea aria-label=\{zh \? "回复消息" : "Reply message"\}/);
  assert.match(source, /Guru could not help right now/);
});

test("email-code authentication switches to an explicit verification state", async () => {
  const [auth, copy] = await Promise.all([
    read("components/portfolio-auth/ClerkDualAuthForm.tsx"),
    read("components/portfolio-auth/auth-copy.generated.ts"),
  ]);
  assert.match(auth, /setStep\("code"\)/);
  assert.match(auth, /Code sent to \{identifier\}/);
  assert.match(auth, /autoComplete="one-time-code"/);
  assert.match(auth, /step === "code" \? t\("Verify & continue"\)/);
  assert.match(auth, /step !== "credentials" \? t\("Use another email"\)/);
  assert.match(copy, /验证码已发送至 \{identifier\}/);
  assert.match(copy, /验证并继续/);
  assert.match(copy, /更换邮箱/);
});
