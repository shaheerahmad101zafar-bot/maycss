/**
 * Apply curated MAYCSS SEO seeds to categories.json + key pages in pages.json.
 * GMC-safe: no "near me" / local store phrases. Luxury-facing copy stays clean.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Mirrors lib/seo/maycss-keywords.ts CATEGORY_SEO_SEED */
const CATEGORY_SEO_SEED = {
  "womens-clothing": {
    focus: "women clothes",
    keywords: [
      "MAYCSS",
      "women clothes",
      "wholesale clothing",
      "fashion products",
      "womens t shirts",
      "womens clothes sale",
      "cheap online clothing",
      "plus size clothing",
      "affordable plus size clothing",
      "clothes on sale",
      "corset top",
      "friday sale",
    ],
    metaTitle: "Women's Clothing Online · MAYCSS",
    metaDescription:
      "Shop women clothes and fashion products at MAYCSS — wholesale clothing energy with curated dresses, denim, womens t shirts, and friday sale picks. Clothes on sale, shipped online.",
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
      "red dress",
      "white mini dress",
      "party",
      "casual",
    ],
    metaTitle: "Dresses for Women · Wedding Guest & Party · MAYCSS",
    metaDescription:
      "Shop dresses for women at MAYCSS — summer dress styles, wedding guest dresses, red dress and white mini dress looks for party, casual, and work occasions.",
    description:
      "Browse dresses for women at MAYCSS: summer dress edits, wedding guest dresses, party silhouettes, and everyday casual dresses curated for fit and polish.",
  },
  formal: {
    focus: "dresses for women",
    keywords: ["MAYCSS", "dresses for women", "dresses", "party", "wedding guest", "formal"],
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
      "dresses for women",
      "dresses",
      "party",
      "summer dress",
    ],
    metaTitle: "Wedding Guest Dresses · MAYCSS",
    metaDescription:
      "Find wedding guest dresses at MAYCSS — polished dresses for women for ceremonies, receptions, and summer celebrations with quiet luxury styling.",
    description:
      "Wedding guest dresses curated at MAYCSS for every dress code — from garden parties to evening receptions.",
  },
  "cocktail-party": {
    focus: "party",
    keywords: ["MAYCSS", "party", "dresses", "dresses for women", "red dress", "white mini dress"],
    metaTitle: "Cocktail & Party Dresses · MAYCSS",
    metaDescription:
      "Shop party dresses at MAYCSS — cocktail looks, red dress moments, and white mini dress styles for nights out and celebrations.",
    description:
      "Cocktail and party dresses at MAYCSS — bold and refined silhouettes for celebrations, holidays, and nights out.",
  },
  casual: {
    focus: "casual",
    keywords: ["MAYCSS", "casual", "dresses", "women clothes", "summer dress", "fashion products"],
    metaTitle: "Casual Dresses & Everyday Wear · MAYCSS",
    metaDescription:
      "Shop casual dresses and everyday women clothes at MAYCSS — easy summer dress styles and fashion products for real life.",
    description:
      "Casual dresses and everyday essentials at MAYCSS — elevated comfort with lasting quality.",
  },
  work: {
    focus: "womens work clothes",
    keywords: ["MAYCSS", "womens work clothes", "work", "dresses", "women clothes", "fashion products"],
    metaTitle: "Women's Work Clothes & Office Dresses · MAYCSS",
    metaDescription:
      "Shop womens work clothes at MAYCSS — polished dresses and work-ready women clothes for meetings, offices, and professional days.",
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
    description: "Wide-leg jeans at MAYCSS with modern volume and effortless movement.",
  },
  "straight-jeans": {
    focus: "straight leg jeans",
    keywords: ["MAYCSS", "straight leg jeans", "jeans", "black jeans", "jeans and denim"],
    metaTitle: "Straight Leg Jeans · MAYCSS",
    metaDescription:
      "Shop straight leg jeans at MAYCSS — clean-line denim essentials including classic black jeans and everyday washes.",
    description: "Straight leg jeans at MAYCSS — a clean classic line for everyday denim.",
  },
  "barrel-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "jeans and denim", "fashion products"],
    metaTitle: "Barrel Jeans · MAYCSS",
    metaDescription:
      "Shop barrel jeans at MAYCSS — curved volume through the leg in fashion-forward jeans and denim.",
    description: "Barrel jeans at MAYCSS with curved volume and a modern denim profile.",
  },
  "flare-bootcut-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "jeans and denim", "women clothes"],
    metaTitle: "Flare & Bootcut Jeans · MAYCSS",
    metaDescription:
      "Shop flare and bootcut jeans at MAYCSS — timeless jeans and denim silhouettes with lift and length.",
    description: "Flare and bootcut jeans at MAYCSS for elongated, polished denim looks.",
  },
  "skinny-jeans": {
    focus: "jeans",
    keywords: ["MAYCSS", "jeans", "black jeans", "jeans and denim"],
    metaTitle: "Skinny Jeans · MAYCSS",
    metaDescription:
      "Shop skinny jeans at MAYCSS — fitted denim staples including black jeans in classic washes.",
    description: "Skinny jeans at MAYCSS — fitted denim staples for everyday polish.",
  },
};

const HOME_KEYWORDS = [
  "MAYCSS",
  "wholesale clothing",
  "fashion products",
  "women clothes",
  "womens t shirts",
  "cheap online clothing",
  "cheap plus size clothes",
  "womens clothes sale",
  "jeans and denim",
  "straight leg jeans",
  "dresses for women",
  "plus size clothing",
  "clothes on sale",
  "friday sale",
  "corset top",
  "wedding guest",
  "summer dress",
  "usa cheap clothes",
];

const TODAY = "2026-07-22";

const categoriesPath = join(root, "data", "categories.json");
const pagesPath = join(root, "data", "pages.json");

const categories = JSON.parse(readFileSync(categoriesPath, "utf8"));
let catUpdated = 0;
for (const cat of categories) {
  const seed = CATEGORY_SEO_SEED[cat.slug];
  if (!seed) continue;
  cat.description = seed.description;
  cat.seo = {
    ...(cat.seo || {}),
    metaTitle: seed.metaTitle,
    metaDescription: seed.metaDescription,
    focusKeyword: seed.focus,
    keywords: seed.keywords,
    ogImage: cat.seo?.ogImage || cat.image || "",
  };
  catUpdated++;
}
writeFileSync(categoriesPath, JSON.stringify(categories, null, 2) + "\n", "utf8");
console.log(`Updated SEO for ${catUpdated}/${categories.length} categories`);

const pages = JSON.parse(readFileSync(pagesPath, "utf8"));
const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));

function setSeo(p, metaTitle, metaDescription, keywords) {
  if (!p) return;
  p.seo = {
    ...(p.seo || {}),
    metaTitle,
    metaDescription,
    keywords,
    ogImage: p.seo?.ogImage || p.bannerImage || "",
  };
  p.lastUpdated = TODAY;
}

{
  const p = bySlug.home;
  setSeo(
    p,
    "MAYCSS | Curated Luxury Fashion Online",
    "Shop MAYCSS for women clothes, dresses for women, jeans and denim, and fashion products. Wholesale clothing energy with clothes on sale, friday sale picks, and affordable plus size clothing — online only.",
    HOME_KEYWORDS,
  );
  const seoBlk = p?.blocks?.find((b) => b.id === "blk_home_seo_copy");
  if (seoBlk) {
    seoBlk.heading = "Curated Luxury Fashion";
    seoBlk.body =
      "MAYCSS is your destination for curated luxury fashion online — women clothes, dresses for women, jeans and denim, and considered fashion products. Discover womens t shirts, corset tops, straight leg jeans, wedding guest dresses, and womens work clothes chosen for fabric, fit, and lasting polish. Explore clothes on sale and friday sale edits, plus size clothing and affordable plus size clothing, and wholesale clothing energy without the clutter. Shop cheap online clothing and womens clothes sale finds with the quiet confidence of a luxury edit — authenticity guaranteed, complimentary shipping on qualifying orders.";
  }
}

{
  const p = bySlug.shop;
  setSeo(
    p,
    "Shop All Fashion Products · MAYCSS",
    "Browse fashion products at MAYCSS — women clothes, dresses, jeans and denim, womens t shirts, and clothes on sale. A curated cheap clothing brand edit with wholesale clothing reach.",
    [
      "MAYCSS",
      "fashion products",
      "women clothes",
      "wholesale clothing",
      "cheap online clothing",
      "clothes on sale",
      "jeans and denim",
      "dresses for women",
    ],
  );
}

{
  const p = bySlug.sale;
  setSeo(
    p,
    "Clothes on Sale & Friday Sale · MAYCSS",
    "Shop clothes on sale and friday sale fashion at MAYCSS — womens clothes sale, cheap online clothing, and affordable plus size clothing in a curated luxury edit.",
    [
      "MAYCSS",
      "clothes on sale",
      "friday sale",
      "womens clothes sale",
      "cheap online clothing",
      "affordable plus size clothing",
      "cheap plus size clothes",
    ],
  );
}

writeFileSync(pagesPath, JSON.stringify(pages, null, 2) + "\n", "utf8");
console.log("Updated home, shop, and sale page SEO");
