import fs from "node:fs/promises";
import OpenCC from "opencc-js";

const sourceUrl = new URL("../components/portfolio-auth/auth-copy.generated.ts", import.meta.url);
const outputUrl = new URL("../components/portfolio-auth/auth-copy-zh-tw.generated.ts", import.meta.url);
const source = await fs.readFile(sourceUrl, "utf8");
const payload = source.match(/portfolioAuthTranslations[^=]*=\s*([\s\S]*?);\n\nexport function/)?.[1];
if (!payload) throw new Error("Could not read portfolio auth dictionaries");
const dictionaries = JSON.parse(payload);
if (!dictionaries.zh) throw new Error("Simplified Chinese auth dictionary is missing");
const convert = OpenCC.Converter({ from: "cn", to: "twp" });
const polishTraditional = value => convert(value)
  .replaceAll("電子郵箱", "電子郵件")
  .replaceAll("郵箱", "電子郵件")
  .replaceAll("賬戶", "帳戶");
const traditional = Object.fromEntries(Object.entries(dictionaries.zh).map(([key, value]) => [key, polishTraditional(value)]));
await fs.writeFile(outputUrl, `// Generated static Traditional Chinese identity copy. No runtime translation request.\nexport default ${JSON.stringify(traditional, null, 2)} as Record<string, string>;\n`);
process.stdout.write(`zh-tw auth: ${Object.keys(traditional).length} phrases\n`);
