import { and, asc, count, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { gameDailyLogs } from "../../../db/schema";
import { createId } from "../../../lib/auth";
import { requestUser } from "../../../lib/request-user";

const GAME_LIMITS = {
  monopoly: { minimum: 3, maximum: 36 },
  miner: { minimum: 0, maximum: 36 },
} as const;
const DAILY_PLAY_LIMIT = 1;
const POINT_VALUE = 10_000;

type GameKey = keyof typeof GAME_LIMITS;

function isGameKey(value: string): value is GameKey {
  return value in GAME_LIMITS;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed)) return false;
  const difference = Math.abs(parsed - Date.now());
  return difference <= 36 * 60 * 60 * 1000;
}

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const searchParams = new URL(request.url).searchParams;
  const requestedDate = searchParams.get("date") || utcDate();
  const requestedGame = searchParams.get("game") || "";
  if (!validDate(requestedDate)) return Response.json({ error: "Invalid date" }, { status: 400 });
  if (requestedGame && !isGameKey(requestedGame)) return Response.json({ error: "Invalid game" }, { status: 400 });
  const entries = await getDb()
    .select({
      id: gameDailyLogs.id,
      game: gameDailyLogs.gameKey,
      rawScore: gameDailyLogs.rawScore,
      score: gameDailyLogs.score,
      unit: gameDailyLogs.unit,
      playedAt: gameDailyLogs.createdAt,
    })
    .from(gameDailyLogs)
    .where(requestedGame
      ? and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, requestedDate), eq(gameDailyLogs.gameKey, requestedGame))
      : and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, requestedDate)))
    .orderBy(asc(gameDailyLogs.createdAt))
    .limit(100);
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    score: entry.rawScore * POINT_VALUE,
  }));
  const playsUsed = normalizedEntries.length;
  return Response.json({
    date: requestedDate,
    entries: normalizedEntries,
    limit: DAILY_PLAY_LIMIT,
    playsUsed,
    playsRemaining: Math.max(0, DAILY_PLAY_LIMIT - playsUsed),
    limitReached: playsUsed >= DAILY_PLAY_LIMIT,
  });
}

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as {
    game?: string;
    rawScore?: number;
    attemptId?: string;
    playDate?: string;
  };
  const game = String(payload.game || "");
  const rawScore = Number(payload.rawScore);
  const attemptId = String(payload.attemptId || "");
  const playDate = String(payload.playDate || "");
  if (!isGameKey(game)) return Response.json({ error: "Invalid game" }, { status: 400 });
  if (!Number.isInteger(rawScore) || rawScore < GAME_LIMITS[game].minimum || rawScore > GAME_LIMITS[game].maximum) {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9-]{16,80}$/.test(attemptId)) {
    return Response.json({ error: "Invalid attempt" }, { status: 400 });
  }
  if (!validDate(playDate)) return Response.json({ error: "Invalid date" }, { status: 400 });

  const database = getDb();
  const [existing] = await database
    .select({ id: gameDailyLogs.id })
    .from(gameDailyLogs)
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.attemptId, attemptId)))
    .limit(1);
  if (existing) {
    const [usage] = await database
      .select({ value: count() })
      .from(gameDailyLogs)
      .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, playDate), eq(gameDailyLogs.gameKey, game)));
    const playsUsed = usage?.value ?? 0;
    return Response.json({
      ok: true,
      duplicate: true,
      id: existing.id,
      limit: DAILY_PLAY_LIMIT,
      playsUsed,
      playsRemaining: Math.max(0, DAILY_PLAY_LIMIT - playsUsed),
      limitReached: playsUsed >= DAILY_PLAY_LIMIT,
    });
  }

  const [usage] = await database
    .select({ value: count() })
    .from(gameDailyLogs)
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, playDate), eq(gameDailyLogs.gameKey, game)));
  const playsUsed = usage?.value ?? 0;
  if (playsUsed >= DAILY_PLAY_LIMIT) {
    return Response.json({
      error: "Daily play limit reached",
      code: "DAILY_PLAY_LIMIT",
      limit: DAILY_PLAY_LIMIT,
      playsUsed,
      playsRemaining: 0,
      limitReached: true,
    }, { status: 429 });
  }

  const now = Math.floor(Date.now() / 1000);
  const entry = {
    id: createId(),
    userId: user.id,
    gameKey: game,
    playDate,
    rawScore,
    score: rawScore * POINT_VALUE,
    unit: "GLC",
    attemptId,
    createdAt: now,
  };
  await database.run(sql`
    INSERT INTO game_daily_logs (
      id, user_id, game_key, play_date, raw_score, score, unit, attempt_id, created_at
    )
    SELECT
      ${entry.id}, ${entry.userId}, ${entry.gameKey}, ${entry.playDate}, ${entry.rawScore},
      ${entry.score}, ${entry.unit}, ${entry.attemptId}, ${entry.createdAt}
    WHERE (
      SELECT count(*) FROM game_daily_logs
      WHERE user_id = ${entry.userId}
        AND play_date = ${entry.playDate}
        AND game_key = ${entry.gameKey}
    ) < ${DAILY_PLAY_LIMIT}
    ON CONFLICT(attempt_id) DO NOTHING
  `);
  const [saved] = await database
    .select({ id: gameDailyLogs.id })
    .from(gameDailyLogs)
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.attemptId, attemptId)))
    .limit(1);
  if (!saved) {
    const [latestUsage] = await database
      .select({ value: count() })
      .from(gameDailyLogs)
      .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, playDate), eq(gameDailyLogs.gameKey, game)));
    const latestPlays = latestUsage?.value ?? 0;
    if (latestPlays >= DAILY_PLAY_LIMIT) {
      return Response.json({
        error: "Daily play limit reached",
        code: "DAILY_PLAY_LIMIT",
        limit: DAILY_PLAY_LIMIT,
        playsUsed: latestPlays,
        playsRemaining: 0,
        limitReached: true,
      }, { status: 429 });
    }
    return Response.json({ error: "Unable to save result" }, { status: 409 });
  }
  const [latestUsage] = await database
    .select({ value: count() })
    .from(gameDailyLogs)
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, playDate), eq(gameDailyLogs.gameKey, game)));
  const savedPlays = latestUsage?.value ?? playsUsed + 1;
  return Response.json({
    ok: true,
    duplicate: saved.id !== entry.id,
    id: saved.id,
    entry,
    limit: DAILY_PLAY_LIMIT,
    playsUsed: savedPlays,
    playsRemaining: Math.max(0, DAILY_PLAY_LIMIT - savedPlays),
    limitReached: savedPlays >= DAILY_PLAY_LIMIT,
  });
}
