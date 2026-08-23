import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("account supports setting and updating a Clerk password", async () => {
  const form = await readFile(new URL("../components/PasswordSettings.tsx", import.meta.url), "utf8");
  const account = await readFile(new URL("../app/[lang]/account/page.tsx", import.meta.url), "utf8");
  const menu = await readFile(new URL("../components/HeaderAccount.tsx", import.meta.url), "utf8");
  assert.match(form, /useReverification/);
  assert.match(form, /user\?\.passwordEnabled/);
  assert.match(form, /user\.updatePassword/);
  assert.doesNotMatch(form, /currentPassword/);
  assert.match(form, /recent email-code verification/);
  assert.match(form, /newPassword/);
  assert.match(account, /<PasswordSettings lang=\{contentLang\}\/>/);
  assert.match(menu, /Account \| Set password/);
});

test("header account uses the same icon-only trigger on desktop and mobile", async () => {
  const menu = await readFile(new URL("../components/HeaderAccount.tsx", import.meta.url), "utf8");
  const header = await readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8");
  const anonymousTrigger = menu.match(/return <Link className="user-icon"[\s\S]*?<\/Link>/)?.[0] ?? "";

  assert.match(anonymousTrigger, /href=\{`\/\$\{lang\}\/auth\/login`\}/);
  assert.match(anonymousTrigger, /aria-label=\{signInLabel\}/);
  assert.match(anonymousTrigger, /title=\{signInLabel\}/);
  assert.match(anonymousTrigger, /<span className="avatar-glyph" aria-hidden="true"\/>/);
  assert.doesNotMatch(anonymousTrigger, />\s*(?:登录|Sign in)\s*</);
  assert.match(menu, /session\.imageUrl \? <img src=\{session\.imageUrl\} alt=""\/> : <span className="avatar-glyph"/);
  assert.equal((header.match(/<HeaderAccount/g) ?? []).length, 2);
  assert.doesNotMatch(header, /variant="text"/);
});
