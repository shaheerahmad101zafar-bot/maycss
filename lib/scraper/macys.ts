import "server-only";

import type { ScrapedProduct } from "./types";

const MACYS_HOST = /(^|\.)macys\.com$/i;
const IMAGE_BASE = "https://slimages.macysassets.com/is/image/MCY/products/";

export function isMacysUrl(url: string): boolean {
  try {
    return MACYS_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Extract numeric product ID from common Macy's URL shapes. */
export function extractMacysProductId(url: string): string | null {
  try {
    const u = new URL(url);
    const fromQuery = u.searchParams.get("ID") ?? u.searchParams.get("id");
    if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;

    // /shop/product/foo/ID/12345678 or ...?ID= in odd places
    const pathId = u.pathname.match(/\/ID\/(\d{6,})/i);
    if (pathId) return pathId[1];

    const pathMatch = u.href.match(/[?&#]ID=(\d{6,})/i);
    if (pathMatch) return pathMatch[1];

    const idInPath = u.pathname.match(/\/(\d{7,})(?:\/|$)/);
    if (idInPath) return idInPath[1];

    return null;
  } catch {
    return null;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function macysImageUrl(filePath: string): string {
  const clean = filePath.replace(/^\/+/, "");
  return `${IMAGE_BASE}${clean}?op_sharpen=1&wid=1200&fmt=jpeg`;
}

function sortSizes(sizes: string[]): string[] {
  const numeric = sizes.every((s) => /^-?\d+(\.\d+)?$/.test(s.trim()));
  if (!numeric) return [...sizes].sort((a, b) => a.localeCompare(b));
  return [...sizes].sort((a, b) => Number(a) - Number(b));
}

/** Pull a JSON object out of raw text or Jina markdown wrappers. */
function extractJsonPayload(text: string): unknown | null {
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

async function fetchMacysXapiJson(id: string): Promise<unknown | null> {
  const apiUrl =
    `https://www.macys.com/xapi/digital/v1/product/${id}` +
    `?currencyCode=USD&_regionCode=US`;

  const headers: Record<string, string> = {
    Accept: "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.macys.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  };

  // 1) Direct — works from many Vercel regions.
  try {
    const res = await fetch(apiUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(18_000),
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
    console.warn(`[scraper:macys] direct xapi ${res.status} for ${id}`);
  } catch (err) {
    console.warn(
      `[scraper:macys] direct xapi error for ${id}:`,
      err instanceof Error ? err.message : err,
    );
  }

  // 2) Jina Reader — bypasses Akamai 403 that blocks many datacenter IPs.
  const jinaTargets = [
    `https://r.jina.ai/http://www.macys.com/xapi/digital/v1/product/${id}?currencyCode=USD&_regionCode=US`,
    `https://r.jina.ai/https://www.macys.com/xapi/digital/v1/product/${id}?currencyCode=USD&_regionCode=US`,
  ];
  for (const jinaUrl of jinaTargets) {
    try {
      const jinaHeaders: Record<string, string> = {
        Accept: "text/plain",
        "User-Agent": headers["User-Agent"],
      };
      if (process.env.JINA_API_KEY) {
        jinaHeaders.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
      }
      const res = await fetch(jinaUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(35_000),
        headers: jinaHeaders,
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[scraper:macys] jina xapi ${res.status} for ${id}`);
        continue;
      }
      const text = await res.text();
      const parsed = extractJsonPayload(text);
      if (parsed) {
        console.log(`[scraper:macys] recovered product ${id} via Jina XAPI`);
        return parsed;
      }
    } catch (err) {
      console.warn(
        `[scraper:macys] jina xapi error for ${id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return null;
}

function collectTier(node: unknown, into: unknown[] = [], depth = 0): unknown[] {
  if (!node || depth > 6) return into;
  if (Array.isArray(node)) {
    for (const item of node) collectTier(item, into, depth + 1);
    return into;
  }
  if (typeof node !== "object") return into;
  const rec = node as Record<string, unknown>;
  if (Array.isArray(rec.tieredPrice)) into.push(...rec.tieredPrice);
  for (const v of Object.values(rec)) {
    if (v && typeof v === "object") collectTier(v, into, depth + 1);
  }
  return into;
}

function parsePricing(product: Record<string, unknown>): {
  price?: number;
  originalPrice?: number;
} {
  const pricing = asRecord(product.pricing);
  const priceRoot = asRecord(pricing?.price);
  const tiered = [
    ...(Array.isArray(priceRoot?.tieredPrice) ? priceRoot!.tieredPrice : []),
    ...collectTier(product),
  ];

  let price: number | undefined;
  let originalPrice: number | undefined;
  const saleTypes = new Set(["discount", "sale", "edv", "onsale", "now"]);
  const regularTypes = new Set(["regular", "original", "was", "list"]);

  for (const tier of tiered) {
    const t = asRecord(tier);
    const values = Array.isArray(t?.values) ? t!.values : [];
    for (const v of values) {
      const row = asRecord(v);
      const value = Number(row?.value);
      const type = String(row?.type ?? "").toLowerCase();
      if (!Number.isFinite(value) || value <= 0) continue;
      if (regularTypes.has(type)) originalPrice = originalPrice ?? value;
      else if (saleTypes.has(type)) price = price ?? value;
      else price = price ?? value;
    }
  }

  // Fallbacks seen on some Macys payloads
  const flat = Number(
    priceRoot?.price ?? priceRoot?.finalPrice ?? pricing?.price,
  );
  if (price == null && Number.isFinite(flat) && flat > 0) price = flat;

  if (price == null && originalPrice != null) price = originalPrice;
  if (originalPrice != null && price != null && originalPrice <= price) {
    originalPrice = undefined;
  }
  return { price, originalPrice };
}

function colorHexFromName(name: string, swatch?: string): string {
  if (swatch && /^#?[0-9a-f]{6}$/i.test(swatch)) {
    return swatch.startsWith("#") ? swatch : `#${swatch}`;
  }
  // Deterministic pastel-ish hex so the Colors field is never blank.
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const r = 80 + (hash & 0x7f);
  const g = 80 + ((hash >> 8) & 0x7f);
  const b = 80 + ((hash >> 16) & 0x7f);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Macy's HTML pages are bot-blocked (Akamai). Public XAPI still has the
 * product JSON — fetch direct, then via Jina when datacenter IPs get 403.
 */
export async function scrapeMacysProduct(
  url: string,
): Promise<Partial<ScrapedProduct> | null> {
  if (!isMacysUrl(url)) return null;
  const id = extractMacysProductId(url);
  if (!id) return null;

  try {
    const data = await fetchMacysXapiJson(id);
    if (!data) return null;

    const root = asRecord(data);
    const list = Array.isArray(root?.product) ? root!.product : null;
    const product = asRecord(list?.[0]);
    if (!product) return null;

    const detail = asRecord(product.detail) ?? {};
    const brandObj = asRecord(detail.brand);
    const brand =
      typeof brandObj?.name === "string" ? brandObj.name.trim() : undefined;

    const completeName =
      typeof detail.completeName === "string" ? detail.completeName.trim() : "";
    const shortName =
      typeof detail.name === "string" ? detail.name.trim() : "";
    const name =
      completeName ||
      (brand && shortName ? `${brand} ${shortName}` : shortName) ||
      undefined;

    const bullets = Array.isArray(detail.bulletText)
      ? detail.bulletText.map((b) => String(b).trim()).filter(Boolean)
      : [];

    const rawDescription =
      typeof detail.description === "string" ? detail.description.trim() : "";
    const secondary =
      typeof detail.secondaryDescription === "string"
        ? detail.secondaryDescription.trim()
        : "";
    const description =
      rawDescription ||
      secondary ||
      (bullets.length ? bullets.join(". ").replace(/\.\./g, ".") : undefined);

    const processed = asRecord(detail.processedProdDesc);
    const sizeAndFit = Array.isArray(processed?.sizeAndFit)
      ? processed!.sizeAndFit.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const { price, originalPrice } = parsePricing(product);

    // Sizes
    const traits = asRecord(product.traits);
    const sizesRoot = asRecord(traits?.sizes);
    const sizeMap = asRecord(sizesRoot?.sizeMap) ?? {};
    const sizes = sortSizes(
      Object.values(sizeMap)
        .map((s) => {
          const row = asRecord(s);
          return String(row?.displayName ?? row?.name ?? "").trim();
        })
        .filter(Boolean),
    );

    // Colors (+ hex) and per-color image galleries
    const colorsRoot = asRecord(traits?.colors);
    const colorMap = asRecord(colorsRoot?.colorMap) ?? {};
    const colors: string[] = [];
    const colorHex: string[] = [];
    const colorImages: NonNullable<ScrapedProduct["colorImages"]> = {};

    const extractImageUrls = (nodes: unknown[]): string[] => {
      const out: string[] = [];
      const seenLocal = new Set<string>();
      for (const node of nodes) {
        const row = asRecord(node);
        const filePath =
          (typeof row?.filePath === "string" && row.filePath) ||
          (typeof row?.path === "string" && row.path) ||
          "";
        if (!filePath) continue;
        const src = macysImageUrl(filePath);
        if (seenLocal.has(src)) continue;
        seenLocal.add(src);
        out.push(src);
      }
      return out;
    };

    for (const colorVal of Object.values(colorMap)) {
      const row = asRecord(colorVal);
      const cname = String(row?.name ?? row?.normalName ?? "").trim();
      if (!cname) continue;
      colors.push(cname);
      const swatch =
        (typeof row?.swatchColor === "string" && row.swatchColor) ||
        (typeof row?.hexCode === "string" && row.hexCode) ||
        (typeof asRecord(row?.imagery)?.swatchColor === "string"
          ? String(asRecord(row?.imagery)!.swatchColor)
          : "") ||
        "";
      colorHex.push(colorHexFromName(cname, swatch));

      const colorImagery = asRecord(row?.imagery);
      const colorNodes = Array.isArray(colorImagery?.images)
        ? colorImagery!.images
        : [];
      const colorUrls = extractImageUrls(colorNodes);
      if (colorUrls.length > 0) {
        colorImages[cname] = {
          image: colorUrls[0],
          gallery: colorUrls.length > 1 ? colorUrls.slice(1) : undefined,
        };
      }
    }

    // Product-level images as fallback / default gallery
    const productImagery = asRecord(product.imagery);
    const productUrls = extractImageUrls(
      Array.isArray(productImagery?.images) ? productImagery!.images : [],
    );

    // Prefer selected color's set as the primary `images` list so the PDP
    // default matches what Macy's shows first.
    const selectedColorId = colorsRoot?.selectedColor;
    const selectedColor = asRecord(
      selectedColorId != null
        ? colorMap[String(selectedColorId)]
        : Object.values(colorMap)[0],
    );
    const selectedName = String(
      selectedColor?.name ?? selectedColor?.normalName ?? colors[0] ?? "",
    ).trim();
    const selectedSet = selectedName ? colorImages[selectedName] : undefined;
    const images: string[] = selectedSet
      ? [
          selectedSet.image,
          ...(selectedSet.gallery ?? []),
        ]
      : productUrls.length > 0
        ? productUrls
        : Object.values(colorImages).flatMap((c) => [
            c.image,
            ...(c.gallery ?? []),
          ]);

    // If a color has no dedicated imagery, fall back to product-level set.
    if (productUrls.length > 0) {
      for (const cname of colors) {
        if (!colorImages[cname]) {
          colorImages[cname] = {
            image: productUrls[0],
            gallery: productUrls.length > 1 ? productUrls.slice(1) : undefined,
          };
        }
      }
    }

    const category =
      (typeof asRecord(product.identifier)?.topLevelCategoryName === "string"
        ? String(asRecord(product.identifier)!.topLevelCategoryName)
        : undefined) ||
      (typeof detail.typeName === "string" ? detail.typeName : undefined);

    if (!name) return null;

    return {
      sourceUrl: url,
      name,
      brand,
      description,
      price,
      originalPrice,
      currency: "USD",
      images,
      colors,
      colorHex,
      colorImages:
        Object.keys(colorImages).length > 0 ? colorImages : undefined,
      sizes,
      features: bullets,
      sizeAndFit,
      sku: id,
      category,
      sources: ["dom"],
    };
  } catch (err) {
    console.warn(
      `[scraper:macys] failed for ${id}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export function canScrapeMacys(url: string): boolean {
  return isMacysUrl(url) && Boolean(extractMacysProductId(url));
}
