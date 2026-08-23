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
  assert.match(source, /title: "Lucky Wheel"/);
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
  assert.match(monopoly, /GLC Lucky Wheel/);
  assert.match(monopoly, /GLC 幸运轮盘/);
  assert.doesNotMatch(monopoly, /Monopoly|大富翁|地产|PROPERTY/);
  assert.match(runtime, /fetch\('\/api\/game-results'/);
  assert.match(runtime, /fetch\(`\/api\/game-results\?date=/);
  assert.match(runtime, /disableRetry\(\)/);
  assert.match(runtime, /showTrialResult\(/);
  assert.match(runtime, /navigate\(gameLogRoute\(\)\)/);
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

test("game pages keep the shared header and expose a clean Lucky Wheel route", async () => {
  const [styles, gamePage, luckyWheelPage, cleanEntry] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/games/[game]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/lucky-wheel/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lucky-wheel/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal((gamePage.match(/<SiteHeader\b/g) || []).length, 1);
  assert.equal((luckyWheelPage.match(/<SiteHeader\b/g) || []).length, 1);
  assert.match(gamePage, /const frameSrc = `\/games\/\$\{game\}\.html\?mode=\$\{mode\}&lang=\$\{contentLang\}`/);
  assert.match(gamePage, /<iframe src=\{frameSrc\} title=\{frameTitle\}\/>/);
  assert.match(gamePage, /game === "monopoly".*\/lucky-wheel\?mode=/);
  assert.match(luckyWheelPage, /const frameSrc = `\/games\/monopoly\.html\?mode=\$\{mode\}&lang=\$\{contentLang\}`/);
  assert.match(luckyWheelPage, /<iframe src=\{frameSrc\} title=\{frameTitle\}\/>/);
  assert.match(luckyWheelPage, /Lucky Wheel/);
  assert.match(gamePage, /modeLabels: Record<SiteLanguage/);
  assert.match(luckyWheelPage, /modeLabels: Record<SiteLanguage/);
  for (const locale of ["zh", "en", "es", "ja", "ko", "fr", "de", "ru", "it", "pt", "ar", "hi"]) {
    assert.match(gamePage, new RegExp(`\\b${locale}: \\{ game:`));
    assert.match(luckyWheelPage, new RegExp(`\\b${locale}: \\{ game:`));
  }
  assert.match(gamePage, /interfaceText\(lang, games\[game as GameKey\]\.en, games\[game as GameKey\]\.zh\)/);
  assert.match(luckyWheelPage, /interfaceText\(lang, "Lucky Wheel", "幸运轮盘"\)/);
  assert.match(luckyWheelPage, /幸运轮盘/);
  assert.match(cleanEntry, /redirect\(`\/zh\/lucky-wheel\?mode=/);
  assert.doesNotMatch(gamePage, /redirect\(`\/games\/\$\{game\}\.html/);
  assert.match(styles, /\.game-frame-shell iframe\{/);
  assert.match(styles, /\.game-frame-page\{min-height:calc\(100dvh - 88px\)/);
  assert.match(styles, /@media\(max-width:1100px\)\{\s*\.game-frame-page,\.game-frame-shell\{min-height:calc\(100dvh - 78px\)\}\s*\.game-frame-shell\{height:calc\(100dvh - 78px\)\}/);
  assert.match(styles, /@media\(max-width:820px\)\{\s*\.game-frame-page,\.game-frame-shell\{min-height:calc\(100dvh - 74px\)\}\s*\.game-frame-shell\{height:calc\(100dvh - 74px\)\}/);
});

test("Play uses a server-side login launch check, returns to the clean game route, and opens the saved log", async () => {
  const [home, gamePage, luckyWheelPage, launchRoute, runtime, gameLog, workflow, scheduledTest] = await Promise.all([
    readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/games/[game]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[lang]/lucky-wheel/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/game-launch/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/games/greatlove-game-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../components/GameDailyLog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/daily-game-rewards.yml", import.meta.url), "utf8"),
    readFile(new URL("./daily-game-rewards.test.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(home, /<a className="primary" href=\{`\/api\/game-launch\?game=\$\{game\.key\}&lang=\$\{lang\}`\}/);
  assert.match(home, /game\.key === "monopoly" \? `\/\$\{lang\}\/lucky-wheel\?mode=trial`/);
  assert.doesNotMatch(home, /<Link className="primary"[^>]*mode=play/);
  assert.match(launchRoute, /getSessionUser\(request\)/);
  assert.match(launchRoute, /auth\/login\?returnTo=/);
  assert.match(launchRoute, /game === "monopoly" \? `\/\$\{lang\}\/lucky-wheel`/);
  assert.match(gamePage, /const user = await getSessionUser\(\)/);
  assert.match(luckyWheelPage, /const user = await getSessionUser\(\)/);
  assert.match(gamePage, /<iframe src=\{frameSrc\} title=\{frameTitle\}\/>/);
  assert.match(luckyWheelPage, /<iframe src=\{frameSrc\} title=\{frameTitle\}\/>/);
  assert.match(runtime, /\/api\/game-launch\?game=/);
  assert.match(runtime, /game === 'monopoly' \? `\/\$\{lang\}\/lucky-wheel\?mode=trial`/);
  assert.match(runtime, /\/\$\{lang\}\/dashboard#game-log/);
  assert.match(runtime, /const target = window\.top && window\.top !== window \? window\.top : window/);
  assert.match(runtime, /target\.location\.assign\(path\)/);
  assert.match(runtime, /target="_top"/);
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
  assert.match(log, /Lucky Wheel.*Miner/);
  assert.match(log, /幸运轮盘.*矿工/);
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
