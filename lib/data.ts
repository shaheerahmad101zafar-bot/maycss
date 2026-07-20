import "server-only";

import type { BannerSlide, Category, Product } from "./utils";
import {
  deleteStoreJson,
  readStoreJson,
  writeStoreJson,
} from "./storage/json-store";

const productsFile = "data/products.json";
const productDeletedIdsFile = "data/products/deleted-ids.json";
const slidesFile = "data/banner-slides.json";
const categoriesFile = "data/categories.json";
const categoryDeletedIdsFile = "data/categories/deleted-ids.json";

/** Per-product Blob path — avoids stale CDN reads of the shared products.json. */
function productRecordPath(id: string | number): string {
  return `data/products/by-id/${String(id)}.json`;
}

async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  return readStoreJson(relativePath, fallback);
}

async function writeJson(relativePath: string, data: unknown): Promise<void> {
  await writeStoreJson(relativePath, data);
}

async function readDeletedIds(file: string): Promise<string[]> {
  const raw = await readJson<unknown>(file, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id)).filter(Boolean);
}

async function writeDeletedIds(file: string, ids: string[]): Promise<void> {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  await writeJson(file, unique);
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export async function getProducts(): Promise<Product[]> {
  const [list, deleted] = await Promise.all([
    readJson<Product[]>(productsFile, []),
    readDeletedIds(productDeletedIdsFile),
  ]);
  if (deleted.length === 0) return list;
  const banned = new Set(deleted);
  return list.filter((p) => !banned.has(String(p.id)));
}

export async function getProductById(
  id: string | number,
): Promise<Product | undefined> {
  const deleted = await readDeletedIds(productDeletedIdsFile);
  if (deleted.includes(String(id))) return undefined;

  // Prefer the per-id record. Overwriting data/products.json can leave the Blob
  // CDN serving a pre-import snapshot for up to ~60s; a brand-new by-id path
  // has no stale cache entry, so "Review draft" stops 404ing.
  const fromRecord = await readJson<Product | null>(
    productRecordPath(id),
    null,
  );
  if (fromRecord && String(fromRecord.id) === String(id)) {
    return fromRecord;
  }

  const list = await getProducts();
  return list.find((p) => String(p.id) === String(id));
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const list = await getProducts();
  const others = list.filter((p) => p.id !== product.id);
  const scored = others
    .map((p) => {
      let score = 0;
      if (product.categoryId && p.categoryId === product.categoryId) score += 4;
      if (product.category && p.category === product.category) score += 2;
      if (product.brand && p.brand === product.brand) score += 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}

export async function getNewArrivals(): Promise<Product[]> {
  const list = await getProducts();
  return list.filter((p) => p.isNew);
}

export async function getSaleItems(): Promise<Product[]> {
  const list = await getProducts();
  return list.filter(
    (p) => typeof p.originalPrice === "number" && p.originalPrice > p.price,
  );
}

export async function getBrands(): Promise<
  { brand: string; sample: Product; count: number }[]
> {
  const list = await getProducts();
  const map = new Map<string, { sample: Product; count: number }>();
  for (const p of list) {
    if (!p.brand) continue;
    const cur = map.get(p.brand);
    if (cur) cur.count += 1;
    else map.set(p.brand, { sample: p, count: 1 });
  }
  return Array.from(map.entries()).map(([brand, v]) => ({
    brand,
    sample: v.sample,
    count: v.count,
  }));
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  const list = await getProducts();
  return list.filter(
    (p) => p.brand && p.brand.toLowerCase() === brand.toLowerCase(),
  );
}

export async function getBannerSlides(): Promise<BannerSlide[]> {
  return readJson<BannerSlide[]>(slidesFile, []);
}

export async function saveProductRecord(product: Product): Promise<void> {
  await writeJson(productRecordPath(product.id), product);
}

export async function deleteProductRecord(
  id: string | number,
): Promise<void> {
  await deleteStoreJson(productRecordPath(id));
}

/**
 * Mark product IDs deleted immediately (survives stale products.json CDN),
 * rewrite the catalog without them, and remove per-id records.
 */
export async function removeProductsByIds(
  ids: Array<string | number>,
): Promise<number> {
  const wanted = [...new Set(ids.map(String).filter(Boolean))];
  if (wanted.length === 0) return 0;

  const banned = new Set(wanted);
  const [existingDeleted, rawList] = await Promise.all([
    readDeletedIds(productDeletedIdsFile),
    readJson<Product[]>(productsFile, []),
  ]);

  // Tombstone first so a stale CDN list cannot resurrect these IDs.
  await writeDeletedIds(productDeletedIdsFile, [...existingDeleted, ...wanted]);

  const next = rawList.filter((p) => !banned.has(String(p.id)));
  await writeJson(productsFile, next);
  await Promise.all(wanted.map((id) => deleteProductRecord(id)));

  const pruned = [...new Set([...existingDeleted, ...wanted])].filter(
    (id) => !next.some((p) => String(p.id) === id),
  );
  await writeDeletedIds(productDeletedIdsFile, pruned);

  return wanted.length;
}

export async function saveProducts(products: Product[]): Promise<void> {
  await writeJson(productsFile, products);
  // Creating/saving products clears their tombstones if they were re-added.
  const deleted = await readDeletedIds(productDeletedIdsFile);
  if (deleted.length === 0) return;
  const keep = new Set(products.map((p) => String(p.id)));
  const nextDeleted = deleted.filter((id) => !keep.has(id));
  if (nextDeleted.length !== deleted.length) {
    await writeDeletedIds(productDeletedIdsFile, nextDeleted);
  }
}

/** Persist the catalog list and refresh per-id records for the touched products. */
export async function saveProductsWithRecords(
  products: Product[],
  touched: Product[],
): Promise<void> {
  await saveProducts(products);
  await Promise.all(touched.map((p) => writeJson(productRecordPath(p.id), p)));
}

export function nextProductId(products: Product[]): number {
  const numericIds = products
    .map((p) => Number(p.id))
    .filter((n) => Number.isFinite(n)) as number[];
  return numericIds.length ? Math.max(...numericIds) + 1 : 1;
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<Category[]> {
  const [list, deleted] = await Promise.all([
    readJson<Category[]>(categoriesFile, []),
    readDeletedIds(categoryDeletedIdsFile),
  ]);
  const filtered =
    deleted.length === 0
      ? list
      : list.filter((c) => !new Set(deleted).has(String(c.id)));
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const list = await getCategories();
  return list.find((c) => c.slug === slug);
}

export async function getCategoryById(
  id: string,
): Promise<Category | undefined> {
  const list = await getCategories();
  return list.find((c) => c.id === id);
}

export async function getTopLevelCategories(): Promise<Category[]> {
  const list = await getCategories();
  return list.filter((c) => c.parentId === null);
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const list = await getCategories();
  return list.filter((c) => c.parentId === parentId);
}

/** Products whose categoryId matches this category OR any descendant. */
export async function getProductsByCategoryId(
  categoryId: string,
): Promise<Product[]> {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const descendantIds = new Set<string>([categoryId]);
  const frontier = [categoryId];
  while (frontier.length) {
    const current = frontier.pop()!;
    for (const c of categories) {
      if (c.parentId === current) {
        descendantIds.add(c.id);
        frontier.push(c.id);
      }
    }
  }
  return products.filter((p) => p.categoryId && descendantIds.has(p.categoryId));
}

export async function removeCategoriesByIds(ids: string[]): Promise<void> {
  const wanted = [...new Set(ids.map(String).filter(Boolean))];
  if (wanted.length === 0) return;
  const banned = new Set(wanted);
  const [existingDeleted, rawList] = await Promise.all([
    readDeletedIds(categoryDeletedIdsFile),
    readJson<Category[]>(categoriesFile, []),
  ]);
  await writeDeletedIds(categoryDeletedIdsFile, [...existingDeleted, ...wanted]);
  const next = rawList.filter((c) => !banned.has(String(c.id)));
  await writeJson(categoriesFile, next);
  const pruned = [...new Set([...existingDeleted, ...wanted])].filter(
    (id) => !next.some((c) => String(c.id) === id),
  );
  await writeDeletedIds(categoryDeletedIdsFile, pruned);
}

export async function saveCategories(list: Category[]): Promise<void> {
  await writeJson(categoriesFile, list);
  const deleted = await readDeletedIds(categoryDeletedIdsFile);
  if (deleted.length === 0) return;
  const keep = new Set(list.map((c) => String(c.id)));
  const nextDeleted = deleted.filter((id) => !keep.has(id));
  if (nextDeleted.length !== deleted.length) {
    await writeDeletedIds(categoryDeletedIdsFile, nextDeleted);
  }
}
