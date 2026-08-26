import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

async function importTypeScriptModule(path) {
  const source = await read(path);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

test("maps Clerk password-only missing requirements to a safe completion step", async () => {
  const requirements = await importTypeScriptModule("../lib/clerk-auth-requirements.ts");
  assert.equal(requirements.resolveSignUpRequirements(["password"], "zh").kind, "password");
  assert.equal(requirements.resolveSignUpRequirements(["password"], "en").kind, "password");
});

test("names unsupported Clerk requirements instead of showing a generic dead end", async () => {
  const requirements = await importTypeScriptModule("../lib/clerk-auth-requirements.ts");
  const result = requirements.resolveSignUpRequirements(["first_name", "protect_check"], "zh");
  assert.equal(result.kind, "unsupported");
  assert.deepEqual(result.fields, ["first_name", "protect_check"]);
  assert.match(result.message, /名字、安全验证/);
  assert.doesNotMatch(result.message, /额外步骤/);
});

test("verified sign-up completes a session or safely collects a required password", async () => {
  const form = await Promise.all([Promise.all([read("../components/ClerkAuthForm.tsx"),read("../components/portfolio-auth/ClerkDualAuthForm.tsx"),read("../components/portfolio-auth/PasswordField.tsx"),read("../components/portfolio-auth/auth-copy.generated.ts")]).then(parts=>parts.join("\n")),read("../components/portfolio-auth/ClerkDualAuthForm.tsx"),read("../components/portfolio-auth/PasswordField.tsx"),read("../components/portfolio-auth/auth-copy.generated.ts")]).then(parts=>parts.join("\n"));
  assert.match(form, /result\.status === "complete" && result\.createdSessionId/);
  assert.match(form, /result\.status === "missing_requirements"/);
  assert.match(form, /setStep\("password-required"\)/);
  assert.match(form, /signUp\.update\(\{ password \}\)/);
  assert.match(form, /activateSession\(setActiveSignUp, result\.createdSessionId\)/);
  assert.match(form, /id="clerk-captcha"/);
});
