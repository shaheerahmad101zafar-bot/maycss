/**
 * Bulk-import Formal Macy's gowns into products.json + Vercel Blob.
 * Usage: node scripts/bulk-import-formal.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get, put } from "@vercel/blob";

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

const FOCUS = "dresses for women";
const ADDITIONAL = [
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
  "red dress",
  "white mini dress",
  "Shop MayCSS Online Store",
  "formal",
];

const URLS = [
  "https://www.macys.com/shop/product/dress-the-population-womens-charlene-ruffled-high-low-gown?ID=17877462&swatchColor=Mocha",
  "https://www.macys.com/shop/product/adrianna-papell-womens-beaded-one-shoulder-gown?ID=16955328&swatchColor=Midnight",
  "https://www.macys.com/shop/product/mac-duggal-womens-pleated-high-low-gown-with-floral-straps?ID=27364615",
  "https://www.macys.com/shop/product/mac-duggal-womens-one-shoulder-beaded-mesh-gown-with-flower?ID=23173536",
  "https://www.macys.com/shop/product/xscape-womens-one-shoulder-maxi-dress?ID=25717147",
  "https://www.macys.com/shop/product/betsy-adam-womens-arcadia-one-shoulder-side-bow-ball-gown?ID=27151568",
  "https://www.macys.com/shop/product/donna-karan-new-york-womens-draped-faux-wrap-gown?ID=21045767&swatchColor=Nightfall",
  "https://www.macys.com/shop/product/xscape-womens-ruffled-one-shoulder-scuba-gown?ID=18900349&swatchColor=Midnight",
  "https://www.macys.com/shop/product/adrianna-papell-womens-printed-one-shoulder-chiffon-ball-gown?ID=27112664",
  "https://www.macys.com/shop/product/donna-karan-new-york-womens-asymmetric-twist-strapless-gown?ID=21045779",
  "https://www.macys.com/shop/product/betsy-adam-petite-printed-ruffled-halter-gown?ID=17870815&swatchColor=Black/Silver",
  "https://www.macys.com/shop/product/betsy-adam-womens-sleeveless-mock-neck-ball-gown?ID=26036",
  "https://www.macys.com/shop/product/mac-duggal-womens-one-shoulder-draped-gown?ID=11993662",
  "https://www.macys.com/shop/product/needle-thread-womens-mayflower-ditsy-ankle-gown?ID=27871066",
  "https://www.macys.com/shop/product/needle-thread-womens-ethereal-blooms-frill-ankle-gown?ID=26931609&swatchColor=Seashell/multi",
  "https://www.macys.com/shop/product/xscape-womens-ruffle-detail-tiered-maxi-dress?ID=27537419",
  "https://www.macys.com/shop/product/xscape-womens-crisscross-halter-side-ruffled-gown?ID=20809728&swatchColor=Midnight",
  "https://www.macys.com/shop/product/needle-thread-womens-camilles-garden-halter-neck-ankle-gown?ID=27030145&swatchColor=Lavender",
  "https://www.macys.com/shop/product/needle-thread-womens-clover-cape-sleeve-ankle-gown?ID=27108490",
  "https://www.macys.com/shop/product/xscape-womens-long-pleated-halter-neck-ball-gown?ID=25325750",
  "https://www.macys.com/shop/product/xscape-womens-halter-tiered-ruffle-gown?ID=26219394",
  "https://www.macys.com/shop/product/mac-duggal-petite-open-back-high-neck-side-ruched-gown?ID=26912509",
  "https://www.macys.com/shop/product/xscape-womens-one-shoulder-side-ruffle-long-dress?ID=24320976",
  "https://www.macys.com/shop/product/donna-karan-new-york-womens-chiffon-ball-gown?ID=26200188",
  "https://www.macys.com/shop/product/xscape-womens-long-strapless-dress?ID=27872588&swatchColor=Black",
  "https://www.macys.com/shop/product/betsy-adam-womens-strapless-high-low-ball-gown?ID=26202833",
  "https://www.macys.com/shop/product/adrianna-womens-cowl-neck-slit-ball-gown?ID=25837754",
  "https://www.macys.com/shop/product/xscape-womens-ruffle-detail-maxi-dress?ID=25717235",
  "https://www.macys.com/shop/product/mac-duggal-womens-pleated-v-neck-cutout-gown-with-rosette-slit-dress?ID=25894738",
  "https://www.macys.com/shop/product/b-a-by-betsy-adam-womens-keyhole-neck-ball-gown?ID=25717397",
  "https://www.macys.com/shop/product/betsy-adam-womens-one-shoulder-ball-gown?ID=26202839",
  "https://www.macys.com/shop/product/betsy-adam-womens-one-shoulder-draped-evening-gown?ID=27352902&swatchColor=Plum",
  "https://www.macys.com/shop/product/mac-duggal-womens-open-back-high-neck-side-ruched-gown?ID=23563990&swatchColor=Olive",
  "https://www.macys.com/shop/product/mac-duggal-petite-sleeveless-pleated-chiffon-v-neck-gown?ID=25754486&swatchColor=Navy",
  "https://www.macys.com/shop/product/xscape-womens-one-shoulder-sleeveless-gown?ID=26219437",
  "https://www.macys.com/shop/product/mac-duggal-womens-sleeveless-pleated-chiffon-v-neck-gown?ID=25852297&swatchColor=Violet+multi",
  "https://www.macys.com/shop/product/betsy-adam-womens-off-the-shoulder-ruched-long-gown?ID=24968079&swatchColor=Mocha",
  "https://www.macys.com/shop/product/mac-duggal-womens-one-shoulder-boucle-midi-dress-with-3d-flower?ID=25155879",
  "https://www.macys.com/shop/product/mac-duggal-womens-ieena-plum-floral-print-one-sleeve-gown?ID=16515021",
  "https://www.macys.com/shop/product/mac-duggal-womens-one-shoulder-gown-with-sheer-embellished-cut-out?ID=19934938",
  "https://www.macys.com/shop/product/mac-duggal-petite-pleated-one-shoulder-chiffon-gown?ID=25788659&swatchColor=Raspberry",
  "https://www.macys.com/shop/product/betsy-adam-womens-v-neck-printed-ball-gown?ID=25716941&swatchColor=Green+Multi",
  "https://www.macys.com/shop/product/adrianna-papell-womens-asymmetric-metallic-print-mermaid-gown?ID=17472691&swatchColor=Sage/Gold",
  "https://www.macys.com/shop/product/mac-duggal-womens-side-cut-out-one-shoulder-floral-chiffon-gown?ID=26716267",
  "https://www.macys.com/shop/product/betsy-adam-womens-sweetheart-neck-ball-gown-dress?ID=27093570",
  "https://www.macys.com/shop/product/betsy-adam-womens-printed-halter-neck-gown?ID=27548248",
  "https://www.macys.com/shop/product/xscape-womens-v-neck-pleated-sleeveless-gown?ID=27872570&swatchColor=Emerald",
  "https://www.macys.com/shop/product/x-by-xscape-petite-ruffled-off-the-shoulder-gown?ID=7901854",
  "https://www.macys.com/shop/product/betsy-adam-womens-long-chiffon-print-halter-neck-dress?ID=27093569",
];

const IMAGE_BASE = "https://slimages.macysassets.com/is/image/MCY/products/";
const CATEGORY_ID = "cat_formal";

function extractId(url) {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("ID") ?? u.searchParams.get("id");
    if (q && /^\d+$/.test(q)) return q;
  } catch {
    /* ignore */
  }
  return null;
}

function asRecord(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

function macysImageUrl(filePath) {
  return `${IMAGE_BASE}${filePath.replace(/^\/+/, "")}?op_sharpen=1&wid=1200&fmt=jpeg`;
}

function extractJson(text) {
  const start = text.indexOf('{"product"');
  if (start < 0) throw new Error("no json start");
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("unbalanced json");
}

function colorHexFromName(name, swatch) {
  if (swatch && /^#?[0-9a-f]{6}$/i.test(swatch)) {
    return swatch.startsWith("#") ? swatch : `#${swatch}`;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const r = 80 + (hash & 0x7f);
  const g = 80 + ((hash >> 8) & 0x7f);
  const b = 80 + ((hash >> 16) & 0x7f);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function clampChars(text, min, max) {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length > max) {
    t = t.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(t)) t += ".";
  }
  while (t.length < min) {
    t = `${t} Shop MAYCSS Online Store for curated fashion products and dresses for women.`.replace(
      /\s+/g,
      " ",
    );
    if (t.length >= max) {
      t = t.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
      if (!/[.!?]$/.test(t)) t += ".";
      break;
    }
  }
  return t;
}

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildBlocks(name, brand, description, bullets) {
  const kw = FOCUS;
  const b = brand || "MAYCSS";
  const feat = (bullets || []).slice(0, 6).join("; ") || "refined finish and considered design";
  const sections = [
    {
      heading: `About the ${name}`,
      body: `Discover this ${kw} pick from ${b} at MAYCSS. ${description || `${name} is a standout formal silhouette.`} Shop MAYCSS Online Store for fashion products, wedding guest looks, and party-ready dresses for women. Standout details include ${feat}.`,
    },
    {
      heading: `Why this ${kw} piece works`,
      body: `${name} earns its place among cheap online clothing alternatives that still feel elevated. At MAYCSS we curate dresses, plus size clothing options when available, and formal evening wear for women clothes sale moments — from friday sale edits to wedding guest dressing. This gown balances presence with wearability.`,
    },
    {
      heading: `How to style ${name}`,
      body: `Style this ${kw} look with minimal jewellery for cocktail hour, or lean into drama for a red carpet mood. Pair with heels and a clutch for party nights. MAYCSS shoppers also browse summer dress and white mini dress edits nearby — keep accessories clean so the silhouette leads.`,
    },
    {
      heading: `Size, care & materials`,
      body: `Check the size chart before ordering. Follow the care label — many formal gowns prefer spot clean or dry clean. MAYCSS carries fashion products chosen for lasting construction, not just a one-night look.`,
    },
    {
      heading: `Why buy at MAYCSS`,
      body: `Choosing ${name} at MAYCSS means shopping wholesale clothing energy with a curated filter — dresses for women, women clothes, and occasion pieces without the noise. Free returns mindset, clear product details, and SEO-ready pages built for real shoppers.`,
    },
  ];
  const blocks = sections.map((s) => ({
    id: rid("blk"),
    type: "richtext",
    heading: s.heading,
    headingLevel: 2,
    body: s.body,
    alignment: "left",
  }));
  blocks.push({
    id: rid("faq"),
    type: "faq",
    items: [
      {
        q: `Is ${name} good for a wedding guest?`,
        a: `Yes — this ${kw} silhouette works for wedding guest, party, and formal evenings. Confirm length and neckline against the dress code.`,
      },
      {
        q: `Does MAYCSS offer returns?`,
        a: `Unworn items can typically be returned within 30 days. See our refund policy for details.`,
      },
    ],
  });
  return blocks;
}

async function fetchMacys(id) {
  const api =
    `https://www.macys.com/xapi/digital/v1/product/${id}` +
    `?currencyCode=USD&_regionCode=US`;
  try {
    const res = await fetch(api, {
      headers: {
        Accept: "application/json",
        Referer: "https://www.macys.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(18000),
    });
    if (res.ok) return await res.json();
  } catch {
    /* fall through */
  }
  const jina = `https://r.jina.ai/http://www.macys.com/xapi/digital/v1/product/${id}?currencyCode=USD&_regionCode=US`;
  const res = await fetch(jina, {
    headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`jina ${res.status}`);
  return extractJson(await res.text());
}

function parseProduct(data, sourceUrl) {
  const product = asRecord(Array.isArray(data.product) ? data.product[0] : null);
  if (!product) throw new Error("no product node");
  const detail = asRecord(product.detail) ?? {};
  const brandObj = asRecord(detail.brand);
  const brand = typeof brandObj?.name === "string" ? brandObj.name.trim() : undefined;
  const completeName =
    typeof detail.completeName === "string" ? detail.completeName.trim() : "";
  const shortName = typeof detail.name === "string" ? detail.name.trim() : "";
  const name =
    completeName ||
    (brand && shortName ? `${brand} ${shortName}` : shortName) ||
    "Imported gown";

  const bullets = Array.isArray(detail.bulletText)
    ? detail.bulletText.map((b) => String(b).trim()).filter(Boolean)
    : [];
  const rawDesc =
    (typeof detail.description === "string" && detail.description.trim()) ||
    (bullets.length ? bullets.join(". ") : "");

  // pricing
  let price;
  let originalPrice;
  const pricing = asRecord(product.pricing);
  const priceRoot = asRecord(pricing?.price);
  const tiered = Array.isArray(priceRoot?.tieredPrice) ? priceRoot.tieredPrice : [];
  for (const tier of tiered) {
    const values = Array.isArray(asRecord(tier)?.values) ? asRecord(tier).values : [];
    for (const v of values) {
      const row = asRecord(v);
      const value = Number(row?.value);
      const type = String(row?.type ?? "").toLowerCase();
      if (!Number.isFinite(value) || value <= 0) continue;
      if (type === "regular" || type === "original" || type === "was") {
        originalPrice = originalPrice ?? value;
      } else if (type === "discount" || type === "sale" || type === "edv") {
        price = price ?? value;
      } else price = price ?? value;
    }
  }
  if (price == null && originalPrice != null) price = originalPrice;
  if (originalPrice != null && price != null && originalPrice <= price) {
    originalPrice = undefined;
  }

  const traits = asRecord(product.traits);
  const sizeMap = asRecord(asRecord(traits?.sizes)?.sizeMap) ?? {};
  const sizes = Object.values(sizeMap)
    .map((s) => String(asRecord(s)?.displayName ?? asRecord(s)?.name ?? "").trim())
    .filter(Boolean);

  const colorMap = asRecord(asRecord(traits?.colors)?.colorMap) ?? {};
  const colors = [];
  const colorImages = {};
  const extractUrls = (nodes) => {
    const out = [];
    const seen = new Set();
    for (const node of nodes || []) {
      const row = asRecord(node);
      const fp =
        (typeof row?.filePath === "string" && row.filePath) ||
        (typeof row?.path === "string" && row.path) ||
        "";
      if (!fp) continue;
      const src = macysImageUrl(fp);
      if (seen.has(src)) continue;
      seen.add(src);
      out.push(src);
    }
    return out;
  };

  for (const colorVal of Object.values(colorMap)) {
    const row = asRecord(colorVal);
    const cname = String(row?.name ?? row?.normalName ?? "").trim();
    if (!cname) continue;
    const swatch =
      (typeof row?.swatchColor === "string" && row.swatchColor) ||
      (typeof row?.hexCode === "string" && row.hexCode) ||
      "";
    colors.push({ name: cname, hex: colorHexFromName(cname, swatch) });
    const urls = extractUrls(asRecord(row?.imagery)?.images);
    if (urls.length) {
      colorImages[cname] = {
        image: urls[0],
        gallery: urls.length > 1 ? urls.slice(1) : undefined,
      };
    }
  }

  const productUrls = extractUrls(asRecord(product.imagery)?.images);
  const firstColor = colors[0]?.name;
  const firstSet = firstColor ? colorImages[firstColor] : undefined;
  const image = firstSet?.image ?? productUrls[0] ?? "";
  const gallery = firstSet?.gallery ?? (productUrls.length > 1 ? productUrls.slice(1) : undefined);

  const specs = bullets.slice(0, 12).map((line, i) => {
    const split = line.match(/^([^:：-]{2,40})\s*[:：-]\s*(.+)$/);
    if (split) return { label: split[1].trim(), value: split[2].trim() };
    if (/polyester|silk|chiffon|cotton|nylon/i.test(line)) {
      return { label: "Material", value: line.replace(/\.$/, "") };
    }
    if (/clean|wash|dry|care/i.test(line)) {
      return { label: "Care", value: line.replace(/\.$/, "") };
    }
    return { label: `Detail ${i + 1}`, value: line.replace(/\.$/, "") };
  });

  const description =
    `${rawDesc}\n\nShop dresses for women at MAYCSS — curated fashion products for wedding guest, party, and formal occasions.`.trim();

  const metaTitle = clampChars(`${FOCUS} · ${brand || "MAYCSS"}`, 30, 60);
  const metaDescription = clampChars(
    `Shop ${FOCUS} at MAYCSS Online Store. ${name}. Wholesale clothing energy with curated evening gowns, party looks, and wedding guest dresses.`,
    120,
    160,
  );

  const onSale =
    typeof originalPrice === "number" &&
    typeof price === "number" &&
    originalPrice > price;

  return {
    name,
    brand,
    image,
    gallery,
    price: price ?? 0,
    originalPrice,
    badge: onSale ? "Sale" : undefined,
    description,
    categoryId: CATEGORY_ID,
    category: "Formal",
    sizes: sizes.length ? sizes : undefined,
    colors: colors.length ? colors : undefined,
    colorImages: Object.keys(colorImages).length ? colorImages : undefined,
    specs: specs.length ? specs : undefined,
    status: "published",
    sourceUrl,
    contentBlocks: buildBlocks(name, brand, description, bullets),
    seo: {
      focusKeyword: FOCUS,
      keywords: ADDITIONAL,
      metaTitle,
      metaDescription,
      ogImage: image || undefined,
    },
  };
}

async function readBlobJson(pathname, fallback) {
  try {
    const result = await get(pathname, {
      access: "public",
      token,
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeBlobJson(pathname, data) {
  const body = JSON.stringify(data, null, 2) + "\n";
  await put(pathname, body, {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const uniqueUrls = [...new Set(URLS.map((u) => u.trim()).filter(Boolean))];
console.log(`Importing ${uniqueUrls.length} Formal products…`);

let products = await readBlobJson("data/products.json", null);
if (!Array.isArray(products)) {
  products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
}
console.log(`Existing catalog: ${products.length}`);

const existingSources = new Set(
  products.map((p) => String(p.sourceUrl || "")).filter(Boolean),
);
const existingIds = products
  .map((p) => Number(p.id))
  .filter((n) => Number.isFinite(n));
let nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1;

const created = [];
const skipped = [];
const failed = [];

for (let i = 0; i < uniqueUrls.length; i++) {
  const url = uniqueUrls[i];
  const id = extractId(url);
  process.stdout.write(`[${i + 1}/${uniqueUrls.length}] ID=${id} `);
  if (!id) {
    console.log("SKIP no id");
    failed.push({ url, error: "no id" });
    continue;
  }
  // Skip if same Macys product id already imported
  const already = products.some(
    (p) =>
      String(p.sourceUrl || "").includes(`ID=${id}`) ||
      String(p.sourceUrl || "").includes(`id=${id}`),
  );
  if (already || existingSources.has(url)) {
    console.log("SKIP already imported");
    skipped.push(url);
    continue;
  }

  try {
    const data = await fetchMacys(id);
    const partial = parseProduct(data, url);
    if (!partial.image || !(partial.price > 0)) {
      throw new Error(
        `incomplete price=${partial.price} image=${Boolean(partial.image)}`,
      );
    }
    const product = { id: nextId++, ...partial };
    products.push(product);
    created.push(product);
    existingSources.add(url);
    console.log(`OK ${product.name.slice(0, 50)} $${product.price}`);
  } catch (err) {
    console.log(`FAIL ${err instanceof Error ? err.message : err}`);
    failed.push({
      url,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  await sleep(700);
}

writeFileSync(
  join(root, "data/products.json"),
  JSON.stringify(products, null, 2) + "\n",
);
console.log(`\nLocal products.json written (${products.length} total)`);

await writeBlobJson("data/products.json", products);
console.log("Blob products.json synced");

// Per-id records for new products
for (const p of created) {
  await writeBlobJson(`data/products/by-id/${p.id}.json`, p);
}
console.log(`Blob by-id records: ${created.length}`);

// Categories (with Formal)
const cats = JSON.parse(readFileSync(join(root, "data/categories.json"), "utf8"));
await writeBlobJson("data/categories.json", cats);
console.log("Blob categories.json synced (Formal included)");

console.log("\n=== SUMMARY ===");
console.log(`Created: ${created.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) {
  for (const f of failed) console.log(" -", f.error, f.url);
}
