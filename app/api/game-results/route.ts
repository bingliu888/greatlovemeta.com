import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { gameDailyLogs } from "../../../db/schema";
import { createId } from "../../../lib/auth";
import { requestUser } from "../../../lib/request-user";

const GAME_LIMITS = {
  monopoly: { minimum: 3, maximum: 36 },
  miner: { minimum: 6, maximum: 45 },
} as const;

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
  const requestedDate = new URL(request.url).searchParams.get("date") || utcDate();
  if (!validDate(requestedDate)) return Response.json({ error: "Invalid date" }, { status: 400 });
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
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.playDate, requestedDate)))
    .orderBy(asc(gameDailyLogs.createdAt))
    .limit(100);
  return Response.json({ date: requestedDate, entries });
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
  if (existing) return Response.json({ ok: true, duplicate: true, id: existing.id });

  const now = Math.floor(Date.now() / 1000);
  const entry = {
    id: createId(),
    userId: user.id,
    gameKey: game,
    playDate,
    rawScore,
    score: rawScore * 100_000,
    unit: "GLC",
    attemptId,
    createdAt: now,
  };
  await database.insert(gameDailyLogs).values(entry).onConflictDoNothing();
  const [saved] = await database
    .select({ id: gameDailyLogs.id })
    .from(gameDailyLogs)
    .where(and(eq(gameDailyLogs.userId, user.id), eq(gameDailyLogs.attemptId, attemptId)))
    .limit(1);
  if (!saved) return Response.json({ error: "Unable to save result" }, { status: 409 });
  return Response.json({ ok: true, duplicate: saved.id !== entry.id, id: saved.id, entry });
}
