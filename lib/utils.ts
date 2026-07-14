/**
 * MayCSS - client-safe helpers and shared types.
 *
 * This module is import-safe from both server and client components.
 * All server-only data access lives in `@/lib/data` and `@/lib/orders`
 * (both marked with `import "server-only"`).
 */

import type { ContentBlock } from "./blocks/types";

export type ProductSpec = { label: string; value: string };
export type ProductColor = { name: string; hex: string };

/** Per-color image override — used to swap the gallery when a color is picked. */
export type ColorImageMap = Record<
  string,
  { image: string; gallery?: string[] }
>;

export type Product = {
  id: string | number;
  name: string;
  brand?: string;
  image: string;
  gallery?: string[];
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  badge?: string;
  isNew?: boolean;
  /** Legacy free-text category. `categoryId` is the canonical link. */
  category?: string;
  /** FK into categories.json. */
  categoryId?: string;
  description?: string;
  specs?: ProductSpec[];
  sizes?: string[];
  colors?: ProductColor[];
  /** Optional map keyed by color name → per-color image + gallery. */
  colorImages?: ColorImageMap;
  /**
   * Dynamic content blocks rendered BELOW the standard PDP.
   * Same shape as Page.blocks — reuses the block factory + renderer + SEO
   * auditor. Add rich text, images, FAQs, CTAs, columns per product.
   */
  contentBlocks?: ContentBlock[];
  /** Per-product SEO overrides (defaults to name + description). */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    focusKeyword?: string;
    ogImage?: string;
  };
  /** Draft workflow — imported products land here for review. */
  status?: "draft" | "published";
  /** Where the product came from — set by the URL scraper. */
  sourceUrl?: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  order?: number;
  description?: string;
  image?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    focusKeyword?: string;
    keywords?: string[];
  };
};

export type BannerSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Format a number as USD currency. */
export function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

/** Integer discount percent, or 0 if not on sale. */
export function discountPercent(product: Product): number {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  );
}

/** Estimated US sales tax at a flat 8.25% for the stub checkout. */
export function estimateTax(subtotal: number): number {
  return Math.round(subtotal * 0.0825 * 100) / 100;
}

/** Merge className strings, dropping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Resolve the effective gallery for a product given a chosen color name.
 * Client + server safe.
 */
export function resolveGallery(product: Product, colorName?: string | null): string[] {
  if (colorName && product.colorImages?.[colorName]) {
    const override = product.colorImages[colorName];
    return override.gallery && override.gallery.length > 0
      ? override.gallery
      : [override.image];
  }
  return product.gallery && product.gallery.length > 0
    ? product.gallery
    : [product.image];
}
