import { getDatabase, getSessionUser } from "@/lib/auth";
import { cryptoPaymentSettingById, cryptoPlan, tokenAmountFor, tokenAmountToAtomic } from "@/lib/crypto-payments";
import { addressTopic, cryptoRpc, cryptoRpcUrl, TRANSFER_TOPIC } from "@/lib/crypto-rpc";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
    const body = await request.json().catch(() => null) as { settingId?: string; plan?: string; txHash?: string } | null;
    const setting = await cryptoPaymentSettingById(String(body?.settingId || ""));
    const plan = cryptoPlan(body?.plan);
    const txHash = String(body?.txHash || "").toLowerCase();
    if (!setting || !plan || !/^0x[a-f0-9]{64}$/.test(txHash)) return Response.json({ error: "Select a valid plan, rail, and transaction hash" }, { status: 400 });
    const db = getDatabase();
    if (await db.prepare("SELECT id FROM crypto_payment_claims WHERE tx_hash=?").bind(txHash).first()) return Response.json({ error: "This transaction was already claimed" }, { status: 409 });
    const account = await db.prepare("SELECT wallet_address AS wallet FROM users WHERE id=?").bind(user.id).first<{ wallet: string | null }>();
    if (!account?.wallet) return Response.json({ error: "Save the payer wallet first" }, { status: 409 });
    const url = await cryptoRpcUrl(setting.chainId);
    if (!url) return Response.json({ error: "Blockchain RPC is not configured" }, { status: 503 });
    const receipt = await cryptoRpc(url, "eth_getTransactionReceipt", [txHash]) as { status?: string; blockNumber?: string; logs?: Array<{ address?: string; topics?: string[]; data?: string }> };
    if (receipt.status !== "0x1" || !receipt.blockNumber) return Response.json({ error: "Transaction is not confirmed successfully" }, { status: 422 });
    const latest = BigInt(await cryptoRpc(url, "eth_blockNumber", []) as string);
    const confirmations = Number(latest - BigInt(receipt.blockNumber) + 1n);
    if (confirmations < setting.minConfirmations) return Response.json({ error: `Waiting for ${setting.minConfirmations - confirmations} more confirmations` }, { status: 425 });
    const transfer = (receipt.logs || []).find((log) => log.address?.toLowerCase() === setting.tokenContract.toLowerCase() && log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && log.topics?.[1]?.toLowerCase() === addressTopic(account.wallet!) && log.topics?.[2]?.toLowerCase() === addressTopic(setting.receiverWallet));
    if (!transfer?.data) return Response.json({ error: "No matching ERC-20 transfer from payer to receiver was found" }, { status: 422 });
    const observed = BigInt(transfer.data);
    const expected = tokenAmountToAtomic(tokenAmountFor(setting, plan.id), setting.tokenDecimals);
    if (observed < expected) return Response.json({ error: "Transferred amount is below the selected plan price" }, { status: 422 });
    const now = Math.floor(Date.now() / 1000);
    const periodEnds = now + plan.months * 30 * 24 * 60 * 60;
    const claimId = crypto.randomUUID();
    await db.prepare(`INSERT INTO crypto_payment_claims(id,user_id,setting_id,tx_hash,plan_id,chain_id,chain_name,token_symbol,payer_wallet,receiver_wallet,expected_atomic_amount,observed_atomic_amount,status,entitlement_status,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'verified','pending_clerk_sync',?)`).bind(claimId,user.id,setting.id,txHash,plan.id,setting.chainId,setting.chainName,setting.tokenSymbol,account.wallet,setting.receiverWallet,expected.toString(),observed.toString(),now).run();
    await db.prepare(`INSERT INTO subscriptions(id,user_id,cadence,status,current_period_ends_at,cancel_at_period_end,created_at,updated_at) VALUES(?,?,?,'active',?,0,?,?) ON CONFLICT(user_id) DO UPDATE SET cadence=excluded.cadence,status='active',current_period_ends_at=excluded.current_period_ends_at,cancel_at_period_end=0,updated_at=excluded.updated_at`).bind(crypto.randomUUID(),user.id,plan.id,periodEnds,now,now).run();
    await db.prepare("UPDATE crypto_payment_claims SET entitlement_status='synced' WHERE id=?").bind(claimId).run();
    return Response.json({ verified: true, entitlementStatus: "synced" });
  } catch {
    return Response.json({ error: "Server-side on-chain verification is temporarily unavailable" }, { status: 502 });
  }
}
