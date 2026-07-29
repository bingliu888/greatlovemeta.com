import assert from "node:assert/strict";
import test from "node:test";
import {
  createRewardLogEntry,
  DAILY_PLAY_LIMIT,
  isValidPlayDate,
  rewardFor,
} from "../lib/game-reward-rules.js";

const TEST_USERS = [
  { id: "daily-test-user-01", scores: { monopoly: 3, miner: 0 } },
  { id: "daily-test-user-02", scores: { monopoly: 18, miner: 1 } },
  { id: "daily-test-user-03", scores: { monopoly: 36, miner: 12 } },
];

class IsolatedRewardLog {
  #entries = [];

  play({ userId, game, rawScore, playDate, attemptId }) {
    assert.ok(isValidPlayDate(playDate));
    const playsUsed = this.#entries.filter((entry) =>
      entry.userId === userId &&
      entry.playDate === playDate &&
      entry.gameKey === game
    ).length;
    if (playsUsed >= DAILY_PLAY_LIMIT) {
      const error = new Error("DAILY_PLAY_LIMIT");
      error.code = "DAILY_PLAY_LIMIT";
      throw error;
    }
    const entry = createRewardLogEntry({
      id: `log-${this.#entries.length + 1}`,
      userId,
      game,
      playDate,
      rawScore,
      attemptId,
      createdAt: Math.floor(Date.now() / 1000),
    });
    this.#entries.push(entry);
    return entry;
  }

  dailyLog(userId, playDate) {
    return this.#entries.filter((entry) =>
      entry.userId === userId && entry.playDate === playDate
    );
  }

  allTimeTotal(userId) {
    return this.#entries
      .filter((entry) => entry.userId === userId)
      .reduce((total, entry) => total + entry.score, 0);
  }

  recentDailyTotals(userId, dates) {
    return dates.map((playDate) => ({
      playDate,
      total: this.dailyLog(userId, playDate).reduce((sum, entry) => sum + entry.score, 0),
    }));
  }
}

test("daily scheduled simulation isolates multiple users and verifies both game reward logs", () => {
  const playDate = new Date().toISOString().slice(0, 10);
  const store = new IsolatedRewardLog();

  for (const user of TEST_USERS) {
    for (const game of ["monopoly", "miner"]) {
      const rawScore = user.scores[game];
      const entry = store.play({
        userId: user.id,
        game,
        rawScore,
        playDate,
        attemptId: `${user.id}-${game}-attempt`,
      });
      assert.equal(entry.score, rewardFor(game, rawScore));
      assert.equal(entry.unit, "GLC");
    }
  }

  for (const user of TEST_USERS) {
    const entries = store.dailyLog(user.id, playDate);
    assert.equal(entries.length, 2);
    assert.deepEqual(entries.map((entry) => entry.gameKey).sort(), ["miner", "monopoly"]);
    assert.deepEqual(
      entries.map((entry) => entry.score).sort((a, b) => a - b),
      Object.entries(user.scores).map(([game, score]) => rewardFor(game, score)).sort((a, b) => a - b),
    );
    assert.equal(
      store.allTimeTotal(user.id),
      Object.entries(user.scores).reduce((total, [game, score]) => total + rewardFor(game, score), 0),
    );
    const fourteenDays = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - index);
      return date.toISOString().slice(0, 10);
    });
    const recent = store.recentDailyTotals(user.id, fourteenDays);
    assert.equal(recent.length, 14);
    assert.equal(recent[0].total, store.allTimeTotal(user.id));
    assert.ok(recent.slice(1).every((day) => day.total === 0));
    assert.throws(
      () => store.play({
        userId: user.id,
        game: "monopoly",
        rawScore: user.scores.monopoly,
        playDate,
        attemptId: `${user.id}-monopoly-second`,
      }),
      (error) => error.code === "DAILY_PLAY_LIMIT",
    );
  }
});
