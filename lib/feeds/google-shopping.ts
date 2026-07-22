import "server-only";

import { getCategories, getProducts } from "@/lib/data";
import { getSiteOrigin } from "@/lib/site-url";
import type { Category, Product } from "@/lib/utils";
import { CATEGORY_SEO_SEED } from "@/lib/seo/maycss-keywords";

/**
 * Google Merchant Center product feed builder (RSS 2.0 + g: namespace).
 * Spec: https://support.google.com/merchants/answer/7052112
 */

/** Google product_category IDs for our main apparel taxonomy. */
const GOOGLE_CATEGORY_BY_SLUG: Record<string, string> = {
  "womens-clothing": "1604", // Apparel & Accessories > Clothing
  "womens-dresses": "2271", // … > Dresses
  formal: "2271",
  "wedding-guest": "2271",
  "cocktail-party": "2271",
  casual: "2271",
  work: "2271",
  day: "2271",
  "womens-jeans-denim": "204", // … > Pants > Jeans
  "wide-leg-jeans": "204",
  "straight-jeans": "204",
  "barrel-jeans": "204",
  "flare-bootcut-jeans": "204",
  "skinny-jeans": "204",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(origin: string, maybeUrl: string): string {
  const raw = maybeUrl.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `${origin}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function formatPriceUsd(amount: number): string {
  return `${amount.toFixed(2)} USD`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function categoryPath(
  product: Product,
  byId: Map<string, Category>,
): { productType: string; googleCategoryId?: string; keywords: string[] } {
  const cat = product.categoryId
    ? byId.get(product.categoryId)
    : undefined;
  const parts: string[] = ["Apparel & Accessories", "Clothing"];
  const keywords: string[] = ["MAYCSS", "fashion products", "women clothes"];

  if (cat) {
    if (cat.parentId) {
      const parent = byId.get(cat.parentId);
      if (parent?.name) parts.push(parent.name);
    }
    if (cat.name) parts.push(cat.name);

    const seed =
      CATEGORY_SEO_SEED[cat.slug] ||
      (cat.parentId
        ? CATEGORY_SEO_SEED[byId.get(cat.parentId)?.slug ?? ""]
        : undefined);
    if (seed?.keywords?.length) {
      keywords.push(...seed.keywords.slice(0, 8));
    }

    const gpc =
      GOOGLE_CATEGORY_BY_SLUG[cat.slug] ||
      (cat.parentId
        ? GOOGLE_CATEGORY_BY_SLUG[byId.get(cat.parentId)?.slug ?? ""]
        : undefined) ||
      "1604";
    return {
      productType: parts.join(" > "),
      googleCategoryId: gpc,
      keywords: Array.from(new Set(keywords)),
    };
  }

  if (product.category?.trim()) {
    parts.push(product.category.trim());
  }

  return {
    productType: parts.join(" > "),
    googleCategoryId: "1604",
    keywords: Array.from(new Set(keywords)),
  };
}

function isFeedEligible(product: Product): boolean {
  if (product.status === "draft") return false;
  if (!product.name?.trim()) return false;
  if (!product.image?.trim()) return false;
  if (typeof product.price !== "number" || !(product.price >= 0)) return false;
  return true;
}

function itemXml(
  product: Product,
  origin: string,
  byId: Map<string, Category>,
): string {
  const id = String(product.id);
  const title = truncate(product.name.trim(), 150);
  const description = truncate(
    stripHtml(
      product.description?.trim() ||
        product.seo?.metaDescription?.trim() ||
        `${product.name} — curated fashion from MAYCSS. Shop women clothes, dresses, and jeans online.`,
    ),
    5000,
  );
  const link = `${origin}/product/${encodeURIComponent(id)}`;
  const imageLink = absoluteUrl(origin, product.image);
  const brand = "MAYCSS";
  const { productType, googleCategoryId, keywords } = categoryPath(
    product,
    byId,
  );

  const onSale =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;

  const additionalImages = (product.gallery ?? [])
    .filter((src) => src && src !== product.image)
    .slice(0, 10)
    .map((src) => absoluteUrl(origin, src))
    .filter(Boolean);

  const color = product.colors?.[0]?.name?.trim();
  const size = product.sizes?.[0]?.trim();

  const lines = [
    "<item>",
    `<g:id>${escapeXml(id)}</g:id>`,
    `<g:title>${escapeXml(title)}</g:title>`,
    `<g:description>${escapeXml(description)}</g:description>`,
    `<g:link>${escapeXml(link)}</g:link>`,
    `<g:image_link>${escapeXml(imageLink)}</g:image_link>`,
    ...additionalImages.map(
      (src) => `<g:additional_image_link>${escapeXml(src)}</g:additional_image_link>`,
    ),
    `<g:availability>in_stock</g:availability>`,
    `<g:condition>new</g:condition>`,
    `<g:price>${escapeXml(formatPriceUsd(onSale ? product.originalPrice! : product.price))}</g:price>`,
    ...(onSale
      ? [`<g:sale_price>${escapeXml(formatPriceUsd(product.price))}</g:sale_price>`]
      : []),
    `<g:brand>${escapeXml(brand)}</g:brand>`,
    `<g:identifier_exists>false</g:identifier_exists>`,
    `<g:product_type>${escapeXml(productType)}</g:product_type>`,
    ...(googleCategoryId
      ? [`<g:google_product_category>${escapeXml(googleCategoryId)}</g:google_product_category>`]
      : []),
    `<g:adult>no</g:adult>`,
    `<g:gender>female</g:gender>`,
    `<g:age_group>adult</g:age_group>`,
    ...(color ? [`<g:color>${escapeXml(truncate(color, 100))}</g:color>`] : []),
    ...(size ? [`<g:size>${escapeXml(truncate(size, 100))}</g:size>`] : []),
    `<g:custom_label_0>${escapeXml(truncate(keywords.slice(0, 3).join(", "), 100))}</g:custom_label_0>`,
    "</item>",
  ];

  return lines.join("\n");
}

/** Build a Google Merchant Center RSS 2.0 XML feed for all published products. */
export async function buildGoogleShoppingFeedXml(): Promise<{
  xml: string;
  count: number;
}> {
  const origin = getSiteOrigin();
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const eligible = products.filter(isFeedEligible);

  const items = eligible.map((p) => itemXml(p, origin, byId)).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>MAYCSS Google Shopping Feed</title>
<link>${escapeXml(origin)}</link>
<description>MAYCSS curated luxury fashion — automated Google Merchant Center product feed (USD).</description>
${items}
</channel>
</rss>`;

  return { xml, count: eligible.length };
}

/** Tab-separated feed (optional alternate for GMC scheduled fetch). */
export async function buildGoogleShoppingFeedTsv(): Promise<{
  tsv: string;
  count: number;
}> {
  const origin = getSiteOrigin();
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const eligible = products.filter(isFeedEligible);

  const header = [
    "id",
    "title",
    "description",
    "link",
    "image_link",
    "availability",
    "condition",
    "price",
    "sale_price",
    "brand",
    "identifier_exists",
    "product_type",
    "google_product_category",
    "gender",
    "age_group",
  ].join("\t");

  const rows = eligible.map((p) => {
    const id = String(p.id);
    const { productType, googleCategoryId } = categoryPath(p, byId);
    const onSale =
      typeof p.originalPrice === "number" && p.originalPrice > p.price;
    const cells = [
      id,
      p.name.trim(),
      stripHtml(
        p.description?.trim() ||
          `${p.name} — curated fashion from MAYCSS.`,
      ).slice(0, 5000),
      `${origin}/product/${encodeURIComponent(id)}`,
      absoluteUrl(origin, p.image),
      "in_stock",
      "new",
      formatPriceUsd(onSale ? p.originalPrice! : p.price),
      onSale ? formatPriceUsd(p.price) : "",
      "MAYCSS",
      "false",
      productType,
      googleCategoryId ?? "",
      "female",
      "adult",
    ];
    return cells.map((c) => c.replace(/[\t\n\r]/g, " ")).join("\t");
  });

  return { tsv: [header, ...rows].join("\n"), count: eligible.length };
}
