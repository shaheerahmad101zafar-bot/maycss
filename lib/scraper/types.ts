/** Shape returned by every scraper. All fields optional so parsers can
 * merge partial results together. */
export type ScrapedProduct = {
  sourceUrl: string;
  name?: string;
  brand?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  rating?: number;
  reviewCount?: number;
  sku?: string;
  category?: string;
  /** Where the data came from — helpful for admin debugging. */
  sources: Array<"jsonld" | "opengraph" | "dom">;
};

export type ScrapeResult =
  | { ok: true; product: ScrapedProduct }
  | { ok: false; error: string };
