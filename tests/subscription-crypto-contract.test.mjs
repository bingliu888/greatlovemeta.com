import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Clerk bridge and local compatibility session use seven days", async () => {
  const auth = await read("lib/auth.ts");
  assert.match(auth, /SESSION_SECONDS = 60 \* 60 \* 24 \* 7/);
  assert.doesNotMatch(auth, /60 \* 60 \* 12|30 \* 60/);
});

test("footer and pricing publish one GreatLoveMeta-local plan source", async () => {
  const [plans, footer, pricing, checkout, admin] = await Promise.all([read("lib/subscription-plans.ts"), read("components/SiteFooter.tsx"), read("app/[lang]/pricing/pricing-client.tsx"), read("components/CryptoCheckout.tsx"), read("app/api/admin/crypto-settings/route.ts")]);
  for (const marker of ["fallbackAmountCents: 500", "fallbackAmountCents: 800", "7 天免费试用", "内置专属小组音视频与沟通中心", "公开网络研讨会与 HLS 广播", "DeepSeek V4 Flash 默认，可选 OpenAI"]) assert.match(plans, new RegExp(marker));
  assert.doesNotMatch(pricing, /\$100|\$500|\$800/);
  for (const path of ["about", "privacy", "terms", "project"]) assert.match(footer, new RegExp(path));
  assert.doesNotMatch(footer, /LanguageLink|pricing|github/iu);
  for (const source of [pricing, checkout]) assert.match(source, /SUBSCRIPTION_PLANS/);
  assert.match(admin, /getPublishedPrices/);
});

test("SmartMeeting-compatible crypto checkout and administrator controls are complete", async () => {
  const [flow, admin, dashboard, migration, verify] = await Promise.all([read("components/CryptoCheckout.tsx"), read("components/AdminCryptoSettings.tsx"), read("components/AdminDashboard.tsx"), read("drizzle/0118_crypto_payment_checkout.sql"), read("app/api/billing/crypto/verify/route.ts")]);
  for(const marker of ["GreatLoveAutoSwapOnboard","/wallet-assets/greatlove-onboard.js","Connect wallet","connectWallet","eth_sendTransaction","Use direct transfer fallback","Transaction hash (optional)"])assert.ok(flow.includes(marker),`missing ${marker}`);assert.doesNotMatch(flow,/WalletConnect QR|connectInjected|connectWalletConnect|wallet_switchEthereumChain|@walletconnect\/ethereum-provider/);

  assert.match(admin, /WalletConnect Project ID/);
  assert.match(dashboard, /AdminCryptoSettings/);
  assert.match(migration, /crypto_payment_settings/);
  assert.match(migration, /crypto_payment_claims/);
  assert.match(verify, /eth_getTransactionReceipt/);
  assert.match(verify, /TRANSFER_TOPIC/);
  assert.match(verify, /INSERT INTO subscriptions/);
});

test("GreatLoveMeta payment resources remain isolated", async () => {
  const sources = await Promise.all([read("drizzle/0118_crypto_payment_checkout.sql"), read("components/AdminCryptoSettings.tsx"), read("components/CryptoCheckout.tsx"), read("app/api/admin/crypto-settings/route.ts")]);
  const joined = sources.join("\n");
  for (const other of ["SmartMeeting", "Mahj", "FuXi.one", "greatlove.art"]) assert.doesNotMatch(joined, new RegExp(other, "i"));
  assert.doesNotMatch(joined, /receiver_wallet[^\n]*(?:0x[a-fA-F0-9]{40})/);
});
