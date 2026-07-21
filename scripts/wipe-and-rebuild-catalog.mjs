/**
 * Wipe catalog + rebuild categories on local disk and Vercel Blob.
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... node scripts/wipe-and-rebuild-catalog.mjs
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, list, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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
    /* ignore */
  }
}
loadEnvLocal();

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

async function forcePut(pathname, data) {
  try {
    await del(pathname, { token });
  } catch {
    /* ignore */
  }
  const body =
    typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n";
  await put(pathname, body, {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  console.log("wrote", pathname);
}

const categories = JSON.parse(
  readFileSync(join(root, "data/categories.json"), "utf8"),
);

writeFileSync(join(root, "data/products.json"), "[]\n");
mkdirSync(join(root, "data/products"), { recursive: true });
mkdirSync(join(root, "data/categories"), { recursive: true });
writeFileSync(join(root, "data/products/deleted-ids.json"), "[]\n");
writeFileSync(join(root, "data/categories/deleted-ids.json"), "[]\n");

const byIdDir = join(root, "data/products/by-id");
rmSync(byIdDir, { recursive: true, force: true });
mkdirSync(byIdDir, { recursive: true });

const existing = await list({ prefix: "data/products/by-id/", token });
console.log("deleting by-id blobs", existing.blobs.length);
for (const b of existing.blobs) {
  try {
    await del(b.url, { token });
  } catch {
    /* ignore */
  }
}

await forcePut("data/products.json", []);
await forcePut("data/products/deleted-ids.json", []);
await forcePut("data/categories/deleted-ids.json", []);
await forcePut("data/categories.json", categories);

console.log(
  `Wipe complete. Categories: ${categories.length}. Products: 0. Ready for import.`,
);
