import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { cryptoRpcUrl } from "../../../../../../lib/crypto-rpc";
import { activeCryptoSettings, cryptoSettingById } from "../../../../../../lib/crypto-settings";
import { database } from "../../../../../../lib/db";
import { isPermanentAdmin, requireMember } from "../../../../../../lib/member";
import { ensureReferralCode, normalizeReferralCode } from "../../../../../../lib/referrals";
import { smartPay3LatestTransactions, verifySmartPay3Identity } from "../../../../../../lib/smartpay3-server";
import { smartPay3ExpectedTokenPair } from "../../../../../../lib/smartpay3-presets";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const member = await requireMember();
    const params = new URL(request.url).searchParams;
    const setting = await cryptoSettingById(String(params.get("settingId") || ""));
    const configuredContract = setting?.smartPay3Contract;
    if (!setting || !configuredContract || !isAddress(configuredContract)) {
      return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
    }
    const permanentAdmin = isPermanentAdmin(member);
    const walletParam = String(params.get("wallet") || "").trim();
    const requestedWallet = permanentAdmin ? walletParam : (walletParam || member.payerWalletAddress || "");
    const latestMode = permanentAdmin && !requestedWallet;
    if (!latestMode && !isAddress(requestedWallet)) {
      return NextResponse.json({ error: "Enter a valid EVM wallet address" }, { status: 400 });
    }
    if (!latestMode && requestedWallet.toLowerCase() !== member.payerWalletAddress?.toLowerCase() && !permanentAdmin) {
      return NextResponse.json({ error: "You may only query your saved payer wallet" }, { status: 403 });
    }
    const limit = Math.max(1, Math.min(100, Number(params.get("limit") || 25) || 25));
    const rpcUrl = await cryptoRpcUrl(setting.chainId);
    if (!rpcUrl) {
      return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
    }
    const contract = configuredContract as Address;
    await verifySmartPay3Identity(rpcUrl, contract);
    const maxCount = latestMode ? Math.min(25, limit) : limit;
    const latest = await smartPay3LatestTransactions({ rpcUrl, contract, wallet: latestMode ? undefined : requestedWallet as Address, maxCount });
    const { transactions, totalTransactions } = latest;
    const settings = await activeCryptoSettings();
    const memberRefId = permanentAdmin ? null : (await ensureReferralCode(member.id)).code;
    const matchedMembers = [] as Array<{ id:string; email:string; displayName:string; payerWalletAddress:string; refId:string }>;
    if (permanentAdmin) {
      const wallets = [...new Set((latestMode ? transactions.map(record => record.wallet) : [requestedWallet]).map(value => value.toLowerCase()))];
      for (const wallet of wallets) {
        const result = await database().prepare(`SELECT u.id,u.email,u.display_name AS displayName,
            u.wallet_address AS payerWalletAddress,COALESCE(c.code,'') AS refId
          FROM users u
          LEFT JOIN referral_codes c ON c.user_id=u.id
          WHERE lower(u.wallet_address)=lower(?) ORDER BY u.created_at ASC LIMIT 10`)
          .bind(wallet).all<{ id:string; email:string; displayName:string; payerWalletAddress:string; refId:string }>();
        matchedMembers.push(...(result.results || []));
      }
    }
    const claimStatuses = new Map<string, {
      claimStatus:string;
      memberId:string;
      subscriptionRecorded:boolean;
      subscriptionEndsAt:number | null;
    }>();
    if (transactions.length) {
      const placeholders = transactions.map(() => "?").join(",");
      const claims = await database().prepare(`SELECT c.transaction_id AS paymentId,c.entitlement_status AS claimStatus,c.user_id AS memberId,
          1 AS subscriptionRecorded,c.current_period_ends_at AS subscriptionEndsAt
        FROM smartpay3_payment_claims c
        WHERE lower(c.contract_address)=lower(?) AND lower(c.transaction_id) IN (${placeholders})`)
        .bind(contract, ...transactions.map(record => record.transactionId.toLowerCase()))
        .all<{ paymentId:string; claimStatus:string; memberId:string; subscriptionRecorded:number; subscriptionEndsAt:number | null }>();
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
          || candidate.smartPay3Contract?.toLowerCase() !== contract.toLowerCase()
          || candidate.tokenContract.toLowerCase() !== record.primaryTokenAddress.toLowerCase()) return false;
        const pair = smartPay3ExpectedTokenPair(settings, candidate);
        return pair?.secondaryTokenAddress.toLowerCase() === record.secondaryTokenAddress.toLowerCase();
      }) || null;
      const claim = claimStatuses.get(record.transactionId.toLowerCase());
      return {
        ...record,
        settingId: matchedSetting?.id || null,
        claimStatus: claim?.claimStatus || null,
        claimedMemberId: claim?.memberId || null,
        subscriptionRecorded: claim?.subscriptionRecorded || false,
        subscriptionEndsAt: claim?.subscriptionEndsAt || null
      };
    }).filter(record => permanentAdmin || (
      normalizeReferralCode(record.refId) === memberRefId
      && Boolean(record.settingId)
      && !record.subscriptionRecorded
    ));
    return NextResponse.json({
      wallet: latestMode ? null : requestedWallet.toLowerCase(),
      mode: latestMode ? "latest" : "wallet",
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
    console.warn("SmartPay3 wallet transaction lookup failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "On-chain transactions are temporarily unavailable" }, { status: 502 });
  }
}
