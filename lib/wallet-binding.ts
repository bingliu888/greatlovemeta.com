import { isAddress } from "viem";
import { getDatabase } from "./auth";

export async function saveMemberWallet(userId: string, walletInput: string) {
  const wallet = walletInput.trim().toLowerCase();
  if (wallet && !isAddress(wallet)) throw new Error("INVALID_WALLET");
  const db = getDatabase();
  if (!wallet) {
    await db.prepare("DELETE FROM member_wallet_bindings WHERE user_id=?").bind(userId).run();
    await db.prepare("UPDATE users SET wallet_address=NULL WHERE id=?").bind(userId).run();
    return "";
  }
  const existing = await db.prepare("SELECT user_id AS userId FROM member_wallet_bindings WHERE wallet=? LIMIT 1").bind(wallet).first<{ userId: string }>();
  if (existing && existing.userId !== userId) {
    const active = await db.prepare("SELECT 1 AS active FROM subscriptions WHERE user_id=? AND status='active' AND (current_period_ends_at IS NULL OR current_period_ends_at>?) LIMIT 1")
      .bind(existing.userId, Math.floor(Date.now()/1000)).first<{ active: number }>();
    const paid = await db.prepare("SELECT 1 AS paid FROM smartpay3_payment_claims WHERE user_id=? LIMIT 1").bind(existing.userId).first<{ paid: number }>();
    if (active || paid) throw new Error("WALLET_ALREADY_IN_USE");
    await db.prepare("UPDATE users SET wallet_address=NULL WHERE id=?").bind(existing.userId).run();
    await db.prepare("DELETE FROM member_wallet_bindings WHERE user_id=?").bind(existing.userId).run();
  }
  await db.prepare("DELETE FROM member_wallet_bindings WHERE user_id=?").bind(userId).run();
  await db.prepare("INSERT INTO member_wallet_bindings(wallet,user_id,updated_at) VALUES(?,?,?) ON CONFLICT(wallet) DO UPDATE SET user_id=excluded.user_id,updated_at=excluded.updated_at")
    .bind(wallet,userId,Math.floor(Date.now()/1000)).run();
  await db.prepare("UPDATE users SET wallet_address=? WHERE id=?").bind(wallet,userId).run();
  return wallet;
}
