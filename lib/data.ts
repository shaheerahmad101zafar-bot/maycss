import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { BannerSlide, Category, Product } from "./utils";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const slidesFile = path.join(dataDir, "banner-slides.json");
const categoriesFile = path.join(dataDir, "categories.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export async function getProducts(): Promise<Product[]> {
  return readJson<Product[]>(productsFile, []);
}

export async function getProductById(
  id: string | number,
): Promise<Product | undefined> {
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

export async function saveProducts(products: Product[]): Promise<void> {
  await writeJson(productsFile, products);
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
  const list = await readJson<Category[]>(categoriesFile, []);
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

export async function saveCategories(list: Category[]): Promise<void> {
  await writeJson(categoriesFile, list);
}
