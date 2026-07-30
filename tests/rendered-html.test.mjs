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
  assert.match(html, /大爱元宇宙/);
  assert.match(html, /欢迎来到大爱元宇宙。/);
  assert.doesNotMatch(html, /欢迎光临 RWA|欢迎光临 RWA，/);
  assert.match(html, /大爱 AI Agent 与 RWA 奖励已上线。/);
  assert.match(
    html,
    /\/docs\/GreatLove-RWA-Whitepaper-EN-2026-07-v9\.pdf/,
  );
  assert.match(
    html,
    /\/docs\/GreatLove-RWA-Whitepaper-CN-2026-07-v9\.pdf/,
  );
  assert.match(html, /Android APK 下载/);
  assert.match(html, /App Store 下载/);
  assert.match(html, /加入社区/);
  assert.match(html, /\/zh\/community/);
  assert.match(html, /论坛 · Live Chat · 会员交流/);
  assert.match(html, /共建共赢的大爱社区/);
  assert.match(html, /链上兑换/);
  assert.match(html, /郎士宁八骏图 RWA数字藏品NFT/);
  assert.match(html, /大爱 RWA NFT 收藏/);
  assert.match(html, /大爱NFT系列专业收藏/);
  assert.match(html, /技术合作伙伴/);
  assert.match(html, /幸运轮盘/);
  assert.match(html, /\/zh\/lucky-wheel\?mode=trial/);
  assert.match(html, /大爱艺术世界/);
  assert.doesNotMatch(html, /GreatLoveMeta(?:\.com)? 社区|GreatLoveMeta(?:\.com)? 会员名录|大爱艺术社区|大富翁|Monopoly|地产策略/);
  assert.doesNotMatch(html, /领取 1 亿大爱社区币|六大板块简介|边玩边赚|大爱 FAQ|GLAC 大爱 RWA 艺术币|全球通 ezSwap/);
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
