/**
 * Black Friday catalog pass:
 * - Apply 20% off every product (badge "20% OFF")
 * - Mark ~400 highest-scoring "cool" product images as New Arrivals (isNew)
 * - Sync products.json + by-id records (+ optional pages.json) to Vercel Blob
 *
 * Usage:
 *   node scripts/apply-bf-sale-and-new.mjs
 *   node scripts/apply-bf-sale-and-new.mjs --skip-blob
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const NEW_COUNT = 400;
const skipBlob = process.argv.includes("--skip-blob");

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

const COOL_NAME =
  /\b(gown|cocktail|floral|satin|velvet|sequin|lace|maxi|wrap|leather|silk|chiffon|embroider|beaded|metallic|corset|blazer|trench)\b/i;

const COOL_CAT =
  /formal|cocktail|wedding|party|dress|wide.?leg|flare/i;

function coolScore(p) {
  let s = 0;
  if (p.image && String(p.image).startsWith("http")) s += 12;
  const gallery = Array.isArray(p.gallery) ? p.gallery : [];
  s += Math.min(gallery.length, 6) * 3;
  if (COOL_NAME.test(String(p.name || ""))) s += 8;
  if (COOL_CAT.test(String(p.categoryId || "")) || COOL_CAT.test(String(p.category || ""))) {
    s += 6;
  }
  const price = Number(p.price) || 0;
  if (price >= 80) s += 3;
  if (price >= 150) s += 4;
  if (price >= 300) s += 4;
  if (String(p.image || "").includes("optimized")) s += 2;
  if (String(p.image || "").includes("macysassets")) s += 1;
  // Slight brand diversity boost for known fashion labels in name/brand
  if (p.brand && String(p.brand).length > 2) s += 1;
  return s;
}

function applyTwentyPercent(p) {
  const current = Number(p.price);
  if (!Number.isFinite(current) || current <= 0) return p;
  const listed =
    typeof p.originalPrice === "number" && p.originalPrice > current
      ? p.originalPrice
      : current;
  const sale = Math.round(listed * 0.8 * 100) / 100;
  return {
    ...p,
    originalPrice: Math.round(listed * 100) / 100,
    price: sale,
    badge: "20% OFF",
  };
}

async function forcePut(pathname, data, token) {
  try {
    await del(pathname, { token });
  } catch {
    // missing ok
  }
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

const productsPath = join(root, "data/products.json");
/** Prefer Blob catalog when token present so we mutate live data. */
let products;
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

if (token && !skipBlob) {
  try {
    const { get } = await import("@vercel/blob");
    const result = await get("data/products.json", {
      access: "public",
      token,
      useCache: false,
    });
    if (result?.stream) {
      const text = await new Response(result.stream).text();
      products = JSON.parse(text);
      console.log(`Loaded ${products.length} products from Blob`);
    }
  } catch (err) {
    console.warn("Blob read failed, using local:", err.message);
  }
}

if (!products) {
  products = JSON.parse(readFileSync(productsPath, "utf8"));
  console.log(`Loaded ${products.length} products from local file`);
}

const scored = products
  .map((p, i) => ({ i, score: coolScore(p), id: String(p.id) }))
  .sort((a, b) => b.score - a.score || a.i - b.i);

const newIds = new Set(scored.slice(0, NEW_COUNT).map((x) => x.id));

const next = products.map((p) => {
  const withSale = applyTwentyPercent(p);
  return {
    ...withSale,
    isNew: newIds.has(String(p.id)),
  };
});

writeFileSync(productsPath, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log(
  `Wrote local products.json — sale=${next.filter((p) => p.badge === "20% OFF").length}, isNew=${next.filter((p) => p.isNew).length}`,
);

const byIdDir = join(root, "data/products/by-id");
mkdirSync(byIdDir, { recursive: true });
for (const p of next) {
  writeFileSync(
    join(byIdDir, `${p.id}.json`),
    JSON.stringify(p, null, 2) + "\n",
    "utf8",
  );
}
console.log(`Wrote ${next.length} local by-id records`);

if (skipBlob) {
  console.log("Skipping Blob sync (--skip-blob)");
  process.exit(0);
}

if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN — local files updated only");
  process.exit(1);
}

await forcePut("data/products.json", next, token);
console.log("Synced data/products.json to Blob");

const pages = JSON.parse(readFileSync(join(root, "data/pages.json"), "utf8"));
await forcePut("data/pages.json", pages, token);
console.log("Synced data/pages.json to Blob");

const concurrency = 40;
let done = 0;
for (let i = 0; i < next.length; i += concurrency) {
  const chunk = next.slice(i, i + concurrency);
  await Promise.all(
    chunk.map((p) =>
      put(`data/products/by-id/${p.id}.json`, JSON.stringify(p) + "\n", {
        access: "public",
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      }),
    ),
  );
  done += chunk.length;
  if (done % 200 === 0 || done === next.length) {
    console.log(`by-id synced ${done}/${next.length}`);
  }
}

console.log("Done.");
