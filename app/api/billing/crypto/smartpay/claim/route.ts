import { NextResponse } from "next/server";
import { isAddress, type Address, type Hex } from "viem";
import { cryptoRpcUrl } from "../../../../../../lib/crypto-rpc";
import { activeCryptoSettings, cryptoSettingById } from "../../../../../../lib/crypto-settings";
import { subscriptionMonths, subscriptionWindow } from "../../../../../../lib/crypto-subscription-recording";
import { cryptoSubscriptionPlanForIds } from "../../../../../../lib/crypto-subscription";
import { createId, database, nowSeconds } from "../../../../../../lib/db";
import { isPermanentAdmin, requireMember } from "../../../../../../lib/member";
import { awardReferralForSubscription, ensureReferralCode, normalizeReferralCode } from "../../../../../../lib/referrals";
import { smartPayRecipientMatches } from "../../../../../../lib/smartpay-reconciliation";
import { smartPay3ExpectedTokenPair } from "../../../../../../lib/smartpay3-presets";
import { smartPay3TransactionById, verifySmartPay3Identity } from "../../../../../../lib/smartpay3-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await requireMember(request);
    const input = await request.json().catch(() => null) as {
      settingId?: string;
      paymentId?: string;
      memberId?: string;
    } | null;
    const paymentId = String(input?.paymentId || "").trim().toLowerCase();
    const requestedUserId = String(input?.memberId || actor.id);
    if (!/^0x[a-f0-9]{64}$/.test(paymentId)) {
      return NextResponse.json({ error: "Enter a valid on-chain TransactionID" }, { status: 400 });
    }
    if (requestedUserId !== actor.id && !isPermanentAdmin(actor)) {
      return NextResponse.json({ error: "Only the permanent administrator can sync another member" }, { status: 403 });
    }

    const member = await database().prepare("SELECT id,wallet_address AS payerWalletAddress FROM users WHERE id=? LIMIT 1")
      .bind(requestedUserId).first<{ id: string; payerWalletAddress: string | null }>();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (!member.payerWalletAddress || !isAddress(member.payerWalletAddress)) {
      return NextResponse.json({ error: "The member must save a payer wallet first" }, { status: 409 });
    }

    const setting = await cryptoSettingById(String(input?.settingId || ""));
    const configuredContract = setting?.smartPay3Contract;
    if (!setting || !configuredContract || !isAddress(configuredContract)) {
      return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
    }
    const existing = await database().prepare(`SELECT user_id AS userId,current_period_ends_at AS currentPeriodEnd
      FROM smartpay3_payment_claims
      WHERE lower(contract_address)=lower(?) AND lower(transaction_id)=lower(?) LIMIT 1`)
      .bind(configuredContract, paymentId).first<{ userId: string; currentPeriodEnd: number | null }>();
    if (existing) {
      if (existing.userId !== member.id) {
        return NextResponse.json({ error: "This transaction is already assigned to another member" }, { status: 409 });
      }
      return NextResponse.json({ verified: true, alreadyRecorded: true, paymentId, memberId: member.id, currentPeriodEnd: existing.currentPeriodEnd });
    }

    const rpcUrl = await cryptoRpcUrl(setting.chainId);
    if (!rpcUrl) return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
    const contract = configuredContract as Address;
    await verifySmartPay3Identity(rpcUrl, contract);
    const record = await smartPay3TransactionById(rpcUrl, contract, paymentId as Hex);
    const memberRefId = (await ensureReferralCode(member.id)).code;
    const billingPlan = cryptoSubscriptionPlanForIds(record.mainId, record.secondId);
    if (!billingPlan || normalizeReferralCode(record.refId) !== memberRefId
      || !smartPayRecipientMatches(record, member.payerWalletAddress, memberRefId)) {
      return NextResponse.json({ error: "This transaction does not match the member RefID, wallet, or subscription product" }, { status: 422 });
    }
    const tokenPair = smartPay3ExpectedTokenPair(await activeCryptoSettings(), setting);
    if (!tokenPair || record.primaryTokenAddress.toLowerCase() !== setting.tokenContract.toLowerCase()
      || record.secondaryTokenAddress.toLowerCase() !== tokenPair.secondaryTokenAddress.toLowerCase()) {
      return NextResponse.json({ error: "This transaction does not match the configured payment tokens" }, { status: 422 });
    }

    const now = nowSeconds();
    const current = await database().prepare("SELECT current_period_ends_at AS currentPeriodEnd FROM subscriptions WHERE user_id=? LIMIT 1")
      .bind(member.id).first<{ currentPeriodEnd: number | null }>();
    const window = subscriptionWindow({ now, months: subscriptionMonths(billingPlan), currentPeriodEnd: current?.currentPeriodEnd });
    const claimId = createId();
    const subscriptionId = createId();
    const statements = [
      database().prepare(`INSERT INTO smartpay3_payment_claims
        (id,user_id,setting_id,contract_address,transaction_id,payer_wallet,ref_id,main_id,second_id,plan_id,
         primary_token_symbol,primary_token_address,primary_atomic_amount,secondary_token_symbol,secondary_token_address,
         secondary_atomic_amount,entitlement_status,current_period_ends_at,created_at,verified_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(claimId, member.id, setting.id, contract.toLowerCase(), paymentId, record.wallet.toLowerCase(), memberRefId,
          record.mainId, record.secondId, billingPlan, setting.tokenSymbol, record.primaryTokenAddress.toLowerCase(),
          record.primaryTokenAmount, tokenPair.secondarySetting?.tokenSymbol || null, record.secondaryTokenAddress.toLowerCase(),
          record.secondaryTokenAmount, "synced", window.end, now, now),
      database().prepare(`INSERT INTO subscriptions
        (id,user_id,paypal_subscription_id,paypal_plan_id,cadence,status,trial_ends_at,current_period_ends_at,
         cancel_at_period_end,referral_id,created_at,updated_at)
        VALUES (?,?,NULL,NULL,?,'active',NULL,?,0,NULL,?,?)
        ON CONFLICT(user_id) DO UPDATE SET cadence=excluded.cadence,status='active',current_period_ends_at=excluded.current_period_ends_at,
          cancel_at_period_end=0,updated_at=excluded.updated_at`)
        .bind(subscriptionId, member.id, billingPlan, window.end, now, now)
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
