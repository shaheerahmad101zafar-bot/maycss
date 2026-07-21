/**
 * Cap each category at 250, backfill SEO keywords, sync Blob.
 * Usage: BLOB_READ_WRITE_TOKEN=... node scripts/finalize-catalog-cap-seo.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, put } from "@vercel/blob";

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

const CAP = 250;
const KEYWORDS = [
  "wholesale clothing",
  "MAYCSS",
  "fashion products",
  "womens t shirts",
  "cheap online clothing",
  "cheap plus size clothes",
  "womens clothes sale",
  "jeans and denim",
  "baby clothes",
  "straight leg jeans",
  "purple brand jeans",
  "women's t shirts",
  "womens work clothes",
  "jeans",
  "corset top",
  "black jeans",
  "work",
  "causal",
  "dresses",
  "women clothes",
  "party",
  "cheap clothes",
  "friday sale",
  "plus size clothing",
  "wedding guest",
  "summer dress",
  "dresses for women",
  "red dress",
  "white mini dress",
  "Black Friday",
  "Shop MayCSS Online Store",
];

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
}

function clamp(text, min, max) {
  let t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > max) t = `${t.slice(0, max - 1).trimEnd()}…`;
  while (t.length < min) t = `${t} · MAYCSS`.slice(0, max);
  return t;
}

let products = JSON.parse(
  readFileSync(join(root, "data/products.json"), "utf8"),
);
const categories = JSON.parse(
  readFileSync(join(root, "data/categories.json"), "utf8"),
);

const byCat = new Map();
for (const p of products) {
  const k = p.categoryId || "none";
  if (!byCat.has(k)) byCat.set(k, []);
  byCat.get(k).push(p);
}

const kept = [];
const dropped = [];
for (const [catId, list] of byCat) {
  list.sort((a, b) => Number(a.id) - Number(b.id));
  const keep = list.slice(0, CAP);
  const drop = list.slice(CAP);
  kept.push(...keep);
  dropped.push(...drop);
  console.log(
    catId,
    `keep=${keep.length}`,
    drop.length ? `drop=${drop.length}` : "",
  );
}

kept.sort((a, b) => Number(a.id) - Number(b.id));

const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
const catFocus = Object.fromEntries(
  categories.map((c) => [c.id, c.seo?.focusKeyword || c.name]),
);

for (const p of kept) {
  const focus =
    p.seo?.focusKeyword ||
    catFocus[p.categoryId] ||
    "dresses for women";
  const mergedKw = [...new Set([...(p.seo?.keywords || []), ...KEYWORDS, focus])];
  p.seo = {
    ...(p.seo || {}),
    focusKeyword: focus,
    keywords: mergedKw,
    metaTitle: clamp(
      p.seo?.metaTitle || `${focus} · ${p.brand || "MAYCSS"}`,
      30,
      60,
    ),
    metaDescription: clamp(
      p.seo?.metaDescription ||
        `Shop ${focus} at MAYCSS Online Store. ${p.name}. Black Friday deals on wholesale clothing energy fashion products.`,
      120,
      160,
    ),
    ogImage: p.seo?.ogImage || p.image,
  };
  if (!p.contentBlocks || p.contentBlocks.length === 0) {
    p.contentBlocks = [
      {
        id: `seo_${p.id}_rich`,
        type: "richtext",
        heading: p.name,
        headingLevel: 2,
        body: `${p.description || p.name}\n\nShop ${focus} and more at MAYCSS — dresses for women, jeans and denim, wedding guest looks, party styles, and Black Friday friday sale edits.`,
      },
    ];
  }
}

for (const c of categories) {
  c.seo = {
    ...(c.seo || {}),
    focusKeyword: c.seo?.focusKeyword || c.name.toLowerCase(),
    keywords: [...new Set([...(c.seo?.keywords || []), ...KEYWORDS])],
    metaTitle: clamp(c.seo?.metaTitle || `${c.name} · MAYCSS`, 30, 60),
    metaDescription: clamp(
      c.seo?.metaDescription ||
        `Shop ${c.name} at MAYCSS Online Store. Wholesale clothing, fashion products, dresses for women, jeans and denim — Black Friday deals.`,
      120,
      160,
    ),
  };
  // Assign category image from first product if missing
  if (!c.image) {
    const first = kept.find((p) => p.categoryId === c.id && p.image);
    if (first) c.image = first.image;
  }
}

writeFileSync(
  join(root, "data/products.json"),
  JSON.stringify(kept, null, 2) + "\n",
);
writeFileSync(
  join(root, "data/categories.json"),
  JSON.stringify(categories, null, 2) + "\n",
);

mkdirSync(join(root, "data/products/by-id"), { recursive: true });
await forcePut("data/products.json", kept);
await forcePut("data/categories.json", categories);

let n = 0;
for (const p of kept) {
  writeFileSync(
    join(root, `data/products/by-id/${p.id}.json`),
    JSON.stringify(p, null, 2) + "\n",
  );
  await put(`data/products/by-id/${p.id}.json`, JSON.stringify(p, null, 2) + "\n", {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  n += 1;
  if (n % 50 === 0) console.log("by-id", n);
}

console.log(
  `Done. kept=${kept.length} dropped=${dropped.length} categories=${categories.length}`,
);
const summary = {};
for (const p of kept) {
  summary[p.categoryId || "none"] = (summary[p.categoryId || "none"] || 0) + 1;
}
console.log(summary);
