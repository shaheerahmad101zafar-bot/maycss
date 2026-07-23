/**
 * Safe catalog integrity fix for MAYCSS.
 *
 * Reads production Blob `data/products.json` (falls back to local), then ONLY
 * patches missing/invalid fields:
 *   - description (empty / too short → generate from title)
 *   - brand (missing / invalid → extract from title or "MAYCSS")
 *   - colors / hex (ensure color variants + swatch hex; keep color.image)
 *   - price (missing / zero / invalid → reasonable price ≤ $100)
 *
 * NEVER overwrites: product images, galleries, colorImages URLs, badges,
 * SEO, content blocks, categories, app-config, or CMS pages.
 *
 * Usage:
 *   node scripts/fix-catalog-data.mjs
 *   node scripts/fix-catalog-data.mjs --dry-run
 *   node scripts/fix-catalog-data.mjs --local-only
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, get, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const localOnly = process.argv.includes("--local-only");
const SHORT_DESC = 80;

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

/** Named fashion colors → hex (longest matches first when scanning). */
const NAMED_HEX = [
  ["off white", "#F5F5F0"],
  ["ivory", "#FFFFF0"],
  ["cream", "#FFFDD0"],
  ["beige", "#F5F5DC"],
  ["khaki", "#C3B091"],
  ["taupe", "#483C32"],
  ["camel", "#C19A6B"],
  ["tan", "#D2B48C"],
  ["brown", "#8B4513"],
  ["chocolate", "#7B3F00"],
  ["espresso", "#3C1414"],
  ["burgundy", "#800020"],
  ["maroon", "#800000"],
  ["wine", "#722F37"],
  ["blush", "#DE5D83"],
  ["rose", "#FF007F"],
  ["coral", "#FF7F50"],
  ["orange", "#FF8C00"],
  ["rust", "#B7410E"],
  ["mustard", "#FFDB58"],
  ["gold", "#C9A227"],
  ["yellow", "#F4D03F"],
  ["olive", "#808000"],
  ["sage", "#9CAF88"],
  ["mint", "#98FF98"],
  ["emerald", "#50C878"],
  ["green", "#2E8B57"],
  ["teal", "#008080"],
  ["turquoise", "#40E0D0"],
  ["aqua", "#00FFFF"],
  ["cyan", "#00BCD4"],
  ["navy", "#001F3F"],
  ["indigo", "#4B0082"],
  ["cobalt", "#0047AB"],
  ["royal", "#4169E1"],
  ["blue", "#2E5AAC"],
  ["denim", "#1560BD"],
  ["sky", "#87CEEB"],
  ["lavender", "#E6E6FA"],
  ["lilac", "#C8A2C8"],
  ["violet", "#8F00FF"],
  ["purple", "#6A0DAD"],
  ["magenta", "#FF00FF"],
  ["fuchsia", "#FF00FF"],
  ["pink", "#FF69B4"],
  ["red", "#C41E3A"],
  ["scarlet", "#FF2400"],
  ["crimson", "#DC143C"],
  ["silver", "#C0C0C0"],
  ["grey", "#808080"],
  ["gray", "#808080"],
  ["charcoal", "#36454F"],
  ["heather", "#B6B6B4"],
  ["black", "#1A1A1A"],
  ["white", "#F7F7F7"],
  ["multi", "#9E9E9E"],
  ["floral", "#D4A5A5"],
  ["print", "#9E9E9E"],
  ["metallic", "#A8A9AD"],
  ["nude", "#E3BC9A"],
  ["clear", "#E8E8E8"],
];

function hashHex(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const r = 80 + (hash & 0x7f);
  const g = 80 + ((hash >> 8) & 0x7f);
  const b = 80 + ((hash >> 16) & 0x7f);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function hexFromColorName(name) {
  const lower = String(name || "").toLowerCase().trim();
  if (!lower) return "#808080";
  if (/^#?[0-9a-f]{6}$/i.test(lower)) {
    return lower.startsWith("#") ? lower.toUpperCase() : `#${lower.toUpperCase()}`;
  }
  for (const [token, hex] of NAMED_HEX) {
    if (lower.includes(token)) return hex;
  }
  return hashHex(lower);
}

function categoryHint(product) {
  const cat = String(product.category || product.categoryId || "")
    .replace(/^cat_/, "")
    .replace(/_/g, " ")
    .trim();
  return cat || "fashion";
}

function generateDescription(product) {
  const name = String(product.name || "This piece").trim();
  const brand = String(product.brand || "").trim();
  const hint = categoryHint(product);
  const lead = brand
    ? `${name} by ${brand} is a curated ${hint} pick at MAYCSS.`
    : `${name} is a curated ${hint} pick at MAYCSS.`;
  const colors = Array.isArray(product.colors)
    ? product.colors.map((c) => c?.name).filter(Boolean)
    : [];
  const colorLine =
    colors.length > 0
      ? ` Available in ${colors.slice(0, 4).join(", ")}${colors.length > 4 ? ", and more" : ""}.`
      : "";
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const sizeLine =
    sizes.length > 0
      ? ` Sizes include ${sizes.slice(0, 8).join(", ")}${sizes.length > 8 ? ", and more" : ""}.`
      : "";
  return `${lead} Shop quality materials and considered design at myacssstore.store.${colorLine}${sizeLine}`.trim();
}

function stablePriceUnder100(product) {
  const key = String(product.id ?? product.name ?? "0");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  }
  // $24.99 – $99.99 in .99 endings
  const dollars = 24 + (hash % 76); // 24..99
  return Math.round((dollars + 0.99) * 100) / 100;
}

function ensureColors(product) {
  let colors = Array.isArray(product.colors) ? product.colors.map((c) => ({ ...c })) : [];
  let changed = false;

  // Rebuild empty colors from colorImages keys or a single Default.
  if (colors.length === 0) {
    const keys = product.colorImages ? Object.keys(product.colorImages) : [];
    if (keys.length > 0) {
      colors = keys.map((name) => {
        const img = product.colorImages?.[name]?.image;
        return {
          name,
          hex: hexFromColorName(name),
          ...(img ? { image: img } : {}),
        };
      });
    } else {
      colors = [{ name: "Default", hex: "#808080" }];
    }
    changed = true;
  } else {
    colors = colors.map((c) => {
      const name = String(c?.name || "").trim() || "Default";
      const next = { ...c, name };
      const hex = String(c?.hex || "").trim();
      if (!/^#?[0-9a-f]{6}$/i.test(hex)) {
        next.hex = hexFromColorName(name);
        changed = true;
      } else if (!hex.startsWith("#")) {
        next.hex = `#${hex}`;
        changed = true;
      }
      return next;
    });
  }

  return { colors, changed };
}

function isInvalidBrand(brand) {
  const b = String(brand || "").trim();
  if (!b) return true;
  return /^(n\/?a|na|none|null|undefined|unknown|tbd|test|brand|no brand|-|\.)$/i.test(
    b,
  );
}

/**
 * Prefer an existing brand; otherwise take a leading title token that looks
 * like a brand (Title Case / ALL CAPS word), else MAYCSS.
 */
function ensureBrand(product) {
  const existing = String(product.brand || "").trim();
  if (!isInvalidBrand(existing)) {
    return { brand: existing, changed: false };
  }

  const name = String(product.name || "").trim();
  // "Brand Name Product …" — take 1–3 leading capitalized tokens before a
  // common apparel word, when present.
  const apparelStart =
    /\b(women'?s|mens|petite|plus|maternity|dress|jean|skirt|top|pant|gown|blazer|coat|jacket|sweater|tee|shirt)\b/i;
  const cut = name.search(apparelStart);
  const head = (cut > 0 ? name.slice(0, cut) : name.split(/\s+/).slice(0, 3).join(" "))
    .replace(/[-–—,|:]+$/g, "")
    .trim();

  if (
    head &&
    head.length >= 2 &&
    head.length <= 40 &&
    !/^(the|a|an)$/i.test(head) &&
    /[A-Za-z]/.test(head)
  ) {
    return { brand: head, changed: true };
  }

  return { brand: "MAYCSS", changed: true };
}

function patchProduct(product) {
  const next = { ...product };
  const fixes = [];

  // Brand (GMC required) — before description so generated copy can use it.
  const { brand, changed: brandChanged } = ensureBrand(next);
  if (brandChanged) {
    next.brand = brand;
    fixes.push("missing-brand");
  }

  // Description
  const desc = String(next.description || "").trim();
  if (!desc || desc.length < SHORT_DESC) {
    next.description = generateDescription(next);
    fixes.push(desc ? "short-description" : "missing-description");
  }

  // Colors / variants
  const { colors, changed: colorsChanged } = ensureColors(next);
  if (colorsChanged) {
    next.colors = colors;
    fixes.push("colors-hex");
  }

  // Price — only when missing / zero / invalid. Do NOT cap valid high prices.
  const price = Number(next.price);
  if (!Number.isFinite(price) || price <= 0) {
    next.price = stablePriceUnder100(next);
    fixes.push("invalid-price");
  }

  return { product: next, fixes };
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

async function readBlobJson(pathname) {
  const r = await get(pathname, { access: "public", token, useCache: false });
  return JSON.parse(await new Response(r.stream).text());
}

async function forcePut(pathname, data) {
  const body =
    typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n";
  try {
    await del(pathname, { token });
  } catch {
    // ignore
  }
  await put(pathname, body, {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function mapPool(items, concurrency, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function loadProducts() {
  if (!localOnly && token) {
    console.log("Loading catalog from Blob…");
    return readBlobJson("data/products.json");
  }
  console.log("Loading catalog from local disk…");
  return JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
}

const products = await loadProducts();
console.log(`Loaded ${products.length} products`);

const patched = [];
const fixCounts = {};
let changedCount = 0;

for (const p of products) {
  const { product, fixes } = patchProduct(p);
  patched.push(product);
  if (fixes.length) {
    changedCount += 1;
    for (const f of fixes) fixCounts[f] = (fixCounts[f] || 0) + 1;
  }
}

console.log(
  JSON.stringify(
    { changedProducts: changedCount, fixCounts, dryRun, localOnly },
    null,
    2,
  ),
);

if (dryRun) {
  console.log("Dry run — no writes.");
  process.exit(0);
}

if (changedCount === 0) {
  console.log("No catalog gaps to fix.");
  process.exit(0);
}

const byIdDir = join(root, "data/products/by-id");
mkdirSync(byIdDir, { recursive: true });

writeFileSync(
  join(root, "data/products.json"),
  JSON.stringify(patched, null, 2) + "\n",
);
writeFileSync(
  join(root, "data/products-listing.json"),
  JSON.stringify(patched.map(toListing), null, 2) + "\n",
);

for (const p of patched) {
  writeFileSync(
    join(byIdDir, `${p.id}.json`),
    JSON.stringify(p, null, 2) + "\n",
  );
}
console.log(`Wrote local products.json + ${patched.length} by-id files`);

if (!localOnly && token) {
  console.log("Uploading products.json + listing to Blob…");
  await forcePut("data/products.json", patched);
  await forcePut("data/products-listing.json", patched.map(toListing));

  console.log("Uploading by-id records (concurrency 12)…");
  let done = 0;
  await mapPool(patched, 12, async (p) => {
    await forcePut(`data/products/by-id/${p.id}.json`, p);
    done += 1;
    if (done % 200 === 0 || done === patched.length) {
      console.log(`  by-id ${done}/${patched.length}`);
    }
  });
  console.log("Blob sync complete.");
} else if (!token) {
  console.warn("No BLOB_READ_WRITE_TOKEN — local files only.");
}
