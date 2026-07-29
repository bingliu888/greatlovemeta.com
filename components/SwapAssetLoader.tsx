"use client";

import { useEffect } from "react";

type SwapTool = "stable" | "auto";

const swapAssetVersion = "20260728-rpc-history";

const sharedAssets = [
  { id: "greatlove-ethers", src: "/swap-assets/ethers.umd.min.js" },
  { id: "greatlove-wallet-onboard", src: "/swap-assets/autoswap-onboard.js" },
];

const toolAssets: Record<SwapTool, Array<{ id: string; src: string }>> = {
  stable: [
    { id: "greatlove-stableswap-config", src: `/swap-assets/stableswap.config.js?v=${swapAssetVersion}` },
    { id: "greatlove-stableswap-app", src: `/swap-assets/stableswap.js?v=${swapAssetVersion}` },
  ],
  auto: [
    { id: "greatlove-autoswap-config", src: `/swap-assets/autoswap.config.js?v=${swapAssetVersion}` },
    { id: "greatlove-autoswap-app", src: `/swap-assets/autoswap.js?v=${swapAssetVersion}` },
  ],
};

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = false;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
    document.body.appendChild(script);
  });
}

export function SwapAssetLoader({ tool }: { tool: SwapTool }) {
  useEffect(() => {
    const pageClass = tool === "stable" ? "gl-stableswap-page" : "gl-autoswap-page";
    document.body.classList.add(pageClass);
    let cancelled = false;

    (async () => {
      try {
        for (const asset of [...sharedAssets, ...toolAssets[tool]]) {
          if (cancelled) return;
          await loadScript(asset.id, asset.src);
        }
      } catch (error) {
        const status = document.querySelector<HTMLElement>(tool === "stable" ? "[data-stableswap-app] [data-status]" : "[data-autoswap-app] [data-status]");
        if (status) {
          status.classList.add("error");
          status.textContent = error instanceof Error ? error.message : String(error);
        }
      }
    })();

    return () => {
      cancelled = true;
      document.body.classList.remove(pageClass, "is-stableswap-connected", "is-connected", "is-executing");
      for (const asset of toolAssets[tool]) document.getElementById(asset.id)?.remove();
    };
  }, [tool]);

  return null;
}
