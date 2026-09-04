import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { consumeAccountRequestLimit } from "../../../../../lib/account-request-limit";
import { boundedJsonBody } from "../../../../../lib/bounded-request-body";
import { cryptoRpc, cryptoRpcUrl } from "../../../../../lib/crypto-rpc";
import { cryptoSettingById } from "../../../../../lib/crypto-settings";
import { requireMember } from "../../../../../lib/member";
import { smartPay5TransactionIdFromReceipt, type SmartPay5ReceiptLog } from "../../../../../lib/smartpay5-receipt-transaction";
import { POST as claimSmartPay5Transaction } from "../smartpay/claim/route";

type Receipt = { status?: string; blockNumber?: string; logs?: SmartPay5ReceiptLog[] };

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
  const input = await boundedJsonBody<{ settingId?: string; txHash?: string }>(request, 8 * 1024);
  const member = await requireMember(request);
  if (!member.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before synchronizing a payment" },
      { status: 403 },
    );
  }
  const limited = await consumeAccountRequestLimit({
    request,
    scope: "smartpay-verify-transaction",
    userId: member.id,
    limit: 30,
    windowSeconds: 60,
    unavailableMessage: "Payment protection is temporarily unavailable.",
  });
  if (limited) return limited;
  const txHash = String(input?.txHash || "").trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ error: "Enter a valid transaction hash" }, { status: 400 });
  }
  const setting = await cryptoSettingById(String(input?.settingId || ""));
  const configuredContract = setting?.smartPay5Contract;
  if (!setting || !configuredContract || !isAddress(configuredContract)) {
    return NextResponse.json({ error: "On-chain subscription payment is not configured for this token" }, { status: 409 });
  }
  const rpcUrl = await cryptoRpcUrl(setting.chainId);
  if (!rpcUrl) return NextResponse.json({ error: "Blockchain RPC is not configured for this network" }, { status: 503 });
  const receipt = await cryptoRpc<Receipt>(rpcUrl, "eth_getTransactionReceipt", [txHash]);
  if (!receipt?.status || !receipt.blockNumber) {
    return NextResponse.json({ error: "Transaction receipt is still propagating" }, { status: 425 });
  }
  if (receipt.status !== "0x1") {
    return NextResponse.json({ error: "Transaction is not confirmed successfully" }, { status: 422 });
  }
  const latestBlock = BigInt(await cryptoRpc<string>(rpcUrl, "eth_blockNumber", []));
  const receiptBlock = BigInt(receipt.blockNumber);
  const confirmations = receiptBlock <= latestBlock ? latestBlock - receiptBlock + 1n : 0n;
  const requiredConfirmations = BigInt(Math.max(1, setting.minConfirmations));
  if (confirmations < requiredConfirmations) {
    return NextResponse.json({ error: `Waiting for ${requiredConfirmations - confirmations} more confirmations` }, { status: 425 });
  }
  const paymentId = smartPay5TransactionIdFromReceipt(receipt.logs || [], configuredContract as Address);
  if (!paymentId) return NextResponse.json({ error: "No matching on-chain transaction was found" }, { status: 422 });
  const forwarded = new Request(request.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: request.headers.get("cookie") || ""
    },
    body: JSON.stringify({ settingId: input?.settingId, paymentId })
  });
  return claimSmartPay5Transaction(forwarded);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Unable to verify this on-chain transaction" }, { status: 502 });
  }
}
