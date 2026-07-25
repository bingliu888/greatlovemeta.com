import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSourceUrl = new URL("../app/[lang]/page.tsx", import.meta.url);
const whitepaperUrl = new URL(
  "../public/docs/GreatLove-RWA-Whitepaper-EN-2026-07-v9.pdf",
  import.meta.url,
);
const chineseWhitepaperUrl = new URL(
  "../public/docs/GreatLove-RWA-Whitepaper-CN-v4.1.pdf",
  import.meta.url,
);

test("homepage exposes the GreatLove welcome resources", async () => {
  const source = await readFile(homeSourceUrl, "utf8");

  assert.match(source, /Welcome to RWA\.<br \/>GreatLove Metaverse\./);
  assert.match(
    source,
    /\/docs\/GreatLove-RWA-Whitepaper-EN-2026-07-v9\.pdf/,
  );
  assert.match(
    source,
    /\/docs\/GreatLove-RWA-Whitepaper-CN-v4\.1\.pdf/,
  );
  assert.match(source, /download>/);
  assert.match(source, /href=\{`\/\$\{lang\}\/community`\}/);
  assert.match(source, /Forum · Live Chat · Member discussions/);
  assert.equal(source.match(/id="welcome"/g)?.length, 1);
  assert.doesNotMatch(source, /<section className="glm-welcome-panel"/);
  for (const section of [
    "Six major sectors",
    "On-chain Swap",
    "Lang Shining Eight Horses",
    "ezSwap cash-discount NFTs",
    "Play-to-Earn",
    "GreatLove FAQ",
    "Technical Partners",
  ]) {
    assert.match(source, new RegExp(section));
  }
  assert.match(
    source,
    /https:\/\/files\.greatlovedao\.com\/storage\/v1\/object\/public\/apk\/greatlove\.apk/,
  );
  assert.match(source, /https:\/\/apps\.apple\.com\/app\/greatlove-/);
  assert.doesNotMatch(
    source,
    /href="https:\/\/[^"]*greatlovedao\.com\/[^"]*whitepaper[^"]*\.pdf/i,
  );
});

test("English and Chinese whitepapers are substantive, locally hosted PDFs", async () => {
  const [whitepaper, chineseWhitepaper] = await Promise.all([
    readFile(whitepaperUrl),
    readFile(chineseWhitepaperUrl),
  ]);

  assert.equal(whitepaper.subarray(0, 5).toString(), "%PDF-");
  assert.ok(whitepaper.length > 150_000);
  assert.equal(chineseWhitepaper.subarray(0, 5).toString(), "%PDF-");
  assert.ok(chineseWhitepaper.length > 5_000_000);
});
