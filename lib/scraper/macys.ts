import "server-only";

import type { ScrapedProduct } from "./types";

const MACYS_HOST = /(^|\.)macys\.com$/i;
const IMAGE_BASE = "https://slimages.macysassets.com/is/image/MCY/products/";

function isMacysUrl(url: string): boolean {
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
    const pathMatch = u.pathname.match(/\/product\/[^/?#]*?[?&]ID=(\d+)/i);
    if (pathMatch) return pathMatch[1];
    const idInPath = u.pathname.match(/\/(\d{6,})(?:\/|$)/);
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

/**
 * Macy's HTML pages are bot-blocked (Akamai), but their public XAPI still
 * returns full product JSON — name, price, sizes, colors, images, bullets.
 */
export async function scrapeMacysProduct(
  url: string,
): Promise<Partial<ScrapedProduct> | null> {
  if (!isMacysUrl(url)) return null;
  const id = extractMacysProductId(url);
  if (!id) return null;

  const apiUrl =
    `https://www.macys.com/xapi/digital/v1/product/${id}` +
    `?currencyCode=USD&_regionCode=US`;

  try {
    const res = await fetch(apiUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.macys.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.warn(`[scraper:macys] xapi ${res.status} for product ${id}`);
      return null;
    }

    const data = (await res.json()) as {
      product?: unknown[];
    };
    const raw = Array.isArray(data.product) ? data.product[0] : null;
    const product = asRecord(raw);
    if (!product) return null;

    const detail = asRecord(product.detail) ?? {};
    const brandObj = asRecord(detail.brand);
    const brand = typeof brandObj?.name === "string" ? brandObj.name : undefined;

    const completeName =
      typeof detail.completeName === "string" ? detail.completeName.trim() : "";
    const shortName =
      typeof detail.name === "string" ? detail.name.trim() : "";
    const name =
      completeName ||
      (brand && shortName ? `${brand} ${shortName}` : shortName) ||
      undefined;

    const description =
      (typeof detail.description === "string" && detail.description.trim()) ||
      undefined;

    const bullets = Array.isArray(detail.bulletText)
      ? detail.bulletText.map((b) => String(b).trim()).filter(Boolean)
      : [];

    const processed = asRecord(detail.processedProdDesc);
    const sizeAndFit = Array.isArray(processed?.sizeAndFit)
      ? processed!.sizeAndFit.map((s) => String(s).trim()).filter(Boolean)
      : [];

    // Pricing
    const pricing = asRecord(product.pricing);
    const priceRoot = asRecord(pricing?.price);
    const tiered = Array.isArray(priceRoot?.tieredPrice)
      ? priceRoot!.tieredPrice
      : [];
    let price: number | undefined;
    let originalPrice: number | undefined;
    for (const tier of tiered) {
      const t = asRecord(tier);
      const values = Array.isArray(t?.values) ? t!.values : [];
      for (const v of values) {
        const row = asRecord(v);
        const value = Number(row?.value);
        const type = String(row?.type ?? "");
        if (!Number.isFinite(value) || value <= 0) continue;
        if (type === "regular" || type === "original") {
          originalPrice = originalPrice ?? value;
        } else if (type === "discount" || type === "sale" || type === "edv") {
          price = price ?? value;
        } else {
          price = price ?? value;
        }
      }
    }
    if (price == null && originalPrice != null) price = originalPrice;
    if (
      originalPrice != null &&
      price != null &&
      originalPrice <= price
    ) {
      originalPrice = undefined;
    }

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

    // Colors
    const colorsRoot = asRecord(traits?.colors);
    const colorMap = asRecord(colorsRoot?.colorMap) ?? {};
    const colors = Object.values(colorMap)
      .map((c) => {
        const row = asRecord(c);
        return String(row?.name ?? row?.normalName ?? "").trim();
      })
      .filter(Boolean);

    // Images — prefer selected color imagery, then product-level imagery
    const selectedColorId = colorsRoot?.selectedColor;
    const selectedColor = asRecord(
      selectedColorId != null
        ? colorMap[String(selectedColorId)]
        : Object.values(colorMap)[0],
    );
    const colorImagery = asRecord(selectedColor?.imagery);
    const productImagery = asRecord(product.imagery);
    const imageNodes = [
      ...(Array.isArray(colorImagery?.images) ? colorImagery!.images : []),
      ...(Array.isArray(productImagery?.images) ? productImagery!.images : []),
    ];
    const images: string[] = [];
    const seen = new Set<string>();
    for (const node of imageNodes) {
      const row = asRecord(node);
      const filePath = typeof row?.filePath === "string" ? row.filePath : "";
      if (!filePath) continue;
      const src = macysImageUrl(filePath);
      if (seen.has(src)) continue;
      seen.add(src);
      images.push(src);
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
