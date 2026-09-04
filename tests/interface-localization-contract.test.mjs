import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const languages=["zh","zh-tw","en","es","fr","de","ja","ko","it","ar","pt","ru","hi","id","bn","ur","pa","ta","te","ne","si","tr"];
const runtimeLanguages=languages.filter(language=>language!=="zh"&&language!=="en");
const read=path=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("GreatLoveMeta exposes the complete twenty-two-language static interface",async()=>{
  const [locale,runtime,menu,home]=await Promise.all([read("lib/site-locale.ts"),read("components/LocaleRuntime.tsx"),read("components/HeaderLanguageMenu.tsx"),read("lib/home-interface-translations.generated.ts")]);
  for(const language of languages)assert.match(locale,new RegExp(language==="zh-tw"?`\\["${language}"`:`${language}:|\\["${language}"`));
  let dictionarySize=0;
  for(const language of runtimeLanguages){
    const dictionary=JSON.parse(await read(`public/locales/public-interface/${language}.json`));
    if(!dictionarySize)dictionarySize=Object.keys(dictionary).length;
    assert.ok(dictionarySize>=2500,"complete interface corpus");
    assert.equal(Object.keys(dictionary).length,dictionarySize,`${language} dictionary size`);
    for(const phrase of ["Dashboard","Admin dashboard","Account menu","GreatLoveMeta.com home","Copy wallet address"])assert.equal(typeof dictionary[phrase],"string",`${language}: ${phrase}`);
    assert.equal(Object.keys(dictionary).some(key=>/CatMeDAO|CATMEDAO|猫迷/.test(key)),false,`${language} excludes foreign-site history`);
  }
  assert.match(home,/"zh-tw"\s*:/);
  assert.match(home,/"ur"\s*:/);
  assert.match(runtime,/isSiteLanguage\(parts\[1\]\)/);
  assert.match(runtime,/locale === "ar" \|\| locale === "ur"/);
  assert.match(menu,/HEADER_LANGUAGES = siteLanguages/);
});

test("Traditional Chinese and Japanese core interface copy does not fall back to English",async()=>{
  const traditional=JSON.parse(await read("public/locales/public-interface/zh-tw.json"));
  const japanese=JSON.parse(await read("public/locales/public-interface/ja.json"));
  const home=await read("lib/home-interface-translations.generated.ts");
  assert.equal(traditional["Dashboard"],"使用者面板");
  assert.equal(traditional["Admin dashboard"],"管理員面板");
  for(const phrase of ["大愛元宇宙首頁","主要導覽","選擇語言","登入或註冊","頁尾導覽","關於我們","開啟智慧助手","我的帳戶","帳戶選單"])assert.match(home,new RegExp(phrase));
  assert.doesNotMatch(home,/賬戶|賬號|電子郵箱/);
  assert.notEqual(japanese["Dashboard"],"Dashboard");
  assert.notEqual(japanese["Account menu"],"Account menu");
});
