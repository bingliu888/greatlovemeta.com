import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("home swap cards route to local bilingual pages", () => {
  const home = read("app/[lang]/page.tsx");
  for (const route of ["/en/swap/stable", "/en/swap/auto", "/zh/swap/stable", "/zh/swap/auto"]) {
    assert.match(home, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(home, /greatlovedao\.com\/(?:stableswap|autoswap)/i);
});

test("local swap pages include migrated tool controls", () => {
  const stable = read("app/[lang]/swap/stable/page.tsx");
  const auto = read("app/[lang]/swap/auto/page.tsx");
  assert.match(stable, /data-stableswap-app/);
  assert.match(stable, /data-swap-button/);
  assert.match(stable, /data-history-body/);
  assert.match(auto, /data-autoswap-app/);
  assert.match(auto, /data-submit-order/);
  assert.match(auto, /data-orders-body/);
  assert.match(auto, /data-my-orders-body/);
});

test("swap runtime assets are local and language-aware", () => {
  const loader = read("components/SwapAssetLoader.tsx");
  for (const asset of ["ethers.umd.min.js", "autoswap-onboard.js", "stableswap.config.js", "stableswap.js", "autoswap.config.js", "autoswap.js"]) {
    assert.match(loader, new RegExp(asset.replaceAll(".", "\\.")));
    assert.ok(fs.existsSync(path.join(root, "public/swap-assets", asset)), `${asset} must be stored locally`);
  }
  for (const script of ["stableswap.js", "autoswap.js"]) {
    const source = read(`public/swap-assets/${script}`);
    assert.match(source, /document\.documentElement\.lang|location\.pathname/);
    assert.doesNotMatch(source, /greatlovedao\.com/i);
  }

  const autoSource = read("public/swap-assets/autoswap.js");
  assert.match(autoSource, /fetch\(['"]\/swap-assets\/abi\/AutoSwapLimitOrderBook\.json['"]/);
  assert.doesNotMatch(autoSource, /fetch\(['"]assets\/abi\//);

  const abiPath = path.join(root, "public/swap-assets/abi/AutoSwapLimitOrderBook.json");
  assert.ok(fs.existsSync(abiPath), "AutoSwapLimitOrderBook ABI must be stored locally");
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  assert.ok(Array.isArray(abi) && abi.length > 0, "AutoSwapLimitOrderBook ABI must be a non-empty array");
  for (const name of ["getPriceLevels", "getOrderByID", "placeLimitBuyCrossThenPost", "placeLimitSellCrossThenPost"]) {
    assert.ok(abi.some((entry) => entry.type === "function" && entry.name === name), `${name} must exist in AutoSwapLimitOrderBook ABI`);
  }
});

test("swap pages use current Polygon RPC providers with failover", () => {
  for (const configFile of ["autoswap.config.js", "stableswap.config.js"]) {
    const source = read(`public/swap-assets/${configFile}`);
    assert.doesNotMatch(source, /polygon-rpc\.com/i);
    for (const endpoint of ["polygon.drpc.org", "polygon.publicnode.com", "1rpc.io/matic"]) {
      assert.match(source, new RegExp(endpoint.replaceAll(".", "\\.")));
    }
  }

  for (const runtimeFile of ["autoswap.js", "stableswap.js"]) {
    const source = read(`public/swap-assets/${runtimeFile}`);
    assert.match(source, /for \(var i = 0; i < rpcUrls\.length; i \+= 1\)/);
    assert.match(source, /await provider\.getNetwork\(\)/);
  }
});
