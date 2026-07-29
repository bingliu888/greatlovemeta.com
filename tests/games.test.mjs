import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage places two games after the membership section", async () => {
  const source = await readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8");
  const membershipIndex = source.indexOf('className="glm-access-section"');
  const gamesIndex = source.indexOf('className="glm-games-section"');
  const swapIndex = source.indexOf('className="glm-access-section glm-swap-section"');

  assert.ok(membershipIndex >= 0);
  assert.ok(gamesIndex > membershipIndex);
  assert.ok(swapIndex > gamesIndex);
  assert.match(source, /title: "Monopoly"/);
  assert.match(source, /title: "Miner"/);
  assert.match(source, /mode=trial/);
  assert.match(source, /mode=play/);
});

test("both games report completed sessions to the authenticated wrapper", async () => {
  const [monopoly, miner] = await Promise.all([
    readFile(new URL("../public/games/monopoly.html", import.meta.url), "utf8"),
    readFile(new URL("../public/games/miner.html", import.meta.url), "utf8"),
  ]);

  for (const [game, source] of [["monopoly", monopoly], ["miner", miner]]) {
    assert.match(source, /greatlove:game-result/);
    assert.match(source, new RegExp(`game: '${game}'`));
    assert.match(source, /rawScore: totalScore/);
    assert.match(source, /reportGreatLoveResult\(\)/);
  }
});

test("game result writes are authenticated and persisted in the daily log", async () => {
  const [route, schema, player] = await Promise.all([
    readFile(new URL("../app/api/game-results/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/GameExperience.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(route, /if \(!user\).*401/);
  assert.match(route, /database\.insert\(gameDailyLogs\)/);
  assert.match(route, /rawScore \* 100_000/);
  assert.match(schema, /game_daily_logs/);
  assert.match(schema, /attempt_id/);
  assert.match(player, /mode === "trial"/);
  assert.match(player, /\/api\/game-results/);
});
