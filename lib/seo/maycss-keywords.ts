/**
 * Curated MAYCSS storefront keywords (GMC-safe).
 * No "near me" / local store phrases — online-only brand.
 * Used for admin suggestions, site schema, and default CMS SEO seeds.
 */
export const MAYCSS_PRIMARY_KEYWORDS = [
  "MAYCSS",
  "wholesale clothing",
  "fashion products",
  "women clothes",
  "women's clothes",
  "womens t shirts",
  "women's t shirts",
  "womens work clothes",
  "straight leg jeans",
  "black jeans",
  "plus size clothing",
  "affordable plus size clothing",
  "cheap plus size clothes",
  "cheap plus size womens clothing",
  "cheap plus size",
  "cheap online clothing",
  "cheap clothing sites",
  "cheap clothing brand",
  "cheap western wear",
  "inexpensive online clothing stores",
  "best affordable clothing sites",
  "usa cheap clothes",
  "clothes on sale",
  "womens clothes sale",
  "friday sale",
  "jeans and denim",
  "jeans",
  "purple brand jeans",
  "corset top",
  "tops",
  "dresses",
  "dresses for women",
  "summer dress",
  "red dress",
  "white mini dress",
  "white dresses",
  "cocktail dress dresses",
  "dresses for the prom",
  "homecoming dresses",
  "wedding guest",
  "wedding guest dresses",
  "bridal guest dresses",
  "wedding dresses as guest",
  "baby clothes",
  "swimsuit",
  "business casual",
  "party",
  "casual",
  "work",
  "clothing store",
  "clothing storefront",
  "gift mother's day",
  "mother's day and gift",
] as const;

/** Per-category focus + supporting keywords (relevant only — not full dump). */
export const CATEGORY_SEO_SEED: Record<
  string,
  { focus: string; keywords: string[]; metaTitle: string; metaDescription: string; description: string }
> = {
  "womens-clothing": {
    focus: "women clothes",
    keywords: [
      "MAYCSS",
      "women clothes",
      "women's clothes",
      "wholesale clothing",
      "fashion products",
      "womens t shirts",
      "women's t shirts",
      "womens clothes sale",
      "cheap online clothing",
      "plus size clothing",
      "affordable plus size clothing",
      "clothes on sale",
      "corset top",
      "tops",
      "friday sale",
      "clothing store",
    ],
    metaTitle: "Women's Clothing Online · MAYCSS Fashion Store",
    metaDescription:
      "Shop women clothes and fashion products at MAYCSS — wholesale clothing energy with curated dresses, denim, womens t shirts, tops, and friday sale picks. Clothes on sale from our online clothing store.",
    description:
      "Explore women's clothing at MAYCSS: dresses, jeans and denim, womens t shirts, corset tops, and work-ready pieces. Affordable curated fashion products with seasonal clothes on sale.",
  },
  "womens-dresses": {
    focus: "dresses for women",
    keywords: [
      "MAYCSS",
      "dresses for women",
      "dresses",
      "summer dress",
      "wedding guest dresses",
      "bridal guest dresses",
      "homecoming dresses",
      "dresses for the prom",
      "cocktail dress dresses",
      "red dress",
      "white mini dress",
      "white dresses",
      "party",
      "casual",
    ],
    metaTitle: "Dresses for Women · Wedding Guest & Party · MAYCSS",
    metaDescription:
      "Shop dresses for women at MAYCSS — summer dress styles, wedding guest dresses, bridal guest dresses, cocktail looks, red dress and white mini dress for party, prom, and casual occasions.",
    description:
      "Browse dresses for women at MAYCSS: summer dress edits, wedding guest dresses, party silhouettes, homecoming dresses, and everyday casual dresses curated for fit and polish.",
  },
  formal: {
    focus: "dresses for women",
    keywords: [
      "MAYCSS",
      "dresses for women",
      "dresses",
      "party",
      "wedding guest",
      "formal",
      "cocktail dress dresses",
    ],
    metaTitle: "Formal Dresses for Women · MAYCSS",
    metaDescription:
      "Shop formal dresses for women at MAYCSS — evening and black-tie looks with luxury curation, ideal for party nights and formal wedding guest dress codes.",
    description:
      "Formal dresses for women at MAYCSS — sculptural gowns and refined evening pieces for galas, black-tie, and special occasions.",
  },
  "wedding-guest": {
    focus: "wedding guest dresses",
    keywords: [
      "MAYCSS",
      "wedding guest dresses",
      "wedding guest",
      "bridal guest dresses",
      "wedding dresses as guest",
      "dresses for women",
      "dresses",
      "party",
      "summer dress",
    ],
    metaTitle: "Wedding Guest Dresses · Bridal Guest Looks · MAYCSS",
    metaDescription:
      "Find wedding guest dresses and bridal guest dresses at MAYCSS — polished dresses for women for ceremonies, receptions, and summer celebrations.",
    description:
      "Wedding guest dresses curated at MAYCSS for every dress code — from garden parties to evening receptions.",
  },
  "cocktail-party": {
    focus: "party",
    keywords: [
      "MAYCSS",
      "party",
      "cocktail dress dresses",
      "dresses",
      "dresses for women",
      "red dress",
      "white mini dress",
      "homecoming dresses",
    ],
    metaTitle: "Cocktail & Party Dresses · MAYCSS",
    metaDescription:
      "Shop party and cocktail dress dresses at MAYCSS — red dress moments, white mini dress styles, and homecoming dresses for nights out.",
    description:
      "Cocktail and party dresses at MAYCSS — bold and refined silhouettes for celebrations, holidays, and nights out.",
  },
  casual: {
    focus: "casual",
    keywords: [
      "MAYCSS",
      "casual",
      "dresses",
      "women clothes",
      "summer dress",
      "fashion products",
      "business casual",
    ],
    metaTitle: "Casual Dresses & Everyday Wear · MAYCSS",
    metaDescription:
      "Shop casual dresses and everyday women clothes at MAYCSS — easy summer dress styles, business casual options, and fashion products for real life.",
    description:
      "Casual dresses and everyday essentials at MAYCSS — elevated comfort with lasting quality.",
  },
  work: {
    focus: "womens work clothes",
    keywords: [
      "MAYCSS",
      "womens work clothes",
      "work",
      "business casual",
      "dresses",
      "women clothes",
      "fashion products",
    ],
    metaTitle: "Women's Work Clothes & Business Casual · MAYCSS",
    metaDescription:
      "Shop womens work clothes and business casual at MAYCSS — polished dresses and work-ready women clothes for meetings, offices, and professional days.",
    description:
      "Women's work clothes at MAYCSS — refined dresses and silhouettes for the office and beyond.",
  },
  day: {
    focus: "summer dress",
    keywords: ["MAYCSS", "summer dress", "dresses", "casual", "dresses for women"],
    metaTitle: "Day Dresses · MAYCSS",
    metaDescription:
      "Shop day and summer dress styles at MAYCSS — light dresses for women for brunch, travel, and everyday polish.",
    description:
      "Day dresses at MAYCSS — breezy, polished looks for daytime plans and warm-weather dressing.",
  },
  "womens-jeans-denim": {
    focus: "jeans and denim",
    keywords: [
      "MAYCSS",
      "jeans and denim",
      "jeans",
      "straight leg jeans",
      "black jeans",
      "purple brand jeans",
      "women clothes",
    ],
    metaTitle: "Jeans and Denim for Women · MAYCSS",
    metaDescription:
      "Shop jeans and denim at MAYCSS — straight leg jeans, black jeans, and modern fits. Curated fashion products with clothes on sale year-round.",
    description:
      "Women's jeans and denim at MAYCSS — straight leg jeans, black jeans, wide-leg, barrel, and skinny fits for every wardrobe.",
  },
  "wide-leg-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "jeans and denim", "women clothes", "fashion products"],
    metaTitle: "Wide-Leg Jeans · MAYCSS",
    metaDescription:
      "Shop wide-leg jeans at MAYCSS — modern volume and easy movement in curated jeans and denim for women.",
    description:
      "Wide-leg jeans at MAYCSS with modern volume and effortless movement.",
  },
  "straight-jeans": {
    focus: "straight leg jeans",
    keywords: ["MAYCSS", "straight leg jeans", "jeans", "black jeans", "jeans and denim"],
    metaTitle: "Straight Leg Jeans · MAYCSS",
    metaDescription:
      "Shop straight leg jeans at MAYCSS — clean-line denim essentials including classic black jeans and everyday washes.",
    description:
      "Straight leg jeans at MAYCSS — a clean classic line for everyday denim.",
  },
  "barrel-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "jeans and denim", "fashion products"],
    metaTitle: "Barrel Jeans · MAYCSS",
    metaDescription:
      "Shop barrel jeans at MAYCSS — curved volume through the leg in fashion-forward jeans and denim.",
    description:
      "Barrel jeans at MAYCSS with curved volume and a modern denim profile.",
  },
  "flare-bootcut-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "jeans and denim", "women clothes"],
    metaTitle: "Flare & Bootcut Jeans · MAYCSS",
    metaDescription:
      "Shop flare and bootcut jeans at MAYCSS — timeless jeans and denim silhouettes with lift and length.",
    description:
      "Flare and bootcut jeans at MAYCSS for elongated, polished denim looks.",
  },
  "skinny-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "black jeans", "jeans and denim"],
    metaTitle: "Skinny Jeans · MAYCSS",
    metaDescription:
      "Shop skinny jeans at MAYCSS — fitted denim staples including black jeans in classic washes.",
    description:
      "Skinny jeans at MAYCSS — fitted denim staples for everyday polish.",
  },
};

export function keywordsForSuggest(seed: string, limit = 12): string[] {
  const s = seed.trim().toLowerCase();
  const catalog = MAYCSS_PRIMARY_KEYWORDS.map((k) => k.toLowerCase());
  if (!s) return [...MAYCSS_PRIMARY_KEYWORDS].slice(0, limit);
  const hit = MAYCSS_PRIMARY_KEYWORDS.filter((k) =>
    k.toLowerCase().includes(s),
  );
  const related = catalog
    .filter((k) => k !== s && (k.includes(s) || s.includes(k.split(" ")[0]!)))
    .slice(0, 6);
  return Array.from(new Set([seed, ...hit, ...related])).slice(0, limit);
}
