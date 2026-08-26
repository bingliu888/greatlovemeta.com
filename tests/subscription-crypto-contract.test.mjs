import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Clerk bridge and local compatibility session use seven days", async () => {
  const auth = await read("lib/auth.ts");
  assert.match(auth, /SESSION_SECONDS = 60 \* 60 \* 24 \* 7/);
  assert.doesNotMatch(auth, /60 \* 60 \* 12|30 \* 60/);
});

test("footer and pricing publish one GreatLoveMeta-local monthly and annual plan source", async () => {
  const [plans, footer, pricing, checkout, admin, pricingPage] = await Promise.all([read("lib/subscription-plans.ts"), read("components/SiteFooter.tsx"), read("app/[lang]/pricing/pricing-client.tsx"), read("components/CryptoCheckout.tsx"), read("app/api/admin/crypto-settings/route.ts"), read("app/[lang]/pricing/page.tsx")]);
  for (const marker of ["fallbackAmountCents: 500", "fallbackAmountCents: 800", "7 天免费试用", "内置专属小组音视频与沟通中心", "公开网络研讨会与 HLS 广播", "DeepSeek V4 Flash 默认，可选 OpenAI"]) assert.match(plans, new RegExp(marker));
  assert.doesNotMatch(pricing, /\$100|\$500|\$800/);
  for (const path of ["about", "privacy", "terms", "project"]) assert.match(footer, new RegExp(path));
  assert.match(footer, /pricing/);
  assert.doesNotMatch(footer, /LanguageLink|github/iu);
  assert.match(checkout, /availablePlans/);
  assert.match(pricingPage, /getPublishedPrices/);
  assert.match(admin, /getSubscriptionPlans/);
  assert.doesNotMatch([plans, pricing, checkout, admin].join("\n"), /six_month|sixMonth|Six months/);
});

test("SmartPay3 checkout and administrator controls are complete", async () => {
  const [flow, admin, dashboard, migration, verify, consoleSource] = await Promise.all([read("components/CryptoCheckout.tsx"), read("components/AdminCryptoSettings.tsx"), read("components/AdminDashboard.tsx"), read("drizzle/0122_smartpay3_refid.sql"), read("app/api/billing/crypto/smartpay/claim/route.ts"), read("components/SmartPayAdminConsole.tsx")]);
  for(const marker of ["Connect wallet","connectWallet","eth_sendTransaction","Transaction hash (optional)","prepared.refId","verifyCryptoPaymentWithConfirmations"])assert.ok(flow.includes(marker),`missing ${marker}`);
  assert.doesNotMatch(flow,/WalletConnect QR|connectInjected|connectWalletConnect|@walletconnect\/ethereum-provider/);
  assert.match(admin, /WalletConnect Project ID/);
  assert.match(dashboard, /admin\/crypto-payments/);
  assert.match(migration, /smartpay3_payment_claims/);
  assert.match(migration, /member_wallet_bindings/);
  assert.match(verify, /normalizeReferralCode\(record\.refId\)/);
  assert.match(verify, /INSERT INTO smartpay3_payment_claims/);
  assert.match(consoleSource, /Redeploy \$\{contractName\}/);
});

test("GreatLoveMeta payment resources remain isolated", async () => {
  const sources = await Promise.all([read("drizzle/0118_crypto_payment_checkout.sql"), read("components/AdminCryptoSettings.tsx"), read("components/CryptoCheckout.tsx"), read("app/api/admin/crypto-settings/route.ts")]);
  const joined = sources.join("\n");
  for (const other of ["SmartMeeting", "Mahj", "FuXi.one", "greatlove.art"]) assert.doesNotMatch(joined, new RegExp(other, "i"));
  assert.doesNotMatch(joined, /receiver_wallet[^\n]*(?:0x[a-fA-F0-9]{40})/);
});
