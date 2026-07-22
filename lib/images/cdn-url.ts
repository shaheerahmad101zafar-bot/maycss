/**
 * CDN URL helpers — serve correctly sized images for LCP / cards / banners.
 * Supports Unsplash + Macy's asset CDN query params (replace, never skip).
 */

export type CdnImageOpts = {
  /** Target width in CSS px (will be rounded). */
  width: number;
  /** 1–100. Default 72. */
  quality?: number;
  /** Prefer webp when the CDN supports it (Unsplash fm=, Macy's fmt=). */
  format?: "webp" | "jpeg" | "auto";
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Resize / recompress a remote image URL for the viewport it's shown in. */
export function cdnImageUrl(
  src: string | undefined | null,
  opts: CdnImageOpts,
): string {
  if (!src) return "";
  const width = clamp(Math.round(opts.width), 64, 2400);
  const quality = clamp(Math.round(opts.quality ?? 72), 40, 90);
  const format = opts.format ?? "webp";

  try {
    if (src.includes("images.unsplash.com")) {
      const u = new URL(src);
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality));
      if (format === "webp") u.searchParams.set("fm", "webp");
      else if (format === "jpeg") u.searchParams.set("fm", "jpg");
      return u.toString();
    }

    if (src.includes("macysassets.com") || src.includes("assets.macys.com")) {
      const u = new URL(src);
      u.searchParams.set("wid", String(width));
      // Macy's Scene7 is most reliable with jpeg; webp support varies.
      u.searchParams.set("fmt", "jpeg");
      u.searchParams.set("qlt", String(quality));
      return u.toString();
    }
  } catch {
    // fall through
  }

  // Local /uploads or unknown hosts — return as-is
  return src;
}

/** Hero / full-bleed banners — mobile-first width for LCP. */
export function heroImageUrl(src: string | undefined | null): string {
  return cdnImageUrl(src, { width: 750, quality: 65, format: "webp" });
}

/** Promo / category strips (~full width, shorter height). */
export function bannerImageUrl(src: string | undefined | null): string {
  return cdnImageUrl(src, { width: 720, quality: 62, format: "webp" });
}

/** Category subcards / tiles. */
export function tileImageUrl(src: string | undefined | null): string {
  return cdnImageUrl(src, { width: 480, quality: 65, format: "webp" });
}

/** Product grid cards. */
export function cardImageUrl(src: string | undefined | null): string {
  return cdnImageUrl(src, { width: 400, quality: 70, format: "webp" });
}
