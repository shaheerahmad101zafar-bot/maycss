/**
 * Import latest Macy's products into MAYCSS categories via Discover + product XAPI.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... node scripts/bulk-import-macys-categories.mjs
 *   BLOB_READ_WRITE_TOKEN=... node scripts/bulk-import-macys-categories.mjs --only=formal
 *   BLOB_READ_WRITE_TOKEN=... node scripts/bulk-import-macys-categories.mjs --target=250
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, get, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const IMAGE_BASE = "https://slimages.macysassets.com/is/image/MCY/products/";

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

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const targetArg = args.find((a) => a.startsWith("--target="));
const ONLY = onlyArg ? onlyArg.split("=")[1] : null;
const TARGET = Number(targetArg?.split("=")[1] || 250);

/** @type {Array<{key:string, categoryId:string, categoryName:string, pathname:string, macysId:string, focus:string, keywords:string[]}>} */
const JOBS = [
  {
    key: "womens-clothing",
    categoryId: "cat_womens_clothing",
    categoryName: "Women's Clothing",
    pathname: "/shop/womens/clothing",
    macysId: "188851",
    focus: "women's clothing",
    keywords: [
      "women's clothing",
      "MAYCSS",
      "fashion products",
      "Black Friday",
      "wholesale clothing",
      "Shop MayCSS Online Store",
    ],
  },
  {
    key: "womens-dresses",
    categoryId: "cat_womens_dresses",
    categoryName: "Women's Dresses",
    pathname: "/shop/womens/clothing/dresses",
    macysId: "5449",
    focus: "women's dresses",
    keywords: [
      "women's dresses",
      "dresses for women",
      "MAYCSS",
      "Black Friday",
      "Shop MayCSS Online Store",
    ],
  },
  {
    key: "formal",
    categoryId: "cat_formal",
    categoryName: "Formal",
    pathname: "/shop/womens/clothing/dresses/formal",
    macysId: "339414",
    focus: "formal dresses",
    keywords: [
      "formal",
      "dresses for women",
      "evening gown",
      "MAYCSS",
      "Black Friday",
      "wedding guest",
      "party",
    ],
  },
  {
    key: "wedding-guest",
    categoryId: "cat_wedding_guest",
    categoryName: "Wedding Guest",
    pathname: "/shop/womens/clothing/dresses/occasion/wedding-guest",
    macysId: "280756",
    focus: "wedding guest dresses",
    keywords: [
      "wedding guest",
      "dresses for women",
      "MAYCSS",
      "occasion dress",
      "Black Friday",
    ],
  },
  {
    key: "cocktail-party",
    categoryId: "cat_cocktail_party",
    categoryName: "Cocktail & Party",
    pathname: "/shop/womens/clothing/dresses/cocktail-party",
    macysId: "339107",
    focus: "cocktail dresses",
    keywords: [
      "cocktail",
      "party",
      "party dresses",
      "MAYCSS",
      "Black Friday",
    ],
  },
  {
    key: "day",
    categoryId: "cat_day",
    categoryName: "Day",
    pathname: "/shop/womens/clothing/dresses/day",
    macysId: "5449",
    focus: "day dresses",
    keywords: ["day dress", "dresses for women", "MAYCSS", "Black Friday"],
  },
  {
    key: "casual",
    categoryId: "cat_casual",
    categoryName: "Casual",
    pathname: "/shop/womens/clothing/dresses/casual",
    macysId: "298457",
    focus: "casual dresses",
    keywords: ["casual", "dresses for women", "MAYCSS", "Black Friday"],
  },
  {
    key: "work",
    categoryId: "cat_work",
    categoryName: "Work",
    pathname: "/shop/womens/clothing/dresses/work",
    macysId: "339346",
    focus: "work dresses",
    keywords: [
      "work",
      "womens work clothes",
      "office dress",
      "MAYCSS",
      "Black Friday",
    ],
  },
  {
    key: "womens-jeans",
    categoryId: "cat_womens_jeans",
    categoryName: "Women's Jeans & Denim",
    pathname: "/shop/womens/clothing/jeans",
    macysId: "3111",
    focus: "women's jeans",
    keywords: ["jeans", "denim", "women jeans", "MAYCSS", "Black Friday"],
  },
  {
    key: "wide-leg",
    categoryId: "cat_jeans_wide_leg",
    categoryName: "Wide-Leg Jeans",
    pathname: "/shop/womens/clothing/jeans/wide-leg",
    macysId: "339584",
    focus: "wide-leg jeans",
    keywords: ["wide-leg jeans", "jeans", "denim", "MAYCSS", "Black Friday"],
  },
  {
    key: "straight",
    categoryId: "cat_jeans_straight",
    categoryName: "Straight",
    pathname: "/shop/womens/clothing/jeans/straight-leg",
    macysId: "72589",
    focus: "straight leg jeans",
    keywords: [
      "straight leg jeans",
      "jeans",
      "denim",
      "MAYCSS",
      "Black Friday",
    ],
  },
  {
    key: "barrel",
    categoryId: "cat_jeans_barrel",
    categoryName: "Barrel",
    pathname: "/shop/womens/clothing/jeans/barrel-leg",
    macysId: "350066",
    focus: "barrel jeans",
    keywords: ["barrel jeans", "jeans", "denim", "MAYCSS", "Black Friday"],
  },
  {
    key: "flare-bootcut",
    categoryId: "cat_jeans_flare_bootcut",
    categoryName: "Flare & Bootcut",
    pathname: "/shop/womens/clothing/jeans/bootcut",
    macysId: "3111",
    focus: "flare jeans",
    keywords: [
      "flare jeans",
      "bootcut jeans",
      "jeans",
      "denim",
      "MAYCSS",
      "Black Friday",
    ],
  },
  {
    key: "skinny",
    categoryId: "cat_jeans_skinny",
    categoryName: "Skinny",
    pathname: "/shop/womens/clothing/jeans/skinny",
    macysId: "66442",
    focus: "skinny jeans",
    keywords: ["skinny jeans", "black jeans", "jeans", "MAYCSS", "Black Friday"],
  },
];

function asRecord(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

function macysImageUrl(filePath) {
  return `${IMAGE_BASE}${filePath.replace(/^\/+/, "")}?op_sharpen=1&wid=1200&fmt=jpeg`;
}

function clampChars(text, min, max) {
  let t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + "…";
  if (t.length < min) t = (t + " · MAYCSS curated fashion").slice(0, max);
  return t;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJson(text) {
  let start = text.indexOf('{"product"');
  if (start < 0) start = text.indexOf("{");
  if (start < 0) return null;
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
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function putJson(pathname, data) {
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

async function forcePut(pathname, data) {
  try {
    await del(pathname, { token });
  } catch {
    /* ignore */
  }
  await putJson(pathname, data);
}

async function readBlobOrLocal(pathname, fallback) {
  try {
    const result = await get(pathname, {
      access: "public",
      token,
      useCache: false,
    });
    if (result?.stream) {
      return JSON.parse(await new Response(result.stream).text());
    }
  } catch {
    /* ignore */
  }
  try {
    return JSON.parse(readFileSync(join(root, pathname), "utf8"));
  } catch {
    return fallback;
  }
}

async function collectProductIds(pathname, macysId, needed) {
  const ids = [];
  const seen = new Set();
  let page = 1;
  while (ids.length < needed && page <= 12) {
    const path = page > 1 ? `${pathname}/Pageindex/${page}` : pathname;
    const qs =
      `pathname=${encodeURIComponent(path)}` +
      `&id=${macysId}` +
      `&_navigationType=BROWSE&_regionCode=US&currencyCode=USD&sortBy=NEW_ITEMS`;
    const urls = [
      `https://r.jina.ai/http://www.macys.com/xapi/discover/v1/page?${qs}`,
      `https://www.macys.com/xapi/discover/v1/page?${qs}`,
    ];
    let pageIds = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json,text/plain,*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(45000),
        });
        const text = await res.text();
        pageIds = [
          ...new Set(
            [...text.matchAll(/"productId"\s*:\s*"?(\d{6,})"?/g)].map(
              (m) => m[1],
            ),
          ),
        ];
        if (pageIds.length) break;
      } catch {
        /* try next */
      }
    }
    if (!pageIds.length) {
      console.log(`  discover page ${page}: 0 ids — stop`);
      break;
    }
    for (const id of pageIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= needed) break;
    }
    console.log(`  discover page ${page}: +${pageIds.length} (have ${ids.length})`);
    page += 1;
    await sleep(900);
  }
  return ids;
}

async function fetchMacysProduct(id) {
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
  const headers = { Accept: "text/plain", "User-Agent": "Mozilla/5.0" };
  if (process.env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  }
  const res = await fetch(jina, {
    headers,
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`jina ${res.status}`);
  const parsed = extractJson(await res.text());
  if (!parsed) throw new Error("jina parse fail");
  return parsed;
}

function parseProduct(data, sourceUrl, job) {
  const product = asRecord(Array.isArray(data.product) ? data.product[0] : null);
  if (!product) throw new Error("no product node");
  const detail = asRecord(product.detail) ?? {};
  const brandObj = asRecord(detail.brand);
  const brand =
    typeof brandObj?.name === "string" ? brandObj.name.trim() : undefined;
  const completeName =
    typeof detail.completeName === "string" ? detail.completeName.trim() : "";
  const shortName = typeof detail.name === "string" ? detail.name.trim() : "";
  const name =
    completeName ||
    (brand && shortName ? `${brand} ${shortName}` : shortName) ||
    "Imported product";

  const bullets = Array.isArray(detail.bulletText)
    ? detail.bulletText.map((b) => String(b).trim()).filter(Boolean)
    : [];
  const rawDesc =
    (typeof detail.description === "string" && detail.description.trim()) ||
    (bullets.length ? bullets.join(". ") : "");

  let price;
  let originalPrice;
  const pricing = asRecord(product.pricing);
  const priceRoot = asRecord(pricing?.price);
  const tiered = Array.isArray(priceRoot?.tieredPrice)
    ? priceRoot.tieredPrice
    : [];
  for (const tier of tiered) {
    const values = Array.isArray(asRecord(tier)?.values)
      ? asRecord(tier).values
      : [];
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
    .map((s) =>
      String(asRecord(s)?.displayName ?? asRecord(s)?.name ?? "").trim(),
    )
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
    const colorName = String(
      row?.name ?? row?.normalName ?? row?.displayName ?? "",
    ).trim();
    if (!colorName) continue;
    const hex =
      typeof row?.swatchColor === "string"
        ? row.swatchColor
        : typeof row?.hexColor === "string"
          ? row.hexColor
          : undefined;
    const imagery = asRecord(row?.imagery) ?? {};
    const urls = extractUrls([
      ...(Array.isArray(imagery.images) ? imagery.images : []),
      imagery.primaryImage,
      ...(Array.isArray(row?.images) ? row.images : []),
    ].filter(Boolean));
    const swatchPath =
      (typeof row?.swatchSprite?.filePath === "string" &&
        row.swatchSprite.filePath) ||
      (typeof row?.swatchImage?.filePath === "string" &&
        row.swatchImage.filePath) ||
      "";
    colors.push({
      name: colorName,
      hex: hex?.startsWith("#") ? hex : hex ? `#${hex}` : undefined,
      image: urls[0] || (swatchPath ? macysImageUrl(swatchPath) : undefined),
    });
    if (urls.length) {
      colorImages[colorName] = { image: urls[0], gallery: urls };
    }
  }

  const imagery = asRecord(product.imagery) ?? asRecord(detail.imagery) ?? {};
  let gallery = extractUrls([
    ...(Array.isArray(imagery.images) ? imagery.images : []),
    imagery.primaryImage,
  ].filter(Boolean));
  if (!gallery.length) {
    for (const g of Object.values(colorImages)) {
      if (g.gallery?.length) {
        gallery = g.gallery;
        break;
      }
    }
  }
  const image = gallery[0] || colors.find((c) => c.image)?.image;
  if (!image) throw new Error("no image");
  if (!(price > 0)) throw new Error(`bad price ${price}`);

  // Prefer first color's gallery as default when present (avoids color mismatch)
  const primaryColor = colors[0]?.name;
  const primarySet = primaryColor ? colorImages[primaryColor] : null;
  const finalImage = primarySet?.image || image;
  const finalGallery = primarySet?.gallery?.length ? primarySet.gallery : gallery;

  const onSale =
    typeof originalPrice === "number" &&
    typeof price === "number" &&
    originalPrice > price;

  const description =
    `${rawDesc}\n\nShop ${job.focus} at MAYCSS — curated fashion for Black Friday and every season.`.trim();

  return {
    name,
    brand,
    image: finalImage,
    gallery: finalGallery,
    price,
    originalPrice,
    badge: onSale ? "Black Friday" : "New",
    description,
    categoryId: job.categoryId,
    category: job.categoryName,
    sizes: sizes.length ? sizes : undefined,
    colors: colors.length ? colors : undefined,
    colorImages: Object.keys(colorImages).length ? colorImages : undefined,
    status: "published",
    sourceUrl,
    contentBlocks: [
      {
        id: `blk_${Date.now().toString(36)}_rich`,
        type: "richtext",
        heading: name,
        headingLevel: 2,
        body: description,
      },
    ],
    seo: {
      focusKeyword: job.focus,
      keywords: job.keywords,
      metaTitle: clampChars(`${job.focus} · ${brand || "MAYCSS"}`, 30, 60),
      metaDescription: clampChars(
        `Shop ${job.focus} at MAYCSS Online Store. ${name}. Black Friday deals on curated fashion.`,
        120,
        160,
      ),
      ogImage: finalImage,
    },
  };
}

function macysSourceId(product) {
  const m = String(product.sourceUrl || "").match(/[?&]ID=(\d+)/i);
  return m?.[1] || null;
}

async function persist(products) {
  mkdirSync(join(root, "data/products/by-id"), { recursive: true });
  writeFileSync(
    join(root, "data/products.json"),
    JSON.stringify(products, null, 2) + "\n",
  );
  await forcePut("data/products.json", products);
}

const jobs = ONLY ? JOBS.filter((j) => j.key === ONLY) : JOBS;
if (!jobs.length) {
  console.error("No jobs matched --only");
  process.exit(1);
}

let products = await readBlobOrLocal("data/products.json", []);
if (!Array.isArray(products)) products = [];
const categories = JSON.parse(
  readFileSync(join(root, "data/categories.json"), "utf8"),
);
await forcePut("data/categories.json", categories);

let nextId =
  products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;

console.log(
  `Starting import. Existing products: ${products.length}. Jobs: ${jobs.map((j) => j.key).join(", ")}. Target/category: ${TARGET}`,
);

for (const job of jobs) {
  const alreadyInCat = products.filter((p) => p.categoryId === job.categoryId);
  const need = Math.max(0, TARGET - alreadyInCat.length);
  console.log(
    `\n=== ${job.categoryName} (${job.key}) have=${alreadyInCat.length} need=${need}`,
  );
  if (need === 0) {
    console.log("  target met — skip");
    continue;
  }

  const macysIds = await collectProductIds(job.pathname, job.macysId, need + 40);
  if (!macysIds.length) {
    console.log("  FAIL: no listing ids");
    continue;
  }

  let created = 0;
  let failed = 0;
  let skipped = 0;

  for (const mid of macysIds) {
    if (created >= need) break;
    const sourceUrl = `https://www.macys.com/shop/product/?ID=${mid}`;
    const exists = products.some((p) => macysSourceId(p) === mid);
    if (exists) {
      skipped += 1;
      continue;
    }
    process.stdout.write(`  [${created + 1}/${need}] ID=${mid} `);
    try {
      const data = await fetchMacysProduct(mid);
      const partial = parseProduct(data, sourceUrl, job);
      const product = { id: nextId++, ...partial };
      products.push(product);
      created += 1;
      writeFileSync(
        join(root, `data/products/by-id/${product.id}.json`),
        JSON.stringify(product, null, 2) + "\n",
      );
      await putJson(`data/products/by-id/${product.id}.json`, product);
      console.log(`OK ${product.name.slice(0, 48)} $${product.price}`);
      if (created % 10 === 0) {
        await persist(products);
        console.log(`  checkpoint ${products.length} products`);
      }
    } catch (err) {
      failed += 1;
      console.log(`FAIL ${err instanceof Error ? err.message : err}`);
    }
    await sleep(750);
  }

  await persist(products);
  console.log(
    `  done ${job.key}: created=${created} skipped=${skipped} failed=${failed} catalog=${products.length}`,
  );
}

await persist(products);
console.log(`\nALL DONE. Total products: ${products.length}`);
const byCat = {};
for (const p of products) {
  byCat[p.categoryId || "none"] = (byCat[p.categoryId || "none"] || 0) + 1;
}
console.log(byCat);
