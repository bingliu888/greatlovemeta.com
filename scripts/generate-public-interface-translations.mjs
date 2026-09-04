import fs from "node:fs/promises";
import path from "node:path";
import OpenCC from "opencc-js";

const root = new URL("../", import.meta.url);
const argumentsList = process.argv.slice(2);
const listOnly = argumentsList.includes("--list");
const targets = argumentsList.filter(value => !value.startsWith("--"));
const supportedTargets = new Set([
  "zh-tw", "es", "fr", "de", "ja", "ko", "it", "ar", "pt", "ru", "hi",
  "id", "bn", "ur", "pa", "ta", "te", "ne", "si", "tr",
]);
if (!targets.length && !listOnly) throw new Error("Pass one or more target locale codes");
for (const target of targets) if (!supportedTargets.has(target)) throw new Error(`Unsupported locale: ${target}`);

const toTraditionalChinese = OpenCC.Converter({ from: "cn", to: "twp" });
const strings = new Set();
const traditionalPairs = new Map();
const visibleAttributes = "(?:aria-label|title|placeholder|alt|label|description|helperText|emptyText|successMessage|errorMessage)";
const runtimeInterfaceStrings = [
  "Primary navigation", "Open menu", "Close menu", "Language", "Choose language",
  "My account", "Account menu", "Sign in or register", "Dashboard", "My Courses",
  "Messages", "Account | Set password", "Member community", "Ecosystem projects",
  "Membership", "Sign out", "unread", "Footer navigation", "About", "Subscriptions",
  "Privacy", "Terms", "Project", "GreatLoveMeta.com home",
  "Great Love · Intelligence · Sustainability", "Open AI assistant", "Admin dashboard",
  "Crypto payments", "Start the live course room", "Waiting for live course room",
  "Start this site's independent live media session. Microphone and camera remain off until selected.",
  "You join automatically as a viewer when streaming starts. No device permission is requested.",
  "Turn on microphone", "Turn on camera", "1-month subscription", "12-month subscription",
  "Payment options available", "Active through", "Copy RefID", "Copy wallet address",
  "verified source items",
];
const serverInterfaceKeys = new Set(runtimeInterfaceStrings);

function literalValue(raw) {
  return raw.trim().replace(/\\n/g, "\n").replace(/\\(["'`\\])/g, "$1").replace(/\s+/g, " ");
}

function addString(raw, target = strings) {
  const value = literalValue(raw);
  if (value.includes("${") || value.length < 2 || value.length > 500 || !/[A-Za-z\u3400-\u9fff]/.test(value)) return;
  if (/^(?:\.{1,2}\/|\/|@\/|https?:)/.test(value) || /^[a-z0-9_.-]+$/.test(value)) return;
  if (/^[a-z@][\w@.-]*(?:\/[\w@.-]+)+$/.test(value) || /^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)+$/.test(value)) return;
  if (/^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|PRAGMA)\s/i.test(value)) return;
  if (/^(?:zh|zh-tw|en|es|fr|de|ja|ko|it|ar|pt|ru|hi|id|bn|ur|pa|ta|te|ne|si|tr)$/.test(value)) return;
  if ((/^[A-Z0-9_]+$/.test(value) && !value.includes(" ")) || /^@[\w/.-]+$/.test(value)) return;
  if ((value.startsWith("/") && !value.includes(" ")) || (!value.includes(" ") && /[a-z][A-Z]/.test(value))) return;
  if (/(?:=>|===|!==|<=|>=|\|\||&&|\.some\(|\b(?:const|return|import|export|function|async|await|useRef|useState)\b|\?\.|\(\)|\{\}|\[\]|;)/.test(value)) return;
  if (/^(?:[,:\])}]|\(\[\\s\\S]|\):Record|values:Partial)/.test(value)) return;
  if (/\b(?:items\.length|availablePlans\.length|pendingPaymentHash|confirmedUntil|message\.body)\b|\?\s*(?:\(|["'`])/.test(value)) return;
  target.add(value);
}

function addLegalProse(raw, target = strings) {
  const value = literalValue(raw);
  if (value.length < 2 || value.length > 500 || !/[A-Za-z\u3400-\u9fff]/.test(value)) return;
  if (/^(?:\.{1,2}\/|\/|@\/|https?:)/.test(value) || /^[a-z0-9_.-]+$/.test(value)) return;
  target.add(value);
}

function collectLegalPageStrings(source, target = strings) {
  const start = source.indexOf("const copy = {");
  const end = source.indexOf("} as const;", start);
  if (start < 0 || end < 0) throw new Error("LegalPage copy object was not found");
  const copySource = source.slice(start, end);
  for (const match of copySource.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) addLegalProse(match[2], target);
}

function collectTraditionalPairs(source, target = strings) {
  for (const match of source.matchAll(/\?\s*(["'`])((?:\\.|(?!\1)[\s\S])*)\1\s*:\s*(["'`])((?:\\.|(?!\3)[\s\S])*)\3/g)) {
    const simplified = literalValue(match[2]);
    const english = literalValue(match[4]);
    if (!simplified.includes("${") && !english.includes("${") && /[\u3400-\u9fff]/.test(simplified) && /[A-Za-z]/.test(english)) {
      traditionalPairs.set(english, simplified);
      addString(simplified, target);
      addString(english, target);
    }
  }
}

function collectInterfaceTextPairs(source, target = strings) {
  for (const match of source.matchAll(/interfaceText\([^,]+,\s*(["'`])((?:\\.|(?!\1)[\s\S])*)\1\s*,\s*(["'`])((?:\\.|(?!\3)[\s\S])*)\3\s*\)/g)) {
    addString(match[2], target);
    addString(match[4], target);
    if (target === strings) {
      addString(match[2], serverInterfaceKeys);
      addString(match[4], serverInterfaceKeys);
    }
  }
}

function collectSource(source, includeAllLiterals = false, target = strings) {
  collectTraditionalPairs(source, target);
  collectInterfaceTextPairs(source, target);
  for (const match of source.matchAll(/>([^<>{}]+)</g)) addString(match[1], target);
  for (const match of source.matchAll(new RegExp(`${visibleAttributes}\\s*=\\s*(["'\\x60])((?:\\\\.|(?!\\1)[\\s\\S])*)\\1`, "g"))) addString(match[2], target);
  for (const match of source.matchAll(/\b(?:label|title|titleEn|titleZh|description|descriptionEn|descriptionZh|subtitle|eyebrow|placeholder|message|empty|success|error|helperText|summary|body|name)\s*:\s*(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g)) addString(match[2], target);
  if (includeAllLiterals) for (const match of source.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) addString(match[2], target);
}

async function walk(relative) {
  const entries = await fs.readdir(new URL(`${relative}/`, root), { withFileTypes: true });
  for (const entry of entries) {
    const child = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (child !== "app/api") await walk(child);
      continue;
    }
    if (!entry.name.endsWith(".tsx") || child === "components/LocaleRuntime.tsx") continue;
    collectSource(await fs.readFile(new URL(child, root), "utf8"));
  }
}

const homeKeys = new Set();
collectSource(await fs.readFile(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8"), true, homeKeys);

await walk("app");
await walk("components");
for (const sourcePath of [
  "lib/auth-interface-copy.ts", "lib/clerk-auth-requirements.ts",
  "lib/disclaimer-copy.ts", "lib/editorial-content.ts", "lib/project-status.ts",
  "lib/subscription-copy.ts", "lib/subscription-plans.ts", "lib/smartpay-admin-wallet-ui.ts",
  "lib/crypto-payment-user-flow.ts",
]) {
  collectSource(await fs.readFile(new URL(`../${sourcePath}`, import.meta.url), "utf8"), true);
}
for (const sourcePath of ["app/[lang]/page.tsx", "lib/auth-interface-copy.ts", "lib/disclaimer-copy.ts"]) {
  collectSource(await fs.readFile(new URL(`../${sourcePath}`, import.meta.url), "utf8"), true, serverInterfaceKeys);
}
collectLegalPageStrings(await fs.readFile(new URL("../components/LegalPage.tsx", import.meta.url), "utf8"), serverInterfaceKeys);
collectInterfaceTextPairs(await fs.readFile(new URL("../lib/site-locale.ts", import.meta.url), "utf8"), serverInterfaceKeys);
for (const source of serverInterfaceKeys) strings.add(source);
runtimeInterfaceStrings.forEach(value => strings.add(value));

const portfolioAuthSource = await fs.readFile(new URL("../components/portfolio-auth/auth-copy.generated.ts", import.meta.url), "utf8");
const portfolioAuthJson = portfolioAuthSource.match(/portfolioAuthTranslations[^=]*=\s*([\s\S]*?);\n\nexport function/)?.[1];
if (portfolioAuthJson) {
  const portfolioAuth = JSON.parse(portfolioAuthJson);
  Object.keys(portfolioAuth.en || {}).forEach(value => addString(value));
  Object.values(portfolioAuth.zh || {}).forEach(value => addString(value));
}

const homeOutput = new URL("../lib/home-interface-translations.generated.ts", import.meta.url);
const homeSource = await fs.readFile(homeOutput, "utf8");
const homeJson = homeSource.match(/homeInterfaceTranslations[^=]*=\s*([\s\S]*?);(?:\n|$)/)?.[1];
const home = homeJson ? JSON.parse(homeJson) : {};
for (const source of homeKeys) addString(source);

if (listOnly) {
  process.stdout.write(`${strings.size} public interface strings\n`);
  process.exit(0);
}

function protectPlaceholders(value) {
  let index = 0;
  return value.replace(/\{[A-Za-z0-9_]+\}/g, () => `ZXQPH${index++}QXZ`);
}

function restorePlaceholders(source, translated) {
  const expected = [...source.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(match => match[0]);
  if (!expected.length) return translated;
  let output = translated.replace(/ZXQPH\s*(\d+)\s*QXZ/gi, (_, index) => expected[Number(index)] || "");
  const present = new Set(output.match(/\{[A-Za-z0-9_]+\}/g) || []);
  for (const placeholder of expected) if (!present.has(placeholder)) output += ` ${placeholder}`;
  return output.replace(/\s{2,}/g, " ").trim();
}

function batches(values, limit = 1600) {
  const result = [];
  let current = [];
  let size = 0;
  for (const value of values) {
    if (current.length && size + value.length + 5 > limit) {
      result.push(current);
      current = [];
      size = 0;
    }
    current.push(value);
    size += value.length + 5;
  }
  if (current.length) result.push(current);
  return result;
}

async function translateBatch(values, target, source) {
  if (target === "zh-tw" && source === "zh-CN") return values.map(toTraditionalChinese);
  const separator = "\n@@@\n";
  const endpoint = new URL("https://clients5.google.com/translate_a/t");
  endpoint.searchParams.set("client", "dict-chrome-ex");
  endpoint.searchParams.set("sl", source);
  endpoint.searchParams.set("tl", target === "zh-tw" ? "zh-TW" : target);
  endpoint.searchParams.set("q", values.map(protectPlaceholders).join(separator));
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${source}-${target}: HTTP ${response.status}`);
  const payload = await response.json();
  const rendered = Array.isArray(payload) ? payload[0] : null;
  if (typeof rendered !== "string") throw new Error(`${source}-${target}: invalid response`);
  const translated = rendered.split(separator).map((value, index) => restorePlaceholders(values[index], target === "zh-tw" ? toTraditionalChinese(value) : value));
  if (translated.length !== values.length) throw new Error(`${source}-${target}: ${translated.length}/${values.length}`);
  return translated;
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function translateBatchWithRetry(values, target, source) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await translateBatch(values, target, source);
    } catch (error) {
      if (attempt === 4) {
        if (values.length === 1) throw error;
        const midpoint = Math.ceil(values.length / 2);
        return [
          ...await translateBatchWithRetry(values.slice(0, midpoint), target, source),
          ...await translateBatchWithRetry(values.slice(midpoint), target, source),
        ];
      }
      await wait(1000 * (attempt + 1));
    }
  }
  return [];
}

async function mapWithConcurrency(values, concurrency, work) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await work(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return output;
}

const localeOverrides = {
  "zh-tw": {
    "Dashboard": "使用者面板", "Admin dashboard": "管理員面板", "Account menu": "帳戶選單",
    "Sign in or register": "登入或註冊", "Sign out": "登出", "Primary navigation": "主要導覽",
    "Project": "專案", "Privacy": "隱私權", "Terms": "條款", "Crypto payments": "加密貨幣付款",
    "GreatLoveMeta.com home": "大愛元宇宙首頁", "Great Love · Intelligence · Sustainability": "大愛 · 智慧 · 永續",
    "主导航": "主要導覽", "页脚导航": "頁尾導覽",
  },
};

const publicDirectory = new URL("../public/locales/public-interface/", import.meta.url);
await fs.mkdir(publicDirectory, { recursive: true });
const dictionaries = {};

async function portfolioSeedFor(target) {
  const seedRoot = process.env.PORTFOLIO_TRANSLATION_SEED_ROOT;
  if (!seedRoot) return {};
  const merged = {};
  let sites = [];
  try { sites = await fs.readdir(seedRoot, { withFileTypes: true }); } catch { return merged; }
  for (const site of sites) {
    if (!site.isDirectory()) continue;
    const jsonPath = path.join(seedRoot, site.name, "public/locales/public-interface", `${target}.json`);
    const modulePath = path.join(seedRoot, site.name, "lib/public-interface-translations", `${target}.ts`);
    try {
      Object.assign(merged, JSON.parse(await fs.readFile(jsonPath, "utf8")));
      continue;
    } catch {}
    try {
      const source = await fs.readFile(modulePath, "utf8");
      const payload = source.match(/export default\s+([\s\S]*?)\s+as Record<string,\s*string>;/)?.[1];
      if (payload) Object.assign(merged, JSON.parse(payload));
    } catch {}
  }
  return merged;
}

for (const target of targets) {
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(new URL(`${target}.json`, publicDirectory), "utf8")); } catch {}
  const portfolioSeed = await portfolioSeedFor(target);
  const dictionary = Object.fromEntries([...strings]
    .filter(value => typeof (previous[value] ?? portfolioSeed[value]) === "string" && !/ZXQPH|QXZ/.test(previous[value] ?? portfolioSeed[value]))
    .map(value => [value, previous[value] ?? portfolioSeed[value]]));
  for (const [source, translated] of Object.entries(home[target] || {})) if (strings.has(source)) dictionary[source] = translated;
  const missing = [...strings].filter(value => !(value in dictionary));
  for (const [source, entries] of [
    ["zh-CN", missing.filter(value => /[\u3400-\u9fff]/.test(value))],
    ["en", missing.filter(value => !/[\u3400-\u9fff]/.test(value))],
  ]) {
    const sourceBatches = batches(entries);
    const translatedBatches = source === target
      ? sourceBatches
      : await mapWithConcurrency(sourceBatches, 5, batch => translateBatchWithRetry(batch, target, source));
    sourceBatches.forEach((batch, batchIndex) => batch.forEach((value, valueIndex) => {
      dictionary[value] = translatedBatches[batchIndex][valueIndex];
    }));
  }
  if (target === "zh-tw") {
    const polishTraditional = value => toTraditionalChinese(value)
      .replaceAll("電子郵箱", "電子郵件")
      .replaceAll("郵箱", "電子郵件")
      .replaceAll("賬戶", "帳戶")
      .replaceAll("賬號", "帳號");
    for (const [source, value] of Object.entries(dictionary)) dictionary[source] = polishTraditional(restorePlaceholders(source, value));
    for (const [english, simplified] of traditionalPairs) if (strings.has(english)) dictionary[english] = polishTraditional(simplified);
  }
  Object.assign(dictionary, localeOverrides[target] || {});
  dictionaries[target] = dictionary;
  home[target] = Object.fromEntries([...new Set([...homeKeys, ...serverInterfaceKeys])].map(source => [source, dictionary[source] || source]));
  await fs.writeFile(new URL(`${target}.json`, publicDirectory), `${JSON.stringify(dictionary, null, 2)}\n`);
  process.stdout.write(`Generated ${target}: ${Object.keys(dictionary).length} strings (${missing.length} added, ${target === "zh-tw" ? traditionalPairs.size : 0} paired)\n`);
}

await fs.writeFile(homeOutput, `// Generated public interface copy; no runtime translation request.\nexport const homeInterfaceTranslations: Record<string, Record<string, string>> = ${JSON.stringify(home, null, 2)};\n`);
