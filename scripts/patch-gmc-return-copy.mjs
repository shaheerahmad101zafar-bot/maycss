/**
 * Surgical GMC misrepresentation fix: align return-window copy only.
 * Does NOT reset layouts, images, banners, or other CMS content —
 * only replaces known stale "30-day returns" strings with "10-day returns".
 *
 * Usage: node scripts/patch-gmc-return-copy.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, get, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

function patchText(input) {
  let count = 0;
  const out = input.replace(/30-day returns/gi, () => {
    count += 1;
    return "10-day returns";
  });
  return { out, count };
}

const r = await get("data/pages.json", {
  access: "public",
  token,
  useCache: false,
});
const raw = await new Response(r.stream).text();
const { out, count } = patchText(raw);
console.log(`Blob pages.json: ${count} return-window string(s) to update`);

if (dryRun) {
  console.log("Dry run — no writes.");
  process.exit(0);
}

if (count === 0) {
  console.log("Nothing to patch on Blob.");
} else {
  // Validate JSON still parses after string replace.
  JSON.parse(out);
  try {
    await del("data/pages.json", { token });
  } catch {
    // ignore
  }
  await put("data/pages.json", out, {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
  console.log("Updated Blob data/pages.json (return copy only).");
}

// Keep local mirror aligned for the same strings only.
const localPath = join(root, "data/pages.json");
const localRaw = readFileSync(localPath, "utf8");
const localPatched = patchText(localRaw);
if (localPatched.count > 0) {
  JSON.parse(localPatched.out);
  writeFileSync(localPath, localPatched.out);
  console.log(`Updated local pages.json (${localPatched.count} string(s)).`);
}
