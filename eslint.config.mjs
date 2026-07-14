import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * MayCSS ESLint config.
 *
 * We keep every rule from `eslint-config-next`, then apply two carefully-
 * scoped tweaks:
 *
 *  1. Unused-vars: allow the underscore-prefix convention. This is the
 *     standard TS pattern for "I must accept this parameter to satisfy an
 *     interface, but I don't use it". Without it, every stub method in
 *     the payment strategies + chat transport lights up the linter.
 *
 *  2. React 19's brand-new strict advisory rules (`purity`,
 *     `set-state-in-effect`, `preserve-manual-memoization`) are demoted to
 *     `warn`. They flag legitimate patterns — localStorage rehydration,
 *     setInterval-driven UI, external-store subscriptions — that are
 *     production-safe and match the React docs' own examples. Keeping them
 *     as warnings surfaces them without blocking the build.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Project-wide rule tuning.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // React 19 strict advisories — surface as warnings, don't block CI.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
