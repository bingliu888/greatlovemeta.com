import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");
test("shared header uses the SmartClass hamburger drawer and twenty-two text languages",async()=>{
 const [header,languages,account,css]=await Promise.all([read("../components/SiteHeader.tsx"),read("../components/HeaderLanguageMenu.tsx"),read("../components/HeaderAccount.tsx"),read("../components/header-menu.css")]);
 assert.match(header,/aria-controls="mobile-header-menu"/); assert.match(header,/hamburger-button/); assert.equal((header.match(/<HeaderAccount lang=\{lang\}\/\>/g)??[]).length,2);
 assert.match(languages,/HEADER_LANGUAGES\.map/);
 assert.doesNotMatch(languages,/GlobeIcon|⌄/); assert.match(languages,/▾/);
 assert.ok(header.indexOf("<HeaderLanguageMenu lang={lang}/>") < header.indexOf("<HeaderAccount lang={lang}/>") , "desktop language control must precede account");
 const locale=await read("../lib/site-locale.ts");
 for(const label of ["中文（简体）","中文（繁體）","English","Español","Français","Deutsch","日本語","한국어","Italiano","العربية","Português","Русский","हिन्दी","Bahasa Indonesia","বাংলা","اردو","ਪੰਜਾਬੀ","தமிழ்","తెలుగు","नेपाली","සිංහල","Türkçe"])assert.match(locale,new RegExp(label));
 assert.match(account,/shellCopyFor\(lang\)/); assert.match(account,/session\.signedIn/); assert.match(locale,/signIn:interfaceText/);
 assert.match(css,/\.hamburger-button\.open span:nth-child\(1\)/); assert.match(css,/\.mobile-header-menu/); assert.match(css,/\.mobile-language-options/);
 assert.doesNotMatch(languages,/🇨🇳|🇺🇸|🇪🇸/);
 assert.doesNotMatch(languages,/routeLanguage|searchParams\.set\("uiLocale"/);assert.match(languages,/parts\[1\] = code/);
});
