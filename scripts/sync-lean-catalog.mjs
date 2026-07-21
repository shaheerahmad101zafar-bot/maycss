/**
 * Build lean listing + footer index and upload to Blob for faster live reads.
 *
 * Usage: node scripts/sync-lean-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, get, put } from "@vercel/blob";

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
    rating: p.rating,
    reviews: p.reviews,
    status: p.status,
  };
}

async function forcePut(pathname, data) {
  try {
    await del(pathname, { token });
  } catch {
    // ignore
  }
  await put(pathname, JSON.stringify(data, null, 2) + "\n", {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

let products;
try {
  const result = await get("data/products.json", {
    access: "public",
    token,
    useCache: false,
  });
  if (result?.stream) {
    products = JSON.parse(await new Response(result.stream).text());
    console.log(`Blob products: ${products.length}`);
  }
} catch (err) {
  console.warn("Blob read failed:", err.message);
}

if (!products) {
  products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
  console.log(`Local products: ${products.length}`);
}

const listing = products.map(toListing);
writeFileSync(
  join(root, "data/products-listing.json"),
  JSON.stringify(listing) + "\n",
);
await forcePut("data/products-listing.json", listing);
console.log(
  `Listing synced (${Buffer.byteLength(JSON.stringify(listing))} bytes)`,
);

let pages;
try {
  const result = await get("data/pages.json", {
    access: "public",
    token,
    useCache: false,
  });
  if (result?.stream) {
    pages = JSON.parse(await new Response(result.stream).text());
  }
} catch {
  // ignore
}
if (!pages) {
  pages = JSON.parse(readFileSync(join(root, "data/pages.json"), "utf8"));
}

const footer = pages.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  showInFooter: p.showInFooter,
  footerColumn: p.footerColumn,
  published: p.published !== false,
}));
writeFileSync(
  join(root, "data/footer-pages.json"),
  JSON.stringify(footer, null, 2) + "\n",
);
await forcePut("data/footer-pages.json", footer);
console.log(`Footer index synced (${footer.length} pages)`);
console.log("Done.");
