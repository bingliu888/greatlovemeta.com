import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const locales = ["zh-tw", "ja", "ko", "es", "fr", "de", "ru", "it", "pt", "ar", "hi", "id", "bn", "ur", "pa", "ta", "te", "ne", "si", "tr"];

test("account and subscription surfaces are included in every public locale dictionary", async () => {
  for (const locale of locales) {
    const runtimeDictionary = await read(`public/locales/public-interface/${locale}.json`);
    for (const phrase of [
      "1-month subscription", "12-month subscription", "Payment options available", "Active through",
      "Copy RefID", "Copy wallet address", "Subscribe with crypto", "Connect wallet",
      "Read latest transactions & sync", "Manage your GreatLoveMeta member profile."
    ]) assert.match(runtimeDictionary, new RegExp(JSON.stringify(phrase).slice(1, -1)));
  }
});

test("public locale dictionaries exclude implementation and retired-term copy", async () => {
  for (const locale of locales) {
    const runtimeDictionary = JSON.parse(await read(`public/locales/public-interface/${locale}.json`));
    assert.equal(runtimeDictionary["6-month subscription"], undefined);
    assert.equal(Object.keys(runtimeDictionary).some(key => key.startsWith("SELECT ") || key.includes("/api/billing/crypto/")), false);
    assert.equal(Object.keys(runtimeDictionary).some(key => /;\s*(?:return|if\s*\(|searchParams)|\b(?:useState|useRef)\s*\(|mimeType\.startsWith|=>/.test(key)), false);
  }
});

test("account menu, footer, legal and every subscription step keep the selected twenty-two-language runtime", async () => {
  const [layout, header, footer, legal, pricing, crypto, locale] = await Promise.all([
    read("app/[lang]/layout.tsx"), read("components/HeaderAccount.tsx"), read("components/SiteFooter.tsx"),
    read("components/LegalPage.tsx"), read("app/[lang]/pricing/pricing-client.tsx"),
    read("components/CryptoCheckout.tsx"), read("lib/site-locale.ts")
  ]);
  assert.match(layout, /<LocaleRuntime locale=\{safeLanguage\}/);
  assert.match(header, /shellCopyFor\(lang\)/);
  assert.match(footer, /shellCopyFor\(lang\)/);
  assert.match(legal, /SiteLanguage/);
  assert.match(pricing, /lang: SiteLanguage/);
  assert.match(crypto, /lang: SiteLanguage/);
  for (const field of ["account", "accountMenu", "signIn", "dashboard", "myCourses", "messages", "settings", "membership", "signOut"]) {
    assert.match(locale, new RegExp(`${field}:interfaceText`));
  }
});
