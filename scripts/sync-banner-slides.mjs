import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, put } from "@vercel/blob";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
} catch {
  // ignore
}

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("no token");
  process.exit(1);
}

async function forcePut(pathname, data) {
  try {
    await del(pathname, { token });
  } catch {
    // ignore
  }
  await put(pathname, JSON.stringify(data, null, 2) + "\n", {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

const slides = JSON.parse(
  readFileSync(join(root, "data/banner-slides.json"), "utf8"),
);
await forcePut("data/banner-slides.json", slides);
console.log("synced slides", slides.length);
