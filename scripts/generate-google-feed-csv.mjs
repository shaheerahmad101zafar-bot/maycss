/**
 * Generate a static Google Merchant Center CSV at public/google-feed.csv.
 *
 * Reads the live catalog from Blob (falls back to local data/products.json).
 * Does NOT modify product images, layouts, or admin settings.
 *
 * Usage:
 *   node scripts/generate-google-feed-csv.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ORIGIN = "https://www.myacssstore.store";
const OUT = join(root, "public", "google-feed.csv");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

function csvCell(value) {
  const raw = String(value ?? "")
    .replace(/\r\n/g, " ")
    .replace(/[\r\n]+/g, " ")
    .trim();
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function absoluteUrl(maybeUrl) {
  const raw = String(maybeUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `${ORIGIN}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function formatPriceUsd(amount) {
  return `${Number(amount).toFixed(2)} USD`;
}

function feedBrand(p) {
  const brand = String(p.brand || "").trim();
  if (
    brand &&
    !/^(n\/?a|na|none|null|undefined|unknown|tbd|test|brand|-|\.)$/i.test(brand)
  ) {
    return brand;
  }
  return "MAYCSS";
}

function feedDescription(p) {
  const raw =
    stripHtml(p.description) ||
    stripHtml(p.seo?.metaDescription) ||
    "";
  if (raw) return raw;
  const name = String(p.name || "Fashion product").trim();
  return `${name} by ${feedBrand(p)} — curated fashion from MAYCSS.`;
}

function isEligible(p) {
  if (p.status === "draft") return false;
  if (!String(p.name || "").trim()) return false;
  if (!String(p.image || "").trim()) return false;
  const price = Number(p.price);
  return Number.isFinite(price) && price > 0;
}

async function loadProducts() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    try {
      const r = await get("data/products.json", {
        access: "public",
        token,
        useCache: false,
      });
      const products = JSON.parse(await new Response(r.stream).text());
      console.log(`Loaded ${products.length} products from Blob`);
      return products;
    } catch (err) {
      console.warn("Blob read failed, falling back to local:", err.message);
    }
  }
  const products = JSON.parse(
    readFileSync(join(root, "data/products.json"), "utf8"),
  );
  console.log(`Loaded ${products.length} products from local disk`);
  return products;
}

const products = await loadProducts();
const eligible = products.filter(isEligible);

const header = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "availability",
  "price",
  "brand",
];

const rows = eligible.map((p) => {
  const id = String(p.id);
  const onSale =
    typeof p.originalPrice === "number" && p.originalPrice > p.price;
  const cells = [
    id,
    truncate(String(p.name).trim(), 150),
    feedDescription(p).slice(0, 5000),
    `${ORIGIN}/product/${encodeURIComponent(id)}`,
    absoluteUrl(p.image),
    "in_stock",
    formatPriceUsd(onSale ? p.originalPrice : p.price),
    feedBrand(p),
  ];
  return cells.map(csvCell).join(",");
});

mkdirSync(dirname(OUT), { recursive: true });
const body = `\uFEFF${[header.join(","), ...rows].join("\r\n")}\r\n`;
writeFileSync(OUT, body, "utf8");
console.log(`Wrote ${OUT} (${eligible.length} products)`);
