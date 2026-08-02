import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSourceUrl = new URL("../app/[lang]/page.tsx", import.meta.url);
const whitepaperUrl = new URL(
  "../public/docs/GreatLove-RWA-Whitepaper-EN-2026-07-v9.pdf",
  import.meta.url,
);
const chineseWhitepaperUrl = new URL(
  "../public/docs/GreatLove-RWA-Whitepaper-CN-2026-07-v9.pdf",
  import.meta.url,
);

test("homepage exposes the GreatLove welcome resources", async () => {
  const source = await readFile(homeSourceUrl, "utf8");

  assert.match(source, /Welcome to RWA\.<br \/>GreatLove Metaverse\./);
  assert.match(source, /GreatLove AI Agent and RWA rewards are live\./);
  assert.match(
    source,
    /\/docs\/GreatLove-RWA-Whitepaper-EN-2026-07-v9\.pdf/,
  );
  assert.match(
    source,
    /\/docs\/GreatLove-RWA-Whitepaper-CN-2026-07-v9\.pdf/,
  );
  assert.equal(source.match(/target="_blank" rel="noreferrer"/g)?.length, 2);
  assert.doesNotMatch(source, /\.pdf" download/);
  assert.match(source, /href=\{`\/\$\{lang\}\/community`\}/);
  assert.match(source, /Forum · Live Chat · Member discussions/);
  assert.equal(source.match(/id="welcome"/g)?.length, 1);
  assert.doesNotMatch(source, /<section className="glm-welcome-panel"/);
  for (const section of [
    "Build to Win GreatLove Membership Community",
    "On-Chain Swap",
    "Lang Shining Eight Horses RWA Digital Collection NFT",
    "GreatLove RWA NFT Collection",
    "GreatLove NFT Professional Collection",
    "Technical Partners",
  ]) {
    assert.match(source, new RegExp(section));
  }
  for (const hiddenSection of [
    "Claim 100M GLC",
    "Six major sectors",
    "Play-to-Earn",
    "GreatLove FAQ",
    "GLAC GreatLove RWA Art Token",
    "ezSwap cash-discount NFTs",
  ]) {
    assert.doesNotMatch(source, new RegExp(hiddenSection));
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
  assert.ok(chineseWhitepaper.length > 500_000);
});
