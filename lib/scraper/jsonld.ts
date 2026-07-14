import "server-only";

import type { ScrapedProduct } from "./types";

/** Extract every JSON-LD script block from a raw HTML string. */
function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* skip malformed */
    }
  }
  return blocks;
}

/** Walk any @graph nested arrays to find every Product node. */
function findProductNodes(node: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const n of node) out.push(...findProductNodes(n));
    return out;
  }
  if (typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  if (
    type === "Product" ||
    (Array.isArray(type) && type.includes("Product"))
  ) {
    out.push(obj);
  }
  if (Array.isArray(obj["@graph"])) {
    for (const n of obj["@graph"] as unknown[]) {
      out.push(...findProductNodes(n));
    }
  }
  return out;
}

function firstStr(v: unknown): string | undefined {
  if (Array.isArray(v)) return firstStr(v[0]);
  if (typeof v === "string") return v.trim() || undefined;
  return undefined;
}

function firstNum(v: unknown): number | undefined {
  if (Array.isArray(v)) return firstNum(v[0]);
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
}

function collectImages(v: unknown): string[] {
  const out: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && /^https?:\/\//i.test(s)) out.push(s);
  };
  if (Array.isArray(v)) v.forEach(push);
  else push(v);
  return out;
}

/**
 * Try to build a ScrapedProduct from JSON-LD alone.
 * Macy's, Nordstrom, Uniqlo, most Shopify + WooCommerce sites all publish
 * Schema.org Product in JSON-LD.
 */
export function scrapeFromJsonLd(
  html: string,
  sourceUrl: string,
): Partial<ScrapedProduct> | null {
  const blocks = extractJsonLdBlocks(html);
  const products: Record<string, unknown>[] = [];
  for (const b of blocks) products.push(...findProductNodes(b));
  if (products.length === 0) return null;

  const p = products[0];

  const name = firstStr(p.name);
  const description = firstStr(p.description);
  const brandVal = p.brand;
  const brand =
    typeof brandVal === "string"
      ? brandVal
      : firstStr((brandVal as Record<string, unknown> | undefined)?.name);
  const sku = firstStr(p.sku) ?? firstStr(p.mpn);
  const images = collectImages(p.image);

  // offers can be Offer, AggregateOffer, or array
  let price: number | undefined;
  let originalPrice: number | undefined;
  let currency: string | undefined;
  const offers = p.offers;
  const offerNodes: Record<string, unknown>[] = [];
  if (Array.isArray(offers)) {
    for (const o of offers) if (o && typeof o === "object") offerNodes.push(o as Record<string, unknown>);
  } else if (offers && typeof offers === "object") {
    offerNodes.push(offers as Record<string, unknown>);
  }
  for (const o of offerNodes) {
    price = price ?? firstNum(o.price) ?? firstNum(o.lowPrice);
    originalPrice =
      originalPrice ??
      firstNum(o.highPrice) ??
      firstNum(
        (o.priceSpecification as Record<string, unknown> | undefined)?.price,
      );
    currency = currency ?? firstStr(o.priceCurrency);
  }
  if (originalPrice && price && originalPrice <= price) {
    originalPrice = undefined;
  }

  // Ratings
  const rating = firstNum(
    (p.aggregateRating as Record<string, unknown> | undefined)?.ratingValue,
  );
  const reviewCount = firstNum(
    (p.aggregateRating as Record<string, unknown> | undefined)?.reviewCount,
  );

  // Category
  const category = firstStr(p.category);

  return {
    sourceUrl,
    name,
    brand,
    description,
    price,
    originalPrice,
    currency,
    images,
    sku,
    rating,
    reviewCount,
    category,
    sources: ["jsonld"],
  };
}
