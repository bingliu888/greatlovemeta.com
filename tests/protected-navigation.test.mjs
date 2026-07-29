import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("all public calls to login-protected pages use full document navigation", async () => {
  const source = await readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8");
  const hardCommunityLinks = source.match(/<a\b[^>]*href=\{`\/\$\{lang\}\/community`\}/g) ?? [];
  const hardMemberLinks = source.match(/<a\b[^>]*href=\{`\/\$\{lang\}\/members`\}/g) ?? [];

  assert.equal(hardCommunityLinks.length, 3);
  assert.equal(hardMemberLinks.length, 1);
  assert.match(source, /<a className="primary" href=\{`\/api\/game-launch\?game=/);
  assert.doesNotMatch(source, /<Link\b[^>]*href=\{`\/\$\{lang\}\/community`\}/);
  assert.doesNotMatch(source, /<Link\b[^>]*href=\{`\/\$\{lang\}\/members`\}/);
  assert.doesNotMatch(source, /<Link\b[^>]*(?:mode=play|\/api\/game-launch)/);
});

test("the protected-navigation policy checker passes", async () => {
  const checker = fileURLToPath(new URL("../scripts/check-protected-navigation.mjs", import.meta.url));
  const { stdout, stderr } = await execFileAsync(process.execPath, [checker]);
  assert.match(stdout, /Protected-navigation policy passed/);
  assert.equal(stderr, "");
});
