import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const MANAGED_REOWN_PROJECT_ID = "d80a9b985c7086328f1c42a7ff7bdf46";
const RETIRED_REOWN_PROJECT_ID = "0d850a98123d379c16d0d9f2555d39bb";

test("every GreatLoveMeta wallet entry point uses the managed Reown project", async () => {
  const paths = [
    "lib/greatlovemeta-commerce.ts",
    "public/swap-assets/autoswap.config.js",
    "public/swap-assets/stableswap.config.js"
  ];
  for (const path of paths) {
    const source = await readFile(path, "utf8");
    assert.match(source, new RegExp(MANAGED_REOWN_PROJECT_ID), path);
    assert.doesNotMatch(source, new RegExp(RETIRED_REOWN_PROJECT_ID), path);
  }
});
