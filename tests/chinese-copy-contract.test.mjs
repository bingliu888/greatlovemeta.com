import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Product names, registered services, URLs, and established technical acronyms may
// remain in Chinese copy. Ordinary interface language must be translated.
const allowedLatinTerms = Object.freeze([
  "GreatLove.art", "GreatLoveMeta.com", "GreatLoveDAO", "Guandan.Guru", "Guru",
  "GitHub", "Sites", "iPad", "Safari", "Cloudflare", "RealtimeKit", "Clerk", "PayPal",
  "OpenAI", "ChatGPT", "Telegram", "Messenger", "Facebook", "TikTok", "MyClaw",
  "BingAcademy", "WhatsReal", "Android", "App Store", "AI", "AIGC", "NFT",
  "RWA", "DeFi", "SocialFi", "GameFi", "Web3", "GLC", "GLUSD", "USDT",
  "USDC", "ETH", "BTC", "EVM", "D1", "R2", "PDF", "JPG", "PNG", "WebP",
  "MB", "ID", "URL", "SSL", "DNS", "Webhook", "API", "Polygon",
  "iOS", "cz.cool", "HLS", "DeepSeek", "Flash", "WalletConnect", "ERC-20",
  "DOCX", "XLSX", "PPTX", "PDT",
]);

const avoidableEnglish = [
  /\bAsk (?:Art )?Guru\b/i,
  /\bLive Chat\b/i,
  /\bProject(?:s)?\b/i,
  /\bResources\b/i,
  /\bPremium\b/i,
  /\bAgent OS\b/i,
  /\bForum\b/i,
  /\bMember discussions\b/i,
  /\bAll-time\b/i,
  /\bRecommended order\b/i,
  /\bpayment pending\b/i,
  /\bMiner\b/i,
  /\bPlay\b/i,
  /\bDashboard\b/i,
  /\bCommunity\b/i,
  /\bMembers?\b/i,
  /\bMessages?\b/i,
  /\bNews\b/i,
  /\bEvents\b/i,
  /\bProfile\b/i,
  /\bSettings\b/i,
  /\bReports?\b/i,
  /\bTimeline\b/i,
  /\bMembership\b/i,
  /\bPlans?\b/i,
  /\bPricing\b/i,
  /\bSign in\b/i,
  /\bSend\b/i,
  /\bReply\b/i,
  /\bHome\b/i,
  /\bAbout\b/i,
  /\bPrivacy\b/i,
  /\bTerms\b/i,
  /\bFAQ\b/i,
  /\bMVP\b/i,
  /\bUI\b/i,
  /\bWorker\b/i,
];

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function quotedStrings(source) {
  return [
    ...source.matchAll(/"((?:\\.|[^"\\\n])*)"/g),
    ...source.matchAll(/'((?:\\.|[^'\\\n])*)'/g),
    ...source.matchAll(/`((?:\\.|[^`\\\n])*)`/g),
  ];
}

function withoutAllowedTerms(value) {
  let remaining = value.replace(/\$\{[^}]*\}/g, "").replace(/\\[nrt]/g, "");
  for (const term of [...allowedLatinTerms].sort((a, b) => b.length - a.length)) {
    remaining = remaining.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  }
  return remaining
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "")
    .replace(/\b[vV]\d+\b/g, "")
    .replace(/\b0x[A-Fa-f0-9]+\b/g, "");
}

test("Chinese UI copy contains no avoidable English interface phrases", () => {
  assert.ok(allowedLatinTerms.includes("Guru") && allowedLatinTerms.includes("GitHub"));
  const files = ["app", "components", "lib"].flatMap((root) =>
    sourceFiles(new URL(`../${root}`, import.meta.url).pathname),
  );
  const leaks = [];

  for (const file of files) {
    if (file.includes("/app/api/")) continue;
    if (file.endsWith(".generated.ts")) continue;
    const source = readFileSync(file, "utf8");
    for (const match of quotedStrings(source)) {
      const value = match[1];
      if (match[0].startsWith("`") && value.includes("${")) continue;
      if (!/\p{Script=Han}/u.test(value)) continue;
      const remaining = withoutAllowedTerms(value);
      const phrase = avoidableEnglish.find((pattern) => pattern.test(remaining));
      const unapproved = remaining.match(/\b[A-Za-z][A-Za-z0-9.+-]*\b/g)?.filter((token) => token.length > 1) ?? [];
      if (phrase || unapproved.length > 0) {
        const line = source.slice(0, match.index).split("\n").length;
        leaks.push(`${file}:${line}: ${value} [${unapproved.join(", ")}]`);
      }
    }
  }

  assert.deepEqual(leaks, []);
});
