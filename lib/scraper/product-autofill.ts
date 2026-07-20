/**
 * Turns a scraped product into a full New Product form payload:
 * description, gallery, specs, long-form content blocks, and SEO fields
 * tuned so the live auditor can score green.
 */

import { generateProductContent } from "@/lib/ai/product-content-writer";
import type { ContentBlock } from "@/lib/blocks/types";
import type { ColorImageMap } from "@/lib/utils";
import type { ScrapedProduct } from "./types";

export type ProductAutofill = {
  name: string;
  brand?: string;
  description: string;
  price?: number;
  originalPrice?: number;
  badge?: string;
  image?: string;
  gallery: string[];
  sizes: string[];
  /** Ready for the Colors textarea: `Name: #hex` */
  colorLines: string[];
  /** Per-color galleries for PDP swatch switching. */
  colorImages?: ColorImageMap;
  specs: Array<{ label: string; value: string }>;
  contentBlocks: ContentBlock[];
  focusKeyword: string;
  additionalKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  categoryHint?: string;
  sourceUrl: string;
};

const STOP = new Set([
  "mens",
  "men's",
  "womens",
  "women's",
  "the",
  "a",
  "an",
  "and",
  "for",
  "with",
  "in",
  "of",
  "by",
  "to",
]);

export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Primary keyword derived from name/brand so it also appears in the slug. */
export function deriveFocusKeyword(
  name: string,
  brand?: string,
  category?: string,
): string {
  const cleaned = name.replace(/['']/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return category?.trim() || "shop fashion online";

  if (brand && cleaned.toLowerCase().startsWith(brand.toLowerCase())) {
    const rest = cleaned.slice(brand.length).trim();
    const words = rest
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w.toLowerCase()));
    const last = words[words.length - 1] ?? "";
    const candidate = `${brand} ${last}`.trim();
    if (candidate.length >= 8 && candidate.length <= 48) return candidate;
  }

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()));
  let out = "";
  for (const w of words) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > 42) break;
    out = next;
    if (out.split(/\s+/).length >= 4) break;
  }
  return out || cleaned.slice(0, 42);
}

function clampChars(text: string, min: number, max: number): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length > max) {
    t = t.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(t)) t += ".";
  }
  if (t.length < min) {
    const pad =
      " Shop MayCSS Online Store for curated luxury fashion with free returns.";
    while (t.length < min) {
      t = (t + pad).replace(/\s+/g, " ").trim();
      if (t.length >= max) {
        t = t.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
        if (!/[.!?]$/.test(t)) t += ".";
        break;
      }
    }
  }
  return t;
}

function buildDescription(
  product: ScrapedProduct,
  focusKeyword: string,
): string {
  const raw = product.description ? stripHtml(product.description) : "";
  const features = (product.features ?? []).map((f) => stripHtml(f)).filter(Boolean);
  const fit = (product.sizeAndFit ?? []).map((f) => stripHtml(f)).filter(Boolean);

  const parts: string[] = [];
  if (raw) parts.push(raw);

  if (features.length) {
    parts.push(
      `Key details for this ${focusKeyword}: ${features
        .slice(0, 8)
        .map((f) => f.replace(/\.$/, ""))
        .join("; ")}.`,
    );
  }

  if (fit.length) {
    parts.push(`Fit notes: ${fit.join(" ")}`);
  }

  if (product.sizes?.length) {
    parts.push(`Available sizes: ${product.sizes.join(", ")}.`);
  }
  if (product.colors?.length) {
    parts.push(`Available colors: ${product.colors.join(", ")}.`);
  }

  if (parts.length === 0) {
    parts.push(
      `${product.name} is a curated ${focusKeyword} pick at MayCSS. ` +
        `Shop MayCSS Online Store for quality materials, considered design, and pieces built to last.`,
    );
  } else if (!parts.join(" ").toLowerCase().includes(focusKeyword.toLowerCase())) {
    parts.unshift(
      `Discover this ${focusKeyword} from ${product.brand ?? "our edit"} at MayCSS.`,
    );
  }

  return parts.join("\n\n").trim();
}

function buildSpecs(product: ScrapedProduct): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = [];
  const features = (product.features ?? []).map((f) => stripHtml(f)).filter(Boolean);
  let featureIdx = 1;

  for (const line of features) {
    const split = line.match(/^([^:：-]{2,40})\s*[:：-]\s*(.+)$/);
    if (split) {
      specs.push({ label: split[1].trim(), value: split[2].trim() });
      continue;
    }
    if (/cotton|polyester|leather|suede|wool|silk|nylon|spandex|elastane|rubber|canvas/i.test(line)) {
      specs.push({ label: "Material", value: line.replace(/\.$/, "") });
      continue;
    }
    if (/clean|wash|dry|care|spot/i.test(line)) {
      specs.push({ label: "Care", value: line.replace(/\.$/, "") });
      continue;
    }
    if (/imported|made in/i.test(line)) {
      specs.push({ label: "Origin", value: line.replace(/\.$/, "") });
      continue;
    }
    // Keep every bullet so Specs is never empty after a Macy's scrape.
    specs.push({
      label: `Detail ${featureIdx++}`,
      value: line.replace(/\.$/, ""),
    });
  }

  if (product.sizes?.length) {
    specs.push({ label: "Sizes", value: product.sizes.join(", ") });
  }
  if (product.colors?.length) {
    specs.push({ label: "Colors", value: product.colors.join(", ") });
  }

  // Deduplicate by label+value.
  const seen = new Set<string>();
  return specs.filter((s) => {
    const key = `${s.label.toLowerCase()}|${s.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildColorLines(product: ScrapedProduct): string[] {
  const names = product.colors ?? [];
  if (names.length === 0) return [];
  return names.map((name, i) => {
    const hex =
      product.colorHex?.[i] && /^#?[0-9a-f]{6}$/i.test(product.colorHex[i])
        ? product.colorHex[i].startsWith("#")
          ? product.colorHex[i]
          : `#${product.colorHex[i]}`
        : "#cccccc";
    return `${name}: ${hex}`;
  });
}

function buildMetaTitle(focusKeyword: string, name: string): string {
  const candidates = [
    `${focusKeyword} | Shop MayCSS Online`,
    `${focusKeyword} · MayCSS Store`,
    `${focusKeyword} | MayCSS`,
    name,
  ];
  for (const c of candidates) {
    const t = c.replace(/\s+/g, " ").trim();
    if (t.length >= 30 && t.length <= 60 && includesKw(t, focusKeyword)) {
      return t;
    }
  }
  // Force into range while keeping the keyword up front.
  const seeded = `${focusKeyword} | Shop MayCSS Online Store`;
  return clampChars(seeded, 30, 60);
}

function includesKw(haystack: string, keyword: string): boolean {
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

function buildMetaDescription(
  focusKeyword: string,
  name: string,
  description: string,
): string {
  const snippet = description.replace(/\s+/g, " ").trim().slice(0, 90);
  const base =
    `Shop ${focusKeyword} at MayCSS Online Store. ${name}. ` +
    `${snippet} Curated luxury fashion with easy returns.`;
  // Ensure keyword present (already is) and length 120–160.
  return clampChars(base, 120, 160);
}

function buildAdditionalKeywords(product: ScrapedProduct, focus: string): string[] {
  const out: string[] = [];
  const push = (v?: string) => {
    const t = v?.trim();
    if (!t) return;
    if (t.toLowerCase() === focus.toLowerCase()) return;
    if (out.some((k) => k.toLowerCase() === t.toLowerCase())) return;
    out.push(t);
  };
  push(product.brand);
  push(product.category);
  if (product.colors?.[0]) push(product.colors[0]);
  push("Shop MayCSS Online Store");
  push("luxury fashion");
  return out.slice(0, 6);
}

export function buildProductAutofill(
  product: ScrapedProduct,
  focusKeywordInput?: string,
): ProductAutofill {
  const name = (product.name ?? "Imported product").trim();
  const focusKeyword =
    focusKeywordInput?.trim() ||
    deriveFocusKeyword(name, product.brand, product.category);

  const description = buildDescription(product, focusKeyword);
  const images = (product.images ?? []).filter(Boolean);
  const contentBlocks = generateProductContent({
    name,
    brand: product.brand,
    description,
    category: product.category,
    price: product.price,
    sizes: product.sizes,
    colors: product.colors,
    features: product.features,
    sizeAndFit: product.sizeAndFit,
    focusKeyword,
    additionalKeywords: buildAdditionalKeywords(product, focusKeyword),
  });

  const metaTitle = buildMetaTitle(focusKeyword, name);
  const metaDescription = buildMetaDescription(focusKeyword, name, description);
  const colorImages = product.colorImages;
  const firstColorName = product.colors?.[0];
  const firstColorSet =
    firstColorName && colorImages?.[firstColorName]
      ? colorImages[firstColorName]
      : undefined;
  const image = firstColorSet?.image ?? images[0];
  const gallery = firstColorSet
    ? firstColorSet.gallery ?? []
    : images.slice(1);
  const onSale =
    typeof product.originalPrice === "number" &&
    typeof product.price === "number" &&
    product.originalPrice > product.price;

  return {
    name,
    brand: product.brand,
    description,
    price: product.price,
    originalPrice: product.originalPrice,
    badge: onSale ? "Sale" : undefined,
    image,
    gallery,
    sizes: product.sizes ?? [],
    colorLines: buildColorLines(product),
    colorImages,
    specs: buildSpecs(product),
    contentBlocks,
    focusKeyword,
    additionalKeywords: buildAdditionalKeywords(product, focusKeyword),
    metaTitle,
    metaDescription,
    ogImage: image,
    categoryHint: product.category,
    sourceUrl: product.sourceUrl,
  };
}
