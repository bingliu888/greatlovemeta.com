import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSourceUrl = new URL("../app/[lang]/page.tsx", import.meta.url);
const whitepaperUrl = new URL(
  "../public/docs/GreatLove-RWA-Whitepaper-EN-2026-07-v9.pdf",
  import.meta.url,
);

test("homepage exposes the GreatLove welcome resources", async () => {
  const source = await readFile(homeSourceUrl, "utf8");

  assert.match(source, /Welcome to RWA\. Welcome to the GreatLove Metaverse\./);
  assert.match(
    source,
    /\/docs\/GreatLove-RWA-Whitepaper-EN-2026-07-v9\.pdf/,
  );
  assert.match(source, /download>/);
  assert.match(source, /className="glm-community-link"/);
  assert.match(source, /href=\{`\/\$\{lang\}\/community`\}/);
  assert.match(source, /Forum · Live Chat · Member discussions/);
  assert.match(
    source,
    /https:\/\/files\.greatlovedao\.com\/storage\/v1\/object\/public\/apk\/greatlove\.apk/,
  );
  assert.match(source, /https:\/\/apps\.apple\.com\/app\/greatlove-/);
  assert.doesNotMatch(
    source,
    /href="https:\/\/(?:www\.)?greatlovedao\.com\/[^"]*\.pdf/,
  );
});

test("whitepaper is a substantive, locally hosted PDF", async () => {
  const whitepaper = await readFile(whitepaperUrl);

  assert.equal(whitepaper.subarray(0, 5).toString(), "%PDF-");
  assert.ok(whitepaper.length > 150_000);
});
