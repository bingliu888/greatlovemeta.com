import assert from "node:assert/strict";
import test from "node:test";

const clerkPublishableKey = "pk_live_Y2xlcmsuZ3JlYXRsb3ZlbWV0YS5jb20k";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = clerkPublishableKey;
process.env.CLERK_SECRET_KEY = "sk_test_dGVzdC5jbGVyay5hY2NvdW50cy5kZXYk";

const testEnv = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
};

test("renders GreatLoveMeta production metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/zh", {
      headers: { accept: "text/html" },
    }),
    testEnv,
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /GreatLoveMeta\.com/);
  assert.match(html, /欢迎光临 RWA/);
  assert.match(
    html,
    /\/docs\/GreatLove-RWA-Whitepaper-EN-2026-07-v9\.pdf/,
  );
  assert.match(
    html,
    /\/docs\/GreatLove-RWA-Whitepaper-CN-v4\.1\.pdf/,
  );
  assert.match(html, /Android APK 下载/);
  assert.match(html, /App Store 下载/);
  assert.match(html, /加入社区/);
  assert.match(html, /\/zh\/community/);
  assert.match(html, /论坛 · Live Chat · 会员交流/);
  assert.match(html, /六大板块简介/);
  assert.match(html, /链上钱包量/);
  assert.match(html, /郎世宁八骏图/);
  assert.match(html, /全球通 ezSwap 现金折扣券 NFT/);
  assert.match(html, /边玩边赚/);
  assert.match(html, /大爱 FAQ/);
  assert.match(html, /技术合作伙伴/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("renders Ask Guru when a stale legacy session cookie is present", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `assistant-stale-cookie-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/en/assistant", {
      headers: {
        accept: "text/html",
        cookie: "glm_session=stale-session-token",
      },
    }),
    testEnv,
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Message Guru/);
  assert.doesNotMatch(html, /Internal Server Error|Application error/i);
});
