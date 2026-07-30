import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSourceUrl = new URL("../app/[lang]/page.tsx", import.meta.url);
const collectionSourceUrl = new URL(
  "../app/[lang]/collections/[slug]/page.tsx",
  import.meta.url,
);
const monopolyUrl = new URL("../public/games/monopoly.html", import.meta.url);

const clerkPublishableKey = "pk_live_Y2xlcmsuZ3JlYXRsb3ZlbWV0YS5jb20k";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = clerkPublishableKey;
process.env.CLERK_SECRET_KEY = "sk_test_dGVzdC5jbGVyay5hY2NvdW50cy5kZXYk";

const testEnv = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
};

test("homepage collection and ecosystem links no longer open GreatLoveDAO pages", async () => {
  const [home, collection, monopoly] = await Promise.all([
    readFile(homeSourceUrl, "utf8"),
    readFile(collectionSourceUrl, "utf8"),
    readFile(monopolyUrl, "utf8"),
  ]);

  for (const route of [
    "/en/collections/eight-horses",
    "/en/collections/rwa-nft",
    "/en/collections/professional",
    "/zh/collections/eight-horses",
    "/zh/collections/rwa-nft",
    "/zh/collections/professional",
  ]) {
    assert.match(home, new RegExp(route.replaceAll("/", "\\/")));
  }

  assert.match(home, /href=\{`\/\$\{lang\}\/news`\}/);
  assert.match(home, /href=\{`\/\$\{lang\}\/members`\}/);
  assert.match(home, /href=\{`https:\/\/greatlove\.art\/\$\{lang\}`\}/);
  assert.match(home, /<b>GreatLove\.Art<\/b>/);
  assert.match(home, /GreatLove art community/);
  assert.match(home, /大爱艺术世界/);
  assert.doesNotMatch(home, /href=.*www\.greatlovedao\.com/i);
  assert.doesNotMatch(monopoly, /href="https:\/\/www\.greatlovedao\.com/i);

  for (const expected of [
    '"eight-horses"',
    '"rwa-nft"',
    "professional:",
    "/greatlove-horses.png",
    "/greatlove-rwa.gif",
    "/greatlove-pro.gif",
    "This collection page and its artwork are now presented directly on GreatLoveMeta.com",
    "本收藏页面与艺术图现已直接迁移至大爱元宇宙",
  ]) {
    assert.match(collection, new RegExp(expected.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(collection, /greatlovedao\.com/i);
});

test("English and Chinese Eight Horses pages render locally", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `local-collections-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const [englishResponse, chineseResponse] = await Promise.all([
    worker.fetch(
      new Request("http://localhost/en/collections/eight-horses", {
        headers: { accept: "text/html" },
      }),
      testEnv,
      { waitUntil() {}, passThroughOnException() {} },
    ),
    worker.fetch(
      new Request("http://localhost/zh/collections/eight-horses", {
        headers: { accept: "text/html" },
      }),
      testEnv,
      { waitUntil() {}, passThroughOnException() {} },
    ),
  ]);

  assert.equal(englishResponse.status, 200);
  assert.equal(chineseResponse.status, 200);

  const [english, chinese] = await Promise.all([
    englishResponse.text(),
    chineseResponse.text(),
  ]);

  assert.match(english, /Lang Shining Eight Horses RWA Digital Collection NFT/);
  assert.match(english, /Hosted by GreatLoveMeta/i);
  assert.match(english, /\/greatlove-horses\.png/);
  assert.doesNotMatch(english, /greatlovedao\.com/i);

  assert.match(chinese, /郎士宁八骏图 RWA数字藏品NFT/);
  assert.match(chinese, /由大爱元宇宙本站呈现/);
  assert.match(chinese, /\/zh#collections/);
  assert.doesNotMatch(chinese, /greatlovedao\.com/i);
});
