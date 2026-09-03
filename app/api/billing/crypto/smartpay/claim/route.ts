import { NextResponse } from "next/server";
import { isAddress, type Address, type Hex } from "viem";
import { consumeAccountRequestLimit } from "../../../../../../lib/account-request-limit";
import { boundedJsonBody } from "../../../../../../lib/bounded-request-body";
import { cryptoRpc, cryptoRpcUrl } from "../../../../../../lib/crypto-rpc";
import { activeCryptoSettings, cryptoSettingById } from "../../../../../../lib/crypto-settings";
import { subscriptionMonths, subscriptionWindow } from "../../../../../../lib/crypto-subscription-recording";
import { cryptoSubscriptionPlanForIds } from "../../../../../../lib/crypto-subscription";
import { createId, database, nowSeconds } from "../../../../../../lib/db";
import { isPermanentAdmin, requireMember } from "../../../../../../lib/member";
import { awardReferralForSubscription, ensureReferralCode, normalizeReferralCode } from "../../../../../../lib/referrals";
import { smartPayRecipientMatches } from "../../../../../../lib/smartpay-reconciliation";
import { smartPayProductOwnerRefId } from "../../../../../../lib/smartpay-product-owner";
import { smartPayRecordTimestamp } from "../../../../../../lib/smartpay-record-timestamp";
import { smartPay5ExpectedTokenPair } from "../../../../../../lib/smartpay5-presets";
import {
  smartPay5ReceiptByTransactionId,
  smartPay5TransactionById,
  verifySmartPay5Identity,
} from "../../../../../../lib/smartpay5-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await requireMember(request);
    if (!actor.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before synchronizing a payment" },
        { status: 403 },
      );
    }
    const limited = await consumeAccountRequestLimit({
      request,
      scope: "smartpay-claim",
      userId: actor.id,
      limit: 30,
      windowSeconds: 60,
      unavailableMessage: "Payment protection is temporarily unavailable.",
    });
    if (limited) return limited;
    const input = await boundedJsonBody<{
      settingId?: string;
      paymentId?: string;
      memberId?: string;
    }>(request, 8 * 1024);
    const paymentId = String(input?.paymentId || "").trim().toLowerCase();
    const requestedUserId = String(input?.memberId || actor.id);
    if (!/^0x[a-f0-9]{64}$/.test(paymentId)) {
      return NextResponse.json({ error: "Enter a valid on-chain TransactionID" }, { status: 400 });
    }
    if (requestedUserId !== actor.id && !isPermanentAdmin(actor)) {
      return NextResponse.json({ error: "Only the permanent administrator can sync another member" }, { status: 403 });
    }

    const member = await database().prepare("SELECT id FROM users WHERE id=? LIMIT 1")
      .bind(requestedUserId).first<{ id: string }>();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const setting = await cryptoSettingById(String(input?.settingId || ""));
    const configuredContract = setting?.smartPay5Contract;
    if (!setting || !configuredContract || !isAddress(configuredContract)) {
      return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
    }
    const existing = await database().prepare(`SELECT user_id AS userId,
      entitlement_status AS entitlementStatus,current_period_ends_at AS currentPeriodEnd
      FROM smartpay5_payment_claims
      WHERE lower(contract_address)=lower(?) AND lower(transaction_id)=lower(?) LIMIT 1`)
      .bind(configuredContract, paymentId).first<{
        userId: string;
        entitlementStatus: string;
        currentPeriodEnd: number | null;
      }>();
    if (existing) {
      if (existing.userId !== member.id) {
        return NextResponse.json({ error: "This transaction is already assigned to another member" }, { status: 409 });
      }
      if (existing.entitlementStatus === "synced" && existing.currentPeriodEnd) {
        return NextResponse.json({
          verified: true,
          alreadyRecorded: true,
          paymentId,
          memberId: member.id,
          currentPeriodEnd: existing.currentPeriodEnd,
        });
      }
    }

    const rpcUrl = await cryptoRpcUrl(setting.chainId);
    if (!rpcUrl) return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
    const contract = configuredContract as Address;
    await verifySmartPay5Identity(rpcUrl, contract);
    const record = await smartPay5TransactionById(rpcUrl, contract, paymentId as Hex);
    const [payer, productOwnerRefId] = await Promise.all([
      ensureReferralCode(member.id),
      smartPayProductOwnerRefId(),
    ]);
    const billingPlan = cryptoSubscriptionPlanForIds(record.mainId, record.secondId);
    if (!billingPlan || normalizeReferralCode(record.payerId) !== payer.code
      || normalizeReferralCode(record.refId) !== productOwnerRefId
      || !smartPayRecipientMatches(record, payer.code, productOwnerRefId)) {
      return NextResponse.json({ error: "This transaction does not match the member PayerID, product-owner RefID, or subscription product" }, { status: 422 });
    }
    const tokenPair = smartPay5ExpectedTokenPair(await activeCryptoSettings(), setting);
    if (!tokenPair || record.primaryTokenAddress.toLowerCase() !== setting.tokenContract.toLowerCase()
      || record.secondaryTokenAddress.toLowerCase() !== tokenPair.secondaryTokenAddress.toLowerCase()) {
      return NextResponse.json({ error: "This transaction does not match the configured payment tokens" }, { status: 422 });
    }

    const receipt = await smartPay5ReceiptByTransactionId({
      rpcUrl,
      contract,
      transactionId: paymentId as Hex,
      timestamp: record.timestamp,
    });
    const latestBlock = BigInt(await cryptoRpc<string>(rpcUrl, "eth_blockNumber", []));
    const receiptBlock = BigInt(receipt.blockNumber!);
    const confirmations = receiptBlock <= latestBlock
      ? latestBlock - receiptBlock + 1n
      : 0n;
    const requiredConfirmations = BigInt(Math.max(1, setting.minConfirmations));
    if (confirmations < requiredConfirmations) {
      return NextResponse.json(
        { error: `Waiting for ${requiredConfirmations - confirmations} more confirmations` },
        { status: 425 },
      );
    }

    const now = nowSeconds();
    const paymentTime = smartPayRecordTimestamp(record.timestamp, now);
    const current = await database().prepare("SELECT current_period_ends_at AS currentPeriodEnd FROM subscriptions WHERE user_id=? LIMIT 1")
      .bind(member.id).first<{ currentPeriodEnd: number | null }>();
    const window = subscriptionWindow({ now: paymentTime, months: subscriptionMonths(billingPlan), currentPeriodEnd: current?.currentPeriodEnd });
    const claimId = createId();
    const subscriptionId = createId();
    await database().prepare(`INSERT INTO smartpay5_payment_claims
        (id,user_id,setting_id,contract_address,transaction_id,payer_wallet,payer_id,ref_id,main_id,second_id,plan_id,
         primary_token_symbol,primary_token_address,primary_atomic_amount,secondary_token_symbol,secondary_token_address,
         secondary_atomic_amount,entitlement_status,current_period_ends_at,created_at,verified_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending_sync',NULL,?,?)
        ON CONFLICT(contract_address,transaction_id) DO NOTHING`)
        .bind(claimId, member.id, setting.id, contract.toLowerCase(), paymentId, record.wallet.toLowerCase(), record.payerId, record.refId,
          record.mainId, record.secondId, billingPlan, setting.tokenSymbol, record.primaryTokenAddress.toLowerCase(),
          record.primaryTokenAmount, tokenPair.secondarySetting?.tokenSymbol || null, record.secondaryTokenAddress.toLowerCase(),
          record.secondaryTokenAmount, paymentTime, now).run();
    const owner = await database().prepare(`SELECT user_id AS userId
      FROM smartpay5_payment_claims WHERE lower(contract_address)=lower(?)
        AND lower(transaction_id)=lower(?) LIMIT 1`).bind(contract, paymentId)
      .first<{ userId: string }>();
    if (!owner || owner.userId !== member.id) {
      return NextResponse.json(
        { error: "This transaction is already assigned to another member" },
        { status: 409 },
      );
    }

    const statements = [
      database().prepare(`INSERT INTO subscriptions
        (id,user_id,paypal_subscription_id,paypal_plan_id,cadence,status,trial_ends_at,current_period_ends_at,
         cancel_at_period_end,referral_id,created_at,updated_at)
        VALUES (?,?,NULL,NULL,?,'active',NULL,?,0,NULL,?,?)
        ON CONFLICT(user_id) DO UPDATE SET cadence=excluded.cadence,status='active',current_period_ends_at=excluded.current_period_ends_at,
          cancel_at_period_end=0,updated_at=excluded.updated_at`)
        .bind(subscriptionId, member.id, billingPlan, window.end, paymentTime, now),
      database().prepare(`UPDATE smartpay5_payment_claims SET
        entitlement_status='synced',current_period_ends_at=?,verified_at=?
        WHERE lower(contract_address)=lower(?) AND lower(transaction_id)=lower(?)
          AND user_id=?`)
        .bind(window.end, now, contract, paymentId, member.id),
    ];
    if (member.id !== actor.id) {
      statements.push(database().prepare(`INSERT INTO crypto_payment_admin_audit
        (id,admin_user_id,action,setting_id,created_at) VALUES (?,?,'sync_smartpay_transaction_for_member',?,?)`)
        .bind(createId(), actor.id, setting.id, now));
    }
    await database().batch(statements);
    await awardReferralForSubscription({ userId: member.id, subscriptionId, providerPaymentReference: paymentId });
    return NextResponse.json({
      verified: true,
      paymentMode: "contract",
      paymentId,
      currentPeriodStart: window.start,
      currentPeriodEnd: window.end,
      memberId: member.id
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.warn("On-chain TransactionID synchronization failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "Unable to synchronize this on-chain transaction" }, { status: 502 });
  }
}
