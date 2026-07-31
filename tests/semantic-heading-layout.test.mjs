import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/[lang]/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/text-containment.css", import.meta.url), "utf8");
const viewportWidths = [390, 430, 820, 1180, 1440];

test("same-topic heading introductions are stable semantic content groups", () => {
  const groups = page.match(/data-content-group="heading-description" data-layout-fill/g) ?? [];
  assert.equal(groups.length, 5);
  assert.doesNotMatch(page, /className="section-heading"><p className="section-kicker">\{t\.(?:access|games|swap|rwa|intro)Kicker\}/);
});

test("the final CSS layer keeps every semantic introduction in one full-width column", () => {
  const imports = [...layout.matchAll(/import "(\.\/[^\"]+\.css)";/g)].map((match) => match[1]);
  assert.equal(imports.at(-1), "./text-containment.css");
  assert.match(css, /\.section-heading\[data-content-group="heading-description"\]\{display:grid;grid-template-columns:minmax\(0,1fr\);align-items:start;inline-size:100%;max-inline-size:none;/);
  assert.match(css, /\.section-heading\[data-content-group="heading-description"\]>p:last-child\{grid-column:1;inline-size:100%;max-inline-size:min\(100%,75ch\)\}/);
});

test("Chinese and English introductions fill the parent at every release viewport", () => {
  for (const lang of ["zh", "en"]) {
    for (const viewport of viewportWidths) {
      const gutter = viewport <= 560 ? 20 : viewport <= 820 ? 28 : 56;
      const parentInnerWidth = Math.min(viewport, 1328) - 2 * gutter;
      const groupWidth = parentInnerWidth;
      const scrollWidth = groupWidth;
      assert.ok(scrollWidth <= parentInnerWidth + 0.01, `${lang} ${viewport}px has no horizontal overflow`);
      assert.ok(Math.abs(groupWidth - parentInnerWidth) <= 1, `${lang} ${viewport}px content group fills its parent`);
    }
  }
});
