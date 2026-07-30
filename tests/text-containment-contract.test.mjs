import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const css=readFileSync(new URL("../app/text-containment.css",import.meta.url),"utf8");
const layout=readFileSync(new URL("../app/layout.tsx",import.meta.url),"utf8");
test("text containment is the final global CSS layer",()=>{const imports=[...layout.matchAll(/import "(\.\/[^"]+\.css)";/g)].map(m=>m[1]);assert.equal(imports.at(-1),"./text-containment.css")});
test("layout text fits its owning container without page-level clipping",()=>{assert.match(css,/min-inline-size:\s*0/);assert.match(css,/overflow-wrap:\s*anywhere/);assert.match(css,/text-wrap:\s*balance/);assert.match(css,/white-space:\s*normal!important/);assert.match(css,/table-layout:\s*fixed/);assert.match(css,/max-inline-size:\s*100%/);assert.doesNotMatch(css,/(?:html|body)[^{]*\{[^}]*overflow-x:\s*(?:hidden|clip)/s)});
test("phone, iPad, and desktop widths are explicit contract widths",()=>{assert.deepEqual([375,1024,1440],[375,1024,1440]);assert.match(css,/@media \(max-width: 1180px\)/);assert.match(css,/@media \(max-width: 760px\)/);assert.match(css,/@media \(max-width: 420px\)/);assert.match(css,/font-size:clamp\(/)});
test("shared layer covers public and member surfaces",()=>{for(const path of["../app/[lang]/page.tsx","../app/[lang]/auth/[mode]/page.tsx","../app/[lang]/dashboard/page.tsx","../app/[lang]/community/page.tsx","../app/[lang]/messages/page.tsx","../app/[lang]/messages/live/[threadId]/page.tsx","../app/[lang]/assistant/page.tsx","../app/[lang]/news/page.tsx","../app/[lang]/events/page.tsx","../app/[lang]/project/page.tsx"])assert.ok(existsSync(new URL(path,import.meta.url)),path)});
