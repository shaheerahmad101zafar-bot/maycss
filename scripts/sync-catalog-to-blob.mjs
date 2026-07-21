/**
 * Sync local catalog JSON to Vercel Blob:
 *   data/products.json, data/categories.json, data/products/by-id/{id}.json
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... node scripts/sync-catalog-to-blob.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
    // ignore
  }
}

loadEnvLocal();

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

async function putJson(pathname, data) {
  const body =
    typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n";
  return put(pathname, body, {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function forcePut(pathname, data) {
  try {
    await del(pathname, { token });
  } catch {
    // ignore missing
  }
  return putJson(pathname, data);
}

const products = JSON.parse(
  readFileSync(join(root, "data/products.json"), "utf8"),
);
const categories = JSON.parse(
  readFileSync(join(root, "data/categories.json"), "utf8"),
);

const byIdDir = join(root, "data/products/by-id");
mkdirSync(byIdDir, { recursive: true });

const existing = await list({ prefix: "data/products/by-id/", token });
for (const b of existing.blobs) {
  try {
    await del(b.url, { token });
  } catch {
    // ignore
  }
}

let n = 0;
for (const p of products) {
  const file = join(byIdDir, `${p.id}.json`);
  const body = JSON.stringify(p, null, 2) + "\n";
  writeFileSync(file, body);
  await putJson(`data/products/by-id/${p.id}.json`, body);
  n += 1;
}

await forcePut("data/products.json", products);
await forcePut("data/categories.json", categories);

const formal = products.filter((p) => p.categoryId === "cat_formal").length;
const jeans = products.filter((p) => p.categoryId === "cat_jeans").length;
console.log(
  `Synced ${products.length} products (${formal} Formal, ${jeans} Jeans), ${categories.length} categories, ${n} by-id records.`,
);
