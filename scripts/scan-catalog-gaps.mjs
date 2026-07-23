/**
 * Scan Blob (or local) catalog for missing descriptions, colors, invalid prices.
 * Usage: node scripts/scan-catalog-gaps.mjs [--local]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const useLocal = process.argv.includes("--local");

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

async function loadProducts() {
  if (useLocal) {
    return JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  const r = await get("data/products.json", {
    access: "public",
    token,
    useCache: false,
  });
  return JSON.parse(await new Response(r.stream).text());
}

const SHORT_DESC = 40;
const products = await loadProducts();
console.log(`source=${useLocal ? "local" : "blob"} count=${products.length}`);

const report = {
  noDesc: [],
  shortDesc: [],
  badPrice: [],
  noColors: [],
  incompleteColorNames: [],
  missingImage: [],
};

for (const x of products) {
  const d = String(x.description || "").trim();
  if (!d) report.noDesc.push({ id: x.id, name: x.name });
  else if (d.length < SHORT_DESC) {
    report.shortDesc.push({ id: x.id, name: x.name, len: d.length });
  }

  const pr = Number(x.price);
  if (!Number.isFinite(pr) || pr <= 0) {
    report.badPrice.push({ id: x.id, name: x.name, price: x.price });
  }

  const colors = Array.isArray(x.colors) ? x.colors : [];
  if (colors.length === 0) {
    report.noColors.push({
      id: x.id,
      name: x.name,
      colorImageKeys: x.colorImages ? Object.keys(x.colorImages) : [],
    });
  } else if (colors.some((c) => !c || !String(c.name || "").trim())) {
    report.incompleteColorNames.push({ id: x.id, name: x.name });
  }

  if (!String(x.image || "").trim()) {
    report.missingImage.push({ id: x.id, name: x.name });
  }
}

const summary = Object.fromEntries(
  Object.entries(report).map(([k, v]) => [k, v.length]),
);
console.log(JSON.stringify(summary, null, 2));

const out = join(root, "scripts/catalog-gaps-report.json");
writeFileSync(
  out,
  JSON.stringify({ source: useLocal ? "local" : "blob", summary, report }, null, 2) +
    "\n",
);
console.log(`wrote ${out}`);
