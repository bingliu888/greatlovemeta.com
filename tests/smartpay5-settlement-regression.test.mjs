import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { boundedJsonBody } from "../lib/bounded-request-body.ts";
import { SMARTPAY5_SUBSCRIPTION_UPSERT_SQL, smartPay5SubscriptionUpsertValues } from "../lib/crypto-subscription-recording.ts";
import { matchesFreshPermanentAdminIdentity } from "../lib/permanent-admin-identity.ts";
import { smartPay5TransactionIdFromReceipt } from "../lib/smartpay5-receipt-transaction.ts";

const EVENT = [{ type: "event", name: "TransactionRecorded", anonymous: false, inputs: [
  { indexed: true, name: "transactionId", type: "bytes32" }, { indexed: false, name: "timestamp", type: "uint64" },
  { indexed: true, name: "wallet", type: "address" }, { indexed: false, name: "payerId", type: "string" },
  { indexed: false, name: "refId", type: "string" }, { indexed: false, name: "mainId", type: "string" },
  { indexed: false, name: "secondId", type: "string" }, { indexed: true, name: "primaryTokenAddress", type: "address" },
  { indexed: false, name: "primaryTokenAmount", type: "uint256" }, { indexed: false, name: "secondaryTokenAddress", type: "address" },
  { indexed: false, name: "secondaryTokenAmount", type: "uint256" },
] }];

function transactionLog(contract, transactionId) {
  const wallet = "0x3333333333333333333333333333333333333333";
  const primary = "0x4444444444444444444444444444444444444444";
  const secondary = "0x5555555555555555555555555555555555555555";
  return { address: contract,
    topics: encodeEventTopics({ abi: EVENT, eventName: "TransactionRecorded",
      args: { transactionId, wallet, primaryTokenAddress: primary } }),
    data: encodeAbiParameters([
      { type: "uint64" }, { type: "string" }, { type: "string" }, { type: "string" },
      { type: "string" }, { type: "uint256" }, { type: "address" }, { type: "uint256" },
    ], [1n, "ABCDEF", "BCDEFG", "membership", "annual", 10n, secondary, 20n]) };
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) files.push(...await sourceFiles(child));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(child);
  }
  return files;
}

test("receipt adapter extracts one internal SmartPay5 TransactionID", () => {
  const contract = "0x1111111111111111111111111111111111111111";
  const transactionId = `0x${"22".repeat(32)}`;
  assert.equal(smartPay5TransactionIdFromReceipt([transactionLog(contract, transactionId)], contract), transactionId);
  assert.notEqual(transactionId, `0x${"99".repeat(32)}`);
  assert.equal(smartPay5TransactionIdFromReceipt([
    transactionLog(contract, transactionId), transactionLog(contract, `0x${"77".repeat(32)}`),
  ], contract), null);
});

test("verify and claim bound input and authenticate/rate-limit before RPC", async () => {
  const [verifyRoute, claimRoute] = await Promise.all([
    readFile(new URL("../app/api/billing/crypto/verify/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/crypto/smartpay/claim/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(verifyRoute, /boundedJsonBody<[^>]+>\(request, 8 \* 1024\)/);
  assert.ok(verifyRoute.indexOf("boundedJsonBody") < verifyRoute.indexOf("requireMember(request)"));
  assert.ok(verifyRoute.indexOf("consumeAccountRequestLimit") < verifyRoute.indexOf("cryptoRpc<Receipt>"));
  assert.ok(claimRoute.indexOf("requireMember(request)") < claimRoute.indexOf("consumeAccountRequestLimit({"));
  assert.match(verifyRoute, /receiptBlock <= latestBlock \? latestBlock - receiptBlock \+ 1n : 0n/);
  assert.match(claimRoute, /receiptBlock <= latestBlock[\s\S]*?latestBlock - receiptBlock \+ 1n[\s\S]*?: 0n/);
  assert.doesNotMatch(verifyRoute, /paymentId:\s*input\??\.txHash/);
  await assert.rejects(
    () => boundedJsonBody(new Request("https://example.invalid", { method: "POST", body: "x".repeat(8_193) }), 8_192),
    error => error instanceof Response && error.status === 413,
  );
});

test("verified primary admin email accepts a different legacy local id and rejects stale identity", () => {
  const member = { id: "legacy", email: "bingliu@cybeye.com", emailVerified: true };
  const identity = { id: "clerk", primaryEmailAddressId: "email", emailAddresses: [{
    id: "email", emailAddress: "bingliu@cybeye.com", verification: { status: "verified" },
  }] };
  assert.equal(matchesFreshPermanentAdminIdentity(member, identity, "bingliu@cybeye.com"), true);
  assert.equal(matchesFreshPermanentAdminIdentity({ ...member, emailVerified: false }, identity, "bingliu@cybeye.com"), false);
  assert.equal(matchesFreshPermanentAdminIdentity(member, { ...identity, primaryEmailAddressId: null }, "bingliu@cybeye.com"), false);
  assert.equal(matchesFreshPermanentAdminIdentity(member, { ...identity, primaryEmailAddressId: "missing" }, "bingliu@cybeye.com"), false);
  assert.equal(matchesFreshPermanentAdminIdentity(member, { ...identity, banned: true }, "bingliu@cybeye.com"), false);
  assert.equal(matchesFreshPermanentAdminIdentity(member, { ...identity, locked: true }, "bingliu@cybeye.com"), false);
});

test("Clerk session fallback accepts only an active user's exact primary email", async () => {
  const source = await readFile(new URL("../lib/auth.ts", import.meta.url), "utf8");
  const fallback = source.slice(source.indexOf("export async function getSessionUser"));
  assert.match(fallback, /primaryEmailAddressId[\s\S]*emailAddresses\.find/);
  assert.match(fallback, /!clerkUser\.banned && !clerkUser\.locked/);
  assert.doesNotMatch(fallback, /emailAddresses\[0\]/);
});

test("every administrator server entry uses the fresh identity gate with no raw email-only grant", async () => {
  const urls = [
    ...await sourceFiles(new URL("../app/[lang]/admin/", import.meta.url)),
    ...await sourceFiles(new URL("../app/api/admin/", import.meta.url)),
    new URL("../app/api/account-context/route.ts", import.meta.url),
    new URL("../app/[lang]/project/layout.tsx", import.meta.url),
  ];
  for (const url of urls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /isPermanentAdminUser|requirePermanentAdmin|getAdminUser|cloudflareMigrationExport/,
      `${url.pathname} does not use the centralized administrator gate`);
    assert.doesNotMatch(source,
      /(?:user|member|admin|actor)\??\.email(?:Address)?(?:\.trim\(\))?(?:\.toLowerCase\(\))?\s*[!=]==?\s*["']bingliu@cybeye\.com["']/i,
      `${url.pathname} grants administrator access from a raw email comparison`);
  }
});

test("distinct annual claims atomically use the latest leap-day expiry and replay is inert", () => {
  assert.match(SMARTPAY5_SUBSCRIPTION_UPSERT_SQL, /strftime\('%s',start_at,'unixepoch','\+' \|\| \? \|\| ' months'\)/);
  assert.doesNotMatch(SMARTPAY5_SUBSCRIPTION_UPSERT_SQL, /durationSeconds|paymentTime\s*\+/);
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE smartpay5_payment_claims(contract_address TEXT,transaction_id TEXT,user_id TEXT,entitlement_status TEXT,
      UNIQUE(contract_address,transaction_id));
    CREATE TABLE subscriptions(id TEXT PRIMARY KEY,user_id TEXT UNIQUE,paypal_subscription_id TEXT,paypal_plan_id TEXT,
      cadence TEXT,status TEXT,trial_ends_at INTEGER,current_period_ends_at INTEGER,cancel_at_period_end INTEGER,
      referral_id TEXT,created_at INTEGER,updated_at INTEGER);`);
  const contract = "0x1111111111111111111111111111111111111111";
  const userId = "member";
  const paymentTime = Date.parse("2024-01-01T12:34:56Z") / 1_000;
  db.prepare(`INSERT INTO subscriptions
    (id,user_id,cadence,status,current_period_ends_at,cancel_at_period_end,created_at,updated_at)
    VALUES ('existing',?,'annual','active',?,0,?,?)`)
    .run(userId, Date.parse("2024-02-29T12:34:56Z") / 1_000, paymentTime, paymentTime);
  const settle = (transactionId, subscriptionId) => {
    db.prepare("INSERT OR IGNORE INTO smartpay5_payment_claims VALUES(?,?,?,'pending_sync')")
      .run(contract, transactionId, userId);
    const write = smartPay5SubscriptionUpsertValues({ contract, transactionId, subscriptionId, userId,
      cadence: "annual", months: 12, paymentTime, verifiedAt: paymentTime });
    db.prepare(SMARTPAY5_SUBSCRIPTION_UPSERT_SQL).run(...write.values);
    db.prepare("UPDATE smartpay5_payment_claims SET entitlement_status='synced' WHERE contract_address=? AND transaction_id=? AND entitlement_status='pending_sync'")
      .run(contract, transactionId);
    return db.prepare("SELECT current_period_ends_at AS value FROM subscriptions WHERE user_id=?").get(userId).value;
  };
  const first = settle(`0x${"11".repeat(32)}`, "first");
  const second = settle(`0x${"22".repeat(32)}`, "second");
  assert.equal(first, Date.parse("2025-03-01T12:34:56Z") / 1_000);
  assert.equal(second, Date.parse("2026-03-01T12:34:56Z") / 1_000);
  assert.equal(settle(`0x${"11".repeat(32)}`, "replay"), second);
});
