import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { cryptoRpcUrl } from "../../../../../lib/crypto-rpc";
import { activeCryptoSettings, cryptoSettingById } from "../../../../../lib/crypto-settings";
import { database } from "../../../../../lib/db";
import { hasFreshPermanentAdmin, requireMember } from "../../../../../lib/member";
import { cryptoSubscriptionIdsForPlan } from "../../../../../lib/crypto-subscription";
import { ensureReferralCode, normalizeReferralCode } from "../../../../../lib/referrals";
import { smartPayProductOwnerRefId } from "../../../../../lib/smartpay-product-owner";
import { smartPay5LatestTransactions, verifySmartPay5Identity } from "../../../../../lib/smartpay5-server";
import { smartPay5ExpectedTokenPair } from "../../../../../lib/smartpay5-presets";
import { smartPayRecipientMatches } from "../../../../../lib/smartpay-reconciliation";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const actor = await requireMember();
    const input = await request.json().catch(() => null) as {
      plan?: string;
      settingId?: string;
      memberId?: string;
      includeClaimed?: boolean;
    } | null;
    const requestedMemberId = String(input?.memberId || actor.id);
    let member: { id:string } = actor;
    if (requestedMemberId !== actor.id) {
      if (!await hasFreshPermanentAdmin(actor)) return NextResponse.json({ error: "Only the permanent administrator can check another member" }, { status: 403 });
      const target = await database().prepare("SELECT id FROM users WHERE id=? LIMIT 1")
        .bind(requestedMemberId).first<{ id:string }>();
      if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
      member = target;
    }
    const setting = await cryptoSettingById(String(input?.settingId || ""));
    if (!setting) return NextResponse.json({ error: "Select an active crypto payment setting" }, { status: 400 });
    if (!setting.smartPay5Contract || !isAddress(setting.smartPay5Contract)) {
      return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
    }
    const billingPlan = input?.plan === "annual" ? "annual" : "monthly";
    const rpcUrl = await cryptoRpcUrl(setting.chainId);
    if (!rpcUrl) return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
    const [payer, productOwnerRefId] = await Promise.all([
      ensureReferralCode(member.id),
      smartPayProductOwnerRefId(),
    ]);
    const contract = setting.smartPay5Contract as Address;
    const ids = cryptoSubscriptionIdsForPlan(billingPlan);
    await verifySmartPay5Identity(rpcUrl, contract);
    const { transactions: payments } = await smartPay5LatestTransactions({ rpcUrl, contract, payerId: payer.code, maxCount: 100 });
    const tokenPair = smartPay5ExpectedTokenPair(await activeCryptoSettings(), setting);
    if (!tokenPair) return NextResponse.json({ error: "This token pair is not available for on-chain payment" }, { status: 409 });
    for (const payment of payments) {
      if (normalizeReferralCode(payment.payerId) !== payer.code
        || normalizeReferralCode(payment.refId) !== productOwnerRefId
        || !smartPayRecipientMatches(payment, payer.code, productOwnerRefId)) continue;
      if (payment.mainId !== ids.mainId || payment.secondId !== ids.secondId) continue;
      if (payment.primaryTokenAddress.toLowerCase() !== setting.tokenContract.toLowerCase()
        || payment.secondaryTokenAddress.toLowerCase() !== tokenPair.secondaryTokenAddress) continue;
      const claimed = await database().prepare(`SELECT id,user_id AS memberId,entitlement_status AS status,
          transaction_id AS txHash,current_period_ends_at AS currentPeriodEnd
        FROM smartpay5_payment_claims
        WHERE lower(contract_address)=lower(?) AND lower(transaction_id)=lower(?) LIMIT 1`)
        .bind(contract, payment.transactionId)
        .first<{ id:string; memberId:string; status:string; txHash:string; currentPeriodEnd:number | null }>();
      if (!claimed) return NextResponse.json({
        txHash: payment.transactionId,
        paymentMode: "smartpay5",
        paymentId: payment.transactionId,
        claimed: false,
        timestamp: Number(payment.timestamp),
        tokenAmount: payment.primaryTokenAmount.toString()
      });
      if (input?.includeClaimed === true && claimed.memberId === member.id) {
        return NextResponse.json({
          txHash: claimed.txHash || payment.transactionId,
          paymentMode: "smartpay5",
          paymentId: payment.transactionId,
          claimed: true,
          verified: claimed.status === "synced",
          timestamp: Number(payment.timestamp),
          tokenAmount: payment.primaryTokenAmount.toString(),
          currentPeriodEnd: claimed.currentPeriodEnd
        });
      }
    }
    return NextResponse.json({
      error: input?.includeClaimed === true
        ? "No matching payment was found in recent on-chain activity"
        : "No unclaimed matching payment was found in recent on-chain activity"
    }, { status: 404 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.warn("Crypto payment lookup failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "Blockchain lookup is temporarily unavailable" }, { status: 502 });
  }
}
