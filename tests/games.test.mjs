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
    assert.match(source, /1 Point = 10,000 GLC/);
    assert.doesNotMatch(source, /100,000 GLC/);
    assert.doesNotMatch(source, /wallet-input|walletInput|register-wallet/);
  }
});

test("game result writes use the new reward rate and enforce three daily plays", async () => {
  const [route, schema, player] = await Promise.all([
    readFile(new URL("../app/api/game-results/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/GameExperience.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(route, /if \(!user\).*401/);
  assert.match(route, /INSERT INTO game_daily_logs/);
  assert.match(route, /SELECT count\(\*\) FROM game_daily_logs/);
  assert.match(route, /POINT_VALUE = 10_000/);
  assert.match(route, /DAILY_PLAY_LIMIT = 3/);
  assert.match(route, /code: "DAILY_PLAY_LIMIT"/);
  assert.match(route, /status: 429/);
  assert.match(schema, /game_daily_logs/);
  assert.match(schema, /attempt_id/);
  assert.match(player, /mode === "trial"/);
  assert.match(player, /\/api\/game-results/);
  assert.match(player, /Play again tomorrow/);
  assert.match(player, /playsRemaining/);
});

test("Miner uses three shots, zero for a miss, and 10,000 to 120,000 GLC per hit", async () => {
  const [miner, route, player] = await Promise.all([
    readFile(new URL("../public/games/miner.html", import.meta.url), "utf8"),
    readFile(new URL("../app/api/game-results/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/GameExperience.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(miner, /leftCounts = 3/);
  assert.match(miner, /points: 12/);
  assert.match(miner, /points: 1/);
  assert.match(miner, /points: 0/);
  assert.match(miner, /本次奖励为 0 GLC/);
  assert.match(miner, /points \* 10000/);
  assert.match(miner, /briefing-trial-btn/);
  assert.match(miner, /briefing-play-btn/);
  assert.match(miner, /startMission\(true\)/);
  assert.match(route, /miner: \{ minimum: 0, maximum: 36 \}/);
  assert.match(player, /game !== "miner"/);
});
