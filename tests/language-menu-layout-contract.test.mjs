import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("desktop language overlay overrides generic container caps", () => {
  const menuCss = readFileSync(new URL("../components/header-menu.css", import.meta.url), "utf8");
  const containmentCss = readFileSync(new URL("../app/text-containment.css", import.meta.url), "utf8");
  const rule = menuCss.match(/\.site-header \.header-language-options\{([^}]+)\}/)?.[1] ?? "";
  const declarations = Object.fromEntries(rule.split(";").filter(Boolean).map(item => {
    const separator = item.indexOf(":");
    return [item.slice(0, separator), item.slice(separator + 1)];
  }));

  assert.match(containmentCss, /div[^}]*max-inline-size:100%/);
  assert.equal(declarations.width, "330px");
  assert.equal(declarations["max-width"], "calc(100vw - 28px)");
  assert.equal(declarations["max-inline-size"], "calc(100vw - 28px)");
  assert.equal(declarations["grid-template-columns"], "repeat(2,minmax(0,1fr))");
  for (const viewport of [1180, 1440]) assert.equal(Math.min(330, viewport - 28), 330);
});
