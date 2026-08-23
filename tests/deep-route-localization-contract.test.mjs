import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await pages(path));
    else if (entry.name === "page.tsx") result.push(path);
  }
  return result;
}

test("all localized pages accept every supported site language", async () => {
  const files = await pages(new URL("../app/[lang]", import.meta.url).pathname);
  const guard = /lang\s*!==\s*["']en["']\s*&&\s*lang\s*!==\s*["']zh["']|lang\s*!==\s*["']zh["']\s*&&\s*lang\s*!==\s*["']en["']|raw\s*===\s*["']zh["']\s*\?\s*["']zh["']\s*:\s*["']en["']/;
  for (const file of files) assert.doesNotMatch(await readFile(file, "utf8"), guard, file);
});

test("the locale runtime preserves native language names and rewrites internal routes", async () => {
  const runtime = await readFile(new URL("../components/LocaleRuntime.tsx", import.meta.url), "utf8");
  for (const name of ["中文", "English", "Español", "日本語", "한국어", "Français", "Deutsch", "Русский", "Italiano", "Português", "العربية", "हिन्दी"]) assert.match(runtime, new RegExp(name));
  assert.match(runtime, /rewrite\(document, locale\)/);
  assert.match(runtime, /homeInterfaceTranslations\[locale\]/);
  assert.match(runtime, /parentElement\?\.closest\("script,style,textarea,\[data-no-auto-localize\],\[data-no-translate\]"\)/);
  assert.doesNotMatch(runtime, /base\.closest\("script,style,textarea,/);
  assert.match(runtime, /\["aria-label", "title", "placeholder", "alt"\]/);
  assert.match(runtime, /protectedValues\.has\(normalized\)/);
  assert.match(runtime, /new Set\(Object\.values\(homeInterfaceTranslations\[locale\] \?\? \{\}\)\)/);
});
