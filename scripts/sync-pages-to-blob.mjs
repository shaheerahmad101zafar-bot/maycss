/**
 * Upload local data/pages.json to Vercel Blob (production content store).
 * Matches lib/storage/json-store writeBlobJson: delete → put with no CDN linger.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const pathname = "data/pages.json";
const body = readFileSync(join(root, pathname));

try {
  await del(pathname, { token });
  console.log("Deleted previous blob (CDN bust)");
} catch {
  console.log("No previous blob to delete");
}

const result = await put(pathname, body, {
  access: "public",
  token,
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  // Mutable CMS JSON — do not leave a 30-day CDN copy after overwrite.
  cacheControlMaxAge: 60,
});

console.log("Synced", pathname, "→", result.url);

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://maycss.vercel.app").replace(
  /\/$/,
  "",
);
const secret = process.env.REVALIDATE_SECRET?.trim();
if (secret) {
  const res = await fetch(`${site}/api/revalidate/cms`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify({ paths: ["/", "/sale", "/shop", "/about", "/contact"] }),
  });
  console.log("Revalidate", res.status, await res.text());
} else {
  console.log(
    "Tip: set REVALIDATE_SECRET + redeploy, then re-run to purge live page cache.",
  );
}
