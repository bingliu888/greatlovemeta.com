import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("all twelve auth locales render localized route and form copy",async()=>{
  const [page,form,copies]=await Promise.all([read("../app/[lang]/auth/[mode]/page.tsx"),read("../components/ClerkAuthForm.tsx"),read("../lib/auth-interface-copy.ts")]);
  assert.match(page,/safeSiteLanguage/); assert.doesNotMatch(page,/notFound/); assert.match(page,/authInterfaceCopyFor\(lang\)/);
  assert.match(form,/lang: SiteLanguage/); assert.match(form,/authInterfaceCopyFor\(lang\)/); assert.match(form,/a\.spam/);
  for(const code of ["zh","en","es","ja","ko","fr","de","ru","it","pt","ar","hi"]) assert.match(copies,new RegExp(`\\b${code}:\\{`));
  for(const phrase of ["ログインまたは参加","メールアドレス","로그인 또는 가입","이메일 주소"]) assert.match(copies,new RegExp(phrase));
});
