import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("deployment permanently enforces zero-warning authored-source lint", () => {
  const workflow = read(".github/workflows/deploy-cloudflare.yml");
  const config = read("eslint.config.mjs");
  const packageJson = read("package.json");

  assert.match(workflow, /Lint authored source with zero-warning policy[\s\S]*npm run lint/);
  assert.match(packageJson, /eslint \. --max-warnings 0/);
  assert.match(config, /public\/pdf\.worker\.min\.mjs/);
  assert.match(config, /public\/wallet-assets\/greatlove-onboard\.js/);
  assert.doesNotMatch(config, /components\/\*\*|app\/\*\*|lib\/\*\*/);
});
