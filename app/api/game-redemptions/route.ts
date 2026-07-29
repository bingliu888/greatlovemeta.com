import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { gameRedemptions } from "../../../db/schema";
import { createId } from "../../../lib/auth";
import { POINT_VALUE } from "../../../lib/game-reward-rules.js";
import { requestUser } from "../../../lib/request-user";

export async function POST() {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const database = getDb();
  const id = createId();
  const requestedAt = Math.floor(Date.now() / 1000);
  await database.run(sql`
    INSERT INTO game_redemptions (id, user_id, wallet_address, amount, status, requested_at)
    SELECT
      ${id},
      ${user.id},
      wallet_address,
      (
        coalesce((SELECT sum(raw_score) * ${POINT_VALUE} FROM game_daily_logs WHERE user_id = ${user.id}), 0)
        - coalesce((SELECT sum(amount) FROM game_redemptions WHERE user_id = ${user.id} AND status IN ('pending', 'approved', 'completed')), 0)
      ),
      'pending',
      ${requestedAt}
    FROM users
    WHERE id = ${user.id}
      AND wallet_address IS NOT NULL
      AND wallet_address <> ''
      AND (
        coalesce((SELECT sum(raw_score) * ${POINT_VALUE} FROM game_daily_logs WHERE user_id = ${user.id}), 0)
        - coalesce((SELECT sum(amount) FROM game_redemptions WHERE user_id = ${user.id} AND status IN ('pending', 'approved', 'completed')), 0)
      ) > 0
  `);
  const [request] = await database
    .select({
      id: gameRedemptions.id,
      amount: gameRedemptions.amount,
      status: gameRedemptions.status,
      walletAddress: gameRedemptions.walletAddress,
      requestedAt: gameRedemptions.requestedAt,
    })
    .from(gameRedemptions)
    .where(and(eq(gameRedemptions.id, id), eq(gameRedemptions.userId, user.id)))
    .limit(1);
  if (!request) {
    return Response.json({ error: "A wallet and a positive redeemable balance are required" }, { status: 409 });
  }
  return Response.json({ ok: true, redemption: request });
}
