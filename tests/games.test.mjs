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
  assert.match(source, /\/api\/game-launch\?game=/);
});

test("both full-page games report completed sessions directly through the shared runtime", async () => {
  const [monopoly, miner, runtime] = await Promise.all([
    readFile(new URL("../public/games/monopoly.html", import.meta.url), "utf8"),
    readFile(new URL("../public/games/miner.html", import.meta.url), "utf8"),
    readFile(new URL("../public/games/greatlove-game-runtime.js", import.meta.url), "utf8"),
  ]);

  for (const [game, source] of [["monopoly", monopoly], ["miner", miner]]) {
    assert.match(source, /greatlove-game-runtime\.js/);
    assert.match(source, new RegExp(`GreatLoveGameRuntime\\.reportResult\\('${game}', totalScore, attemptId\\)`));
    assert.match(source, /reportGreatLoveResult\(\)/);
    assert.match(source, /id="greatlove-trial-result"/);
    assert.match(source, /1 Point = 10,000 GLC/);
    assert.doesNotMatch(source, /100,000 GLC/);
    assert.doesNotMatch(source, /wallet-input|walletInput|register-wallet/);
  }
  assert.match(runtime, /fetch\('\/api\/game-results'/);
  assert.match(runtime, /fetch\(`\/api\/game-results\?date=/);
  assert.match(runtime, /disableRetry\(\)/);
  assert.match(runtime, /showTrialResult\(/);
  assert.match(runtime, /window\.location\.assign\(gameLogRoute\(\)\)/);
});

test("game result writes use the new reward rate and enforce one daily play per game", async () => {
  const [route, rules, schema, runtime] = await Promise.all([
    readFile(new URL("../app/api/game-results/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/game-reward-rules.js", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/games/greatlove-game-runtime.js", import.meta.url), "utf8"),
  ]);

  assert.match(route, /if \(!user\).*401/);
  assert.match(route, /INSERT INTO game_daily_logs/);
  assert.match(route, /SELECT count\(\*\) FROM game_daily_logs/);
  assert.match(rules, /POINT_VALUE = 10_000/);
  assert.match(rules, /DAILY_PLAY_LIMIT = 1/);
  assert.match(route, /createRewardLogEntry/);
  assert.match(route, /eq\(gameDailyLogs\.gameKey, game\)/);
  assert.match(route, /AND game_key = \$\{entry\.gameKey\}/);
  assert.match(route, /code: "DAILY_PLAY_LIMIT"/);
  assert.match(route, /status: 429/);
  assert.match(schema, /game_daily_logs/);
  assert.match(schema, /attempt_id/);
  assert.match(runtime, /mode !== 'play'/);
  assert.match(runtime, /\/api\/game-results/);
  assert.match(runtime, /Play again tomorrow/);
  assert.match(runtime, /playsRemaining/);
});

test("Miner uses three shots, zero for a miss, and 10,000 to 120,000 GLC per hit", async () => {
  const [miner, rules] = await Promise.all([
    readFile(new URL("../public/games/miner.html", import.meta.url), "utf8"),
    readFile(new URL("../lib/game-reward-rules.js", import.meta.url), "utf8"),
  ]);

  assert.match(miner, /leftCounts = 3/);
  assert.match(miner, /points: 12/);
  assert.match(miner, /points: 1/);
  assert.match(miner, /points: 0/);
  assert.match(miner, /本次奖励为 0 GLC/);
  assert.match(miner, /points \* 10000/);
  assert.match(miner, /BRIEFING_SECONDS = 6/);
  assert.match(miner, /briefing-countdown/);
  assert.match(miner, /setInterval\(\(\) => \{/);
  assert.doesNotMatch(miner, /briefing-trial-btn|briefing-play-btn|chooseMode/);
  assert.doesNotMatch(miner, /startMission\(true\)/);
  assert.match(rules, /miner: Object\.freeze\(\{ minimum: 0, maximum: 36 \}\)/);
  assert.match(miner, /GreatLoveGameRuntime\.guard\('miner'\)/);
});

test("mobile header keeps sign-in on one line and game pages use no iframe", async () => {
  const [styles, gamePage] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/games/[game]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.header-cta \{[^}]*white-space: nowrap/);
  assert.doesNotMatch(gamePage, /iframe|GameExperience/);
  assert.doesNotMatch(styles, /\.game-frame-shell iframe/);
  assert.match(gamePage, /redirect\(`\/games\/\$\{game\}\.html\?mode=/);
});

test("Play uses a server-side login launch check, returns to the game, and opens the saved log", async () => {
  const [home, gamePage, launchRoute, runtime, gameLog, workflow, scheduledTest] = await Promise.all([
    readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/games/[game]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/game-launch/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/games/greatlove-game-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../components/GameDailyLog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/daily-game-rewards.yml", import.meta.url), "utf8"),
    readFile(new URL("./daily-game-rewards.test.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(home, /<a className="primary" href=\{`\/api\/game-launch\?game=\$\{game\.key\}&lang=\$\{lang\}`\}/);
  assert.match(home, /<a href=\{`\/games\/\$\{game\.key\}\.html\?mode=trial&lang=\$\{lang\}`\}/);
  assert.doesNotMatch(home, /<Link className="primary"[^>]*mode=play/);
  assert.match(launchRoute, /getSessionUser\(request\)/);
  assert.match(launchRoute, /auth\/login\?returnTo=/);
  assert.match(launchRoute, /\/games\/\$\{game\}\.html\?mode=play&lang=/);
  assert.match(gamePage, /redirect\(`\/games\//);
  assert.match(gamePage, /const user = await getSessionUser\(\)/);
  assert.match(runtime, /\/api\/game-launch\?game=/);
  assert.match(runtime, /\/\$\{lang\}\/dashboard#game-log/);
  assert.match(runtime, /window\.location\.assign/);
  assert.match(gameLog, /<section id="game-log"/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /node scripts\/check-protected-navigation\.mjs/);
  assert.match(workflow, /node --test tests\/daily-game-rewards\.test\.mjs/);
  assert.match(workflow, /if: failure\(\)/);
  assert.match(workflow, /gh issue create/);
  assert.match(scheduledTest, /daily-test-user-01/);
  assert.match(scheduledTest, /daily-test-user-02/);
  assert.match(scheduledTest, /daily-test-user-03/);
});

test("game log combines both games, shows 14 days, and supports wallet-backed redemption", async () => {
  const [log, resultsRoute, redemptionRoute, profileRoute, profileEditor, schema, migration] = await Promise.all([
    readFile(new URL("../components/GameDailyLog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/game-results/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/game-redemptions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/profile/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/ProfileEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0010_amusing_lucky_pierre.sql", import.meta.url), "utf8"),
  ]);

  assert.match(log, /index < 14/);
  assert.match(log, /allTimeTotal/);
  assert.match(log, /Monopoly.*Miner/);
  assert.match(log, /zh \? "兑换" : "Redeem"/);
  assert.match(log, /fetch\("\/api\/game-redemptions"/);
  assert.match(log, /fetch\("\/api\/profile"/);
  assert.match(resultsRoute, /searchParams\.get\("summary"\) === "1"/);
  assert.match(resultsRoute, /sum\(\$\{gameDailyLogs\.rawScore\}\)/);
  assert.match(resultsRoute, /availableBalance/);
  assert.match(redemptionRoute, /INSERT INTO game_redemptions/);
  assert.match(redemptionRoute, /status IN \('pending', 'approved', 'completed'\)/);
  assert.match(profileRoute, /wallet_address/);
  assert.match(profileRoute, /\^0x\[a-fA-F0-9\]\{40\}\$/);
  assert.match(profileEditor, /EVM wallet/);
  assert.match(profileEditor, /walletEditing/);
  assert.match(schema, /game_redemptions/);
  assert.match(schema, /wallet_address/);
  assert.match(migration, /ALTER TABLE `users` ADD `wallet_address`/);
});
