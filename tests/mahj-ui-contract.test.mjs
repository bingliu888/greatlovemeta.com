import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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
  assert.equal((source.match(/"请 Guru 润色"/g) || []).length, 2);
  assert.match(source, /className="compose-actions"/);
  assert.match(source, /className="reply-box"/);
  assert.equal((source.match(/aria-label=\{zh \? "返回消息列表" : "Back to message list"\}/g) || []).length, 2);
  assert.match(source, /<textarea aria-label=\{zh \? "回复消息" : "Reply message"\}/);
  assert.match(source, /Guru could not help right now/);
});

test("email-code authentication switches to an explicit verification state", () => {
  const clerk = read("components/ClerkAuthForm.tsx");
  assert.match(clerk, /setStep\("code"\)/);
  assert.match(clerk, /`Code sent to \$\{identifier\}`/);
  assert.match(clerk, /`验证码已发送至 \$\{identifier\}`/);
  assert.match(clerk, /autoComplete="one-time-code"/);
  assert.match(clerk, /"Verify & continue"/);
  assert.match(clerk, /"验证并继续"/);
  assert.match(clerk, /"Use another email"/);
  assert.match(clerk, /"更换邮箱"/);
  assert.match(clerk, /step === "code" \? \(zh \? "验证并继续" : "Verify & continue"\)/);

  const fallback = read("components/AuthForm.tsx");
  assert.match(fallback, /sent: "Code sent to"/);
  assert.match(fallback, /sent: "验证码已发送至"/);
  assert.match(fallback, /verify: "Verify & continue"/);
  assert.match(fallback, /verify: "验证并继续"/);
});
