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
  /** Parallel hex codes for `colors` (same order), when known. */
  colorHex?: string[];
  sizes?: string[];
  /** Bullet features / materials / care lines from the source PDP. */
  features?: string[];
  /** Size-and-fit notes (model height, hem length, etc.). */
  sizeAndFit?: string[];
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
