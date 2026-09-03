import { isAddress } from "viem";
import { getDatabase } from "./auth";

export async function saveMemberWallet(userId: string, walletInput: string) {
  const wallet = walletInput.trim().toLowerCase();
  if (wallet && !isAddress(wallet)) throw new Error("INVALID_WALLET");
  const db = getDatabase();
  await db.prepare("UPDATE users SET wallet_address=? WHERE id=?").bind(wallet || null, userId).run();
  return wallet;
}
