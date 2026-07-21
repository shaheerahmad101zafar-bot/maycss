/**
 * Apply tiered sale discounts from list price, then sync catalog to Blob.
 *
 * Tiers (list = originalPrice if already on sale, else price):
 *   ≤ 200          → 37% OFF
 *   200–300        → 60% OFF
 *   300–400        → 64% OFF
 *   400–500        → 70% OFF
 *   500–1000       → 80% OFF
 *   > 1000         → unchanged
 *
 * Usage:
 *   node scripts/apply-tier-discounts.mjs
 *   node scripts/apply-tier-discounts.mjs --skip-blob
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skipBlob = process.argv.includes("--skip-blob");
const fromLocal = process.argv.includes("--from-local");

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

function listedPrice(p) {
  const current = Number(p.price);
  if (!Number.isFinite(current) || current <= 0) return null;
  if (typeof p.originalPrice === "number" && p.originalPrice > current) {
    return p.originalPrice;
  }
  return current;
}

function tierFor(listed) {
  if (listed <= 200) return 37;
  if (listed <= 300) return 60;
  if (listed <= 400) return 64;
  if (listed <= 500) return 70;
  if (listed <= 1000) return 80;
  return null;
}

function applyTier(p) {
  const listed = listedPrice(p);
  if (listed == null) return { product: p, tier: null };
  const pct = tierFor(listed);
  if (pct == null) return { product: p, tier: null };
  const sale = Math.round(listed * (1 - pct / 100) * 100) / 100;
  return {
    product: {
      ...p,
      originalPrice: Math.round(listed * 100) / 100,
      price: sale,
      badge: `${pct}% OFF`,
    },
    tier: pct,
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

function toListing(p) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image,
    price: p.price,
    originalPrice: p.originalPrice,
    badge: p.badge,
    isNew: p.isNew,
    category: p.category,
    categoryId: p.categoryId,
    slug: p.slug,
  };
}

const productsPath = join(root, "data/products.json");
let products;
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

if (token && !skipBlob && !fromLocal) {
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

const counts = { 37: 0, 60: 0, 64: 0, 70: 0, 80: 0, skip: 0 };
const next = products.map((p) => {
  const { product, tier } = applyTier(p);
  if (tier == null) counts.skip += 1;
  else counts[tier] += 1;
  return product;
});

writeFileSync(productsPath, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log("Tier counts:", counts);

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

const listing = next.map(toListing);
const listingPath = join(root, "data/products-listing.json");
writeFileSync(listingPath, JSON.stringify(listing, null, 2) + "\n", "utf8");
console.log(`Wrote local products-listing.json (${listing.length})`);

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

await forcePut("data/products-listing.json", listing, token);
console.log("Synced data/products-listing.json to Blob");

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
  if (done % 400 === 0 || done === next.length) {
    console.log(`by-id synced ${done}/${next.length}`);
  }
}

console.log("Done.");
