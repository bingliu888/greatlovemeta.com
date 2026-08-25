import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "dist/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Published third-party swap bundles are immutable browser artifacts, not
    // authored source. Their upstream minified output is validated separately.
    "public/swap-assets/**",
    // Browser copies generated from pinned third-party packages are prepared
    // and validated by the build; lint the integration code, not vendor output.
    "public/pdf.worker.min.mjs",
    "public/wallet-assets/greatlove-onboard.js",
  ]),
]);

export default eslintConfig;
