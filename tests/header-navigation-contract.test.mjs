import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("desktop and mobile headers keep ecosystem and account access without member sales links", async () => {
  const [header, account] = await Promise.all([
    readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HeaderAccount.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal((header.match(/<GlobalLinks lang=\{lang\}\/>/g) ?? []).length, 2);
  assert.equal((header.match(/<HeaderAccount lang=\{lang\}\/>/g) ?? []).length, 2);
  assert.doesNotMatch(`${header}\n${account}`, /Member community|Membership|会员社区|会员方案/);
  assert.match(account, /lang === "zh" \? "社区" : "Community"/);
  assert.doesNotMatch(account, /href=\{`\/\$\{lang\}\/pricing`\}/);
});
