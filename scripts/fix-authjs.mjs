#!/usr/bin/env node
/**
 * Auth.js v5 beta ships a package.json `exports` map that doesn't expose its
 * own `lib/*` files, but its internal code (e.g. callback.js) uses relative
 * imports that Next.js 16's Turbopack rejects under those strict boundaries.
 *
 * Until Auth.js publishes a fix, we patch @auth/core's package.json to expose
 * ./lib/*. Runs on `postinstall`, so it survives fresh installs.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pkgPath = join(process.cwd(), "node_modules", "@auth", "core", "package.json");
if (!existsSync(pkgPath)) {
  // Nothing to patch — auth.js not (yet) installed.
  process.exit(0);
}

try {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (!pkg.exports) pkg.exports = {};
  const already = pkg.exports["./lib/*"];
  if (already && already.import === "./lib/*.js") {
    process.exit(0);
  }
  pkg.exports["./lib/*"] = {
    types: "./lib/*.d.ts",
    import: "./lib/*.js",
    default: "./lib/*.js",
  };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log("[fix-authjs] patched @auth/core exports to include ./lib/*");
} catch (err) {
  console.warn("[fix-authjs] skipped:", err.message);
}
