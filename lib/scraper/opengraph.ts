import "server-only";

import type { ScrapedProduct } from "./types";

function meta(html: string, prop: string, attr: "name" | "property"): string | undefined {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return decode(m[1]);
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${prop}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? decode(m2[1]) : undefined;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * Fallback parser: read OpenGraph meta tags. Almost every ecommerce site
 * emits at least `og:title`, `og:description`, `og:image`, `og:price:amount`.
 */
export function scrapeFromOpenGraph(
  html: string,
  sourceUrl: string,
): Partial<ScrapedProduct> | null {
  const name = meta(html, "og:title", "property");
  const description = meta(html, "og:description", "property");
  const image = meta(html, "og:image", "property");
  const priceRaw =
    meta(html, "product:price:amount", "property") ??
    meta(html, "og:price:amount", "property");
  const currency =
    meta(html, "product:price:currency", "property") ??
    meta(html, "og:price:currency", "property");
  const brand = meta(html, "product:brand", "property");

  if (!name && !description && !image) return null;

  const price = priceRaw ? Number(priceRaw.replace(/[^0-9.]/g, "")) : undefined;

  return {
    sourceUrl,
    name,
    brand,
    description,
    price: Number.isFinite(price) && (price as number) > 0 ? price : undefined,
    currency,
    images: image ? [image] : [],
    sources: ["opengraph"],
  };
}
