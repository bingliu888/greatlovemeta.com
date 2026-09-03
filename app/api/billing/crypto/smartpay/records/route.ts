import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { cryptoRpcUrl } from "../../../../../../lib/crypto-rpc";
import { activeCryptoSettings, cryptoSettingById } from "../../../../../../lib/crypto-settings";
import { database } from "../../../../../../lib/db";
import { isPermanentAdmin, requireMember } from "../../../../../../lib/member";
import { ensureReferralCode, normalizeReferralCode } from "../../../../../../lib/referrals";
import { smartPayProductOwnerRefId } from "../../../../../../lib/smartpay-product-owner";
import { smartPay5LatestTransactions, verifySmartPay5Identity } from "../../../../../../lib/smartpay5-server";
import { smartPay5ExpectedTokenPair } from "../../../../../../lib/smartpay5-presets";

export const dynamic = "force-dynamic";

type MatchedMember = { id: string; email: string; displayName: string; payerId: string };

export async function GET(request: Request) {
  try {
    const member = await requireMember();
    const params = new URL(request.url).searchParams;
    const setting = await cryptoSettingById(String(params.get("settingId") || ""));
    const configuredContract = setting?.smartPay5Contract;
    if (!setting || !configuredContract || !isAddress(configuredContract)) {
      return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
    }
    const permanentAdmin = isPermanentAdmin(member);
    const ownPayerId = (await ensureReferralCode(member.id)).code;
    const payerParam = normalizeReferralCode(String(params.get("payerId") || ""));
    const requestedPayerId = permanentAdmin ? payerParam : ownPayerId;
    if (payerParam && !/^[A-HJ-NP-Z2-9]{6}$/.test(payerParam)) {
      return NextResponse.json({ error: "Enter a valid six-character PayerID" }, { status: 400 });
    }
    if (!permanentAdmin && payerParam && payerParam !== ownPayerId) {
      return NextResponse.json({ error: "You may only query your own PayerID" }, { status: 403 });
    }
    const latestMode = permanentAdmin && !requestedPayerId;
    const limit = Math.max(1, Math.min(100, Number(params.get("limit") || 25) || 25));
    const rpcUrl = await cryptoRpcUrl(setting.chainId);
    if (!rpcUrl) return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
    const contract = configuredContract as Address;
    await verifySmartPay5Identity(rpcUrl, contract);
    const maxCount = latestMode ? Math.min(25, limit) : limit;
    const latest = await smartPay5LatestTransactions({ rpcUrl, contract, payerId: latestMode ? undefined : requestedPayerId, maxCount });
    const { transactions, totalTransactions } = latest;
    const [settings, productOwnerRefId] = await Promise.all([activeCryptoSettings(), smartPayProductOwnerRefId()]);
    const matchedMembers: MatchedMember[] = [];
    if (permanentAdmin) {
      const payerIds = [...new Set(transactions.map(record => normalizeReferralCode(record.payerId)).filter(Boolean))];
      for (const payerId of payerIds) {
        const result = await database().prepare(`SELECT u.id,u.email,u.display_name AS displayName,
            upper(c.code) AS payerId
          FROM referral_codes c JOIN users u ON u.id=c.user_id
          WHERE upper(c.code)=? ORDER BY u.created_at ASC LIMIT 2`)
          .bind(payerId).run<MatchedMember>();
        matchedMembers.push(...(result.results || []));
      }
    }
    const claimStatuses = new Map<string, { claimStatus:string; memberId:string; subscriptionRecorded:boolean; subscriptionEndsAt:number | null }>();
    if (transactions.length) {
      const placeholders = transactions.map(() => "?").join(",");
      const claims = await database().prepare(`SELECT c.transaction_id AS paymentId,c.entitlement_status AS claimStatus,c.user_id AS memberId,
          1 AS subscriptionRecorded,c.current_period_ends_at AS subscriptionEndsAt
        FROM smartpay5_payment_claims c
        WHERE lower(c.contract_address)=lower(?) AND lower(c.transaction_id) IN (${placeholders})`)
        .bind(contract, ...transactions.map(record => record.transactionId.toLowerCase()))
        .run<{ paymentId:string; claimStatus:string; memberId:string; subscriptionRecorded:number; subscriptionEndsAt:number | null }>();
      for (const claim of claims.results || []) claimStatuses.set(claim.paymentId.toLowerCase(), {
        claimStatus: claim.claimStatus,
        memberId: claim.memberId,
        subscriptionRecorded: Boolean(claim.subscriptionRecorded),
        subscriptionEndsAt: claim.subscriptionEndsAt
      });
    }
    const transactionsWithStatus = transactions.map(record => {
      const matchedSetting = settings.find(candidate => {
        if (candidate.chainId !== setting.chainId
          || candidate.smartPay5Contract?.toLowerCase() !== contract.toLowerCase()
          || candidate.tokenContract.toLowerCase() !== record.primaryTokenAddress.toLowerCase()) return false;
        const pair = smartPay5ExpectedTokenPair(settings, candidate);
        return pair?.secondaryTokenAddress.toLowerCase() === record.secondaryTokenAddress.toLowerCase();
      }) || null;
      const claim = claimStatuses.get(record.transactionId.toLowerCase());
      return {
        ...record,
        productOwnerRefId,
        settingId: matchedSetting?.id || null,
        claimStatus: claim?.claimStatus || null,
        claimedMemberId: claim?.memberId || null,
        subscriptionRecorded: claim?.subscriptionRecorded || false,
        subscriptionEndsAt: claim?.subscriptionEndsAt || null
      };
    }).filter(record => permanentAdmin || (
      normalizeReferralCode(record.payerId) === ownPayerId
      && normalizeReferralCode(record.refId) === productOwnerRefId
      && Boolean(record.settingId)
      && !record.subscriptionRecorded
    ));
    return NextResponse.json({
      payerId: latestMode ? null : requestedPayerId,
      mode: latestMode ? "latest" : "payer",
      contract,
      chainId: setting.chainId,
      offset: Math.max(0, totalTransactions - transactions.length),
      limit: maxCount,
      totalTransactions: permanentAdmin ? totalTransactions : transactionsWithStatus.length,
      transactions: transactionsWithStatus,
      matchedMembers
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.warn("SmartPay5 PayerID transaction lookup failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "On-chain transactions are temporarily unavailable" }, { status: 502 });
  }
}
