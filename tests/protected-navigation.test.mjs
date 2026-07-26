import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public Community calls to action use full document navigation", async () => {
  const source = await readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8");
  const hardCommunityLinks = source.match(/<a\b[^>]*href=\{`\/\$\{lang\}\/community`\}/g) ?? [];

  assert.equal(hardCommunityLinks.length, 3);
  assert.doesNotMatch(source, /<Link\b[^>]*href=\{`\/\$\{lang\}\/community`\}/);
});
