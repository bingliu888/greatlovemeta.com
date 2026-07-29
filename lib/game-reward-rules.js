export const GAME_LIMITS = Object.freeze({
  monopoly: Object.freeze({ minimum: 3, maximum: 36 }),
  miner: Object.freeze({ minimum: 0, maximum: 36 }),
});

export const DAILY_PLAY_LIMIT = 1;
export const POINT_VALUE = 10_000;

export function isGameKey(value) {
  return typeof value === "string" && Object.hasOwn(GAME_LIMITS, value);
}

export function isValidPlayDate(value, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed)) return false;
  return Math.abs(parsed - now) <= 36 * 60 * 60 * 1000;
}

export function rewardFor(game, rawScore) {
  if (!isGameKey(game) || !Number.isInteger(rawScore)) {
    throw new RangeError("Invalid game result");
  }
  const limits = GAME_LIMITS[game];
  if (rawScore < limits.minimum || rawScore > limits.maximum) {
    throw new RangeError("Invalid game result");
  }
  return rawScore * POINT_VALUE;
}

export function createRewardLogEntry({
  id,
  userId,
  game,
  playDate,
  rawScore,
  attemptId,
  createdAt,
}) {
  return {
    id,
    userId,
    gameKey: game,
    playDate,
    rawScore,
    score: rewardFor(game, rawScore),
    unit: "GLC",
    attemptId,
    createdAt,
  };
}
