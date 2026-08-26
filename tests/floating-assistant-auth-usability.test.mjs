import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = relative => readFile(new URL(relative, import.meta.url), "utf8");

test("Ask Guru stays in a viewport-fixed root layer while pages scroll", async () => {
  const [component, layout, styles] = await Promise.all([
    read("../components/FloatingAssistant.tsx"),
    read("../app/layout.tsx"),
    read("../app/globals.css"),
  ]);

  assert.match(layout, /\{children\}<FloatingAssistant\/><\/body>/);
  assert.match(component, /<div className="floating-assistant-layer">/);
  assert.match(styles, /\.floating-assistant-layer\{position:fixed;inset:0;z-index:150;pointer-events:none;isolation:isolate\}/);
  assert.match(styles, /\.floating-assistant\{position:absolute;[^}]*pointer-events:auto/);
  assert.match(styles, /bottom:max\(22px,env\(safe-area-inset-bottom\)\)/);
});

test("email, verification-code and password fields remain iPad-readable", async () => {
  const [form, styles] = await Promise.all([
    Promise.all([Promise.all([read("../components/ClerkAuthForm.tsx"),read("../components/portfolio-auth/ClerkDualAuthForm.tsx"),read("../components/portfolio-auth/PasswordField.tsx"),read("../components/portfolio-auth/auth-copy.generated.ts")]).then(parts=>parts.join("\n")),read("../components/portfolio-auth/ClerkDualAuthForm.tsx"),read("../components/portfolio-auth/PasswordField.tsx"),read("../components/portfolio-auth/auth-copy.generated.ts")]).then(parts=>parts.join("\n")),
    read("../app/globals.css"),
  ]);

  assert.match(form, /type="email"/);
  assert.match(form, /type=\{revealed \? "text" : "password"\}/);
  assert.match(form, /autoComplete="one-time-code"/);
  assert.match(styles, /\.auth-form input\s*\{[^}]*font-size:\s*max\(18px,var\(--reader-base,18px\)\)!important/);
});
