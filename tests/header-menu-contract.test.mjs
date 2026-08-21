import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");
test("shared header uses the SmartClass hamburger drawer and twelve text languages",async()=>{
 const [header,languages,account,css]=await Promise.all([read("../components/SiteHeader.tsx"),read("../components/HeaderLanguageMenu.tsx"),read("../components/MobileHeaderAccount.tsx"),read("../components/header-menu.css")]);
 assert.match(header,/aria-controls="mobile-header-menu"/); assert.match(header,/hamburger-button/); assert.match(header,/MobileHeaderAccount/);
 assert.match(languages,/HEADER_LANGUAGES\.map/);
 for(const label of ["中文","English","Español","日本語","한국어","Français","Deutsch","Русский","Italiano","Português","العربية","हिन्दी"])assert.match(languages,new RegExp(label));
 assert.match(account,/登录或注册/); assert.match(account,/Sign in or register/); assert.match(account,/session\.signedIn/);
 assert.match(css,/\.hamburger-button\.open span:nth-child\(1\)/); assert.match(css,/\.mobile-header-menu/); assert.match(css,/\.mobile-language-options/);
 assert.doesNotMatch(languages,/🇨🇳|🇺🇸|🇪🇸/);
});

