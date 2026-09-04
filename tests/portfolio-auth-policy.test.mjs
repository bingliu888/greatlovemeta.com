import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = name => readFile(new URL(`../components/portfolio-auth/${name}`, import.meta.url), "utf8");

test("portfolio identity core supports both localized sign-in methods and recovery", async () => {
  const [auth, copy, passwordField] = await Promise.all([read("ClerkDualAuthForm.tsx"), read("auth-copy.generated.ts"), read("PasswordField.tsx")]);
  assert.match(auth, /reset_password_email_code/);
  assert.match(auth, /signUp\.create\(\{ emailAddress: identifier, password \}\)/);
  assert.doesNotMatch(auth, /signUp\.create\(\{ emailAddress: identifier, password \}\)[\s\S]{0,240}prepareEmailAddressVerification/);
  assert.match(auth, /method.*password/);
  assert.match(auth, /minLength=\{8\}/);
  assert.match(auth, /attemptSecondFactor/);
  assert.match(auth, /id="clerk-captcha"/);
  assert.match(passwordField, /aria-pressed=\{revealed\}/);
  for (const locale of ["en","zh","ja","ko","es","fr","de","ru","it","pt","ar","hi","id","bn","ur","pa","ta","te","ne","si","tr"]) {
    assert.match(copy, new RegExp(`"${locale}": \\{`));
  }
  assert.match(copy,/auth-copy-zh-tw\.generated/);
});

test("portfolio password settings distinguishes add and update modes", async () => {
  const settings = await read("PortfolioPasswordSettings.tsx");
  assert.match(settings, /user\?\.passwordEnabled/);
  assert.match(settings, /passwordEnabled \? currentPassword : undefined/);
  assert.match(settings, /passwordEnabled \? <PasswordField/);
  assert.match(settings, /Add password/);
  assert.match(settings, /Update password/);
  assert.match(settings, /minLength=\{8\}/);
  assert.doesNotMatch(settings, /form_password_pwned/);
});


test("policy intro covers every portfolio locale without claiming a verification gate", async () => {
  const intro = await read("AuthPolicyIntro.tsx");
  for (const locale of ["en","zh","ja","ko","es","fr","de","ru","it","pt","ar","hi","id","bn","ur","pa","ta","te","ne","si","tr"]) assert.match(intro, new RegExp("\\b" + locale + ":"));
  assert.match(intro,/"zh-tw":/);
  assert.match(intro, /Password is the default sign-in method/);
  assert.match(intro, /默认使用密码登录/);
  assert.doesNotMatch(intro, /Email code is the default/);
  assert.doesNotMatch(intro, /new verified email creates/i);
});
