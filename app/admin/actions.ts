"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  getAdminPassword,
  getSessionToken,
} from "@/lib/auth";
import {
  getCategories,
  getProductById,
  getProducts,
  nextProductId,
  removeCategoriesByIds,
  removeProductsByIds,
  saveCategories,
  saveProducts,
  saveProductsWithRecords,
} from "@/lib/data";
import type {
  Category,
  Product,
  ProductColor,
  ProductSpec,
} from "@/lib/utils";
import {
  getSettings,
  saveSettings,
  type ManualPaymentMethod,
  type PaymentSettings,
} from "@/lib/settings";
import { DynamicAdapter } from "@/lib/payments/dynamic";
import {
  getOrderById,
  replaceOrder,
  transitionOrder,
  ORDER_STATUSES,
  type OrderStatus,
  type OrderTracking,
} from "@/lib/orders";
import { getEmailAdapter } from "@/lib/email";
import { renderOrderStatusEmail } from "@/lib/email/templates/order-status";
import { getAppConfig, saveAppConfig, type AppConfig } from "@/lib/app-config";
import { PageFactory, type Page } from "@/lib/pages";
import { makeBlockId, normalizeBlock, type ContentBlock } from "@/lib/blocks/types";
import { scrapeProductUrl } from "@/lib/scraper";
import { generateProductContent } from "@/lib/ai/product-content-writer";
import { MenuFactory, type MenuLink } from "@/lib/menus";
import { rethrowIfNavigationError } from "@/lib/navigation-errors";
import { StoreWriteError } from "@/lib/storage/json-store";

/* -------------------------------------------------------------------------- */
/*  Auth                                                                      */
/* -------------------------------------------------------------------------- */

export type LoginState = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");
  if (password !== getAdminPassword()) {
    return { ok: false, error: "Incorrect password. Try again." };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  const safeFrom = from.startsWith("/admin") ? from : "/admin";
  redirect(safeFrom);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/*  Menus                                                                     */
/* -------------------------------------------------------------------------- */

export type MenusFormState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function saveMenusAction(
  _prev: MenusFormState,
  formData: FormData,
): Promise<MenusFormState> {
  const raw = String(formData.get("linksJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Menu payload was malformed. Reload and retry." };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Menu payload must be an array." };
  }
  // Trust the shape came from the same client; sanitize label/href just in case.
  const links: MenuLink[] = parsed
    .map((l, i) => {
      const link = l as Record<string, unknown>;
      const label = String(link.label ?? "").trim();
      const href = String(link.href ?? "").trim();
      if (!label || !href) return null;
      return {
        id:
          typeof link.id === "string" && link.id
            ? link.id
            : `menu_${Date.now().toString(36)}_${i}`,
        label,
        href,
        location: link.location === "footer" ? "footer" : "header",
        order: typeof link.order === "number" ? link.order : i,
        visible: link.visible !== false,
        external: Boolean(link.external),
        column:
          link.column === "shop" ||
          link.column === "company" ||
          link.column === "legal"
            ? (link.column as MenuLink["column"])
            : undefined,
      } as MenuLink;
    })
    .filter((l): l is MenuLink => l !== null);

  await MenuFactory.replaceAll(links);
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Saved. ${links.length} link${links.length === 1 ? "" : "s"} live across the site.`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export type ProductFormState =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

function parseSizes(input: string) {
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}
function parseGallery(input: string) {
  return input.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
function parseColors(input: string): ProductColor[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(":").map((s) => s.trim());
      return {
        name: name || line,
        hex: hex && /^#?[0-9a-fA-F]{3,8}$/.test(hex)
          ? hex.startsWith("#")
            ? hex
            : `#${hex}`
          : "#cccccc",
      };
    });
}

function parseColorImagesJson(raw: string): Product["colorImages"] | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const out: NonNullable<Product["colorImages"]> = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      const name = key.trim();
      if (!name || !val || typeof val !== "object") continue;
      const row = val as Record<string, unknown>;
      const image = String(row.image ?? "").trim();
      if (!image) continue;
      const gallery = Array.isArray(row.gallery)
        ? row.gallery.map((u) => String(u).trim()).filter(Boolean)
        : undefined;
      out[name] = {
        image,
        gallery: gallery && gallery.length > 0 ? gallery : undefined,
      };
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

function parseSpecs(input: string): ProductSpec[] {
  return input
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf(":");
      if (i === -1) return null;
      const label = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim();
      return label && value ? { label, value } : null;
    })
    .filter((v): v is ProductSpec => v !== null);
}

export async function upsertProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const idField = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const priceRaw = formData.get("price");
  const originalPriceRaw = formData.get("originalPrice");
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const isNew = formData.get("isNew") === "on";
  const galleryRaw = String(formData.get("gallery") ?? "").trim();
  const sizesRaw = String(formData.get("sizes") ?? "").trim();
  const colorsRaw = String(formData.get("colors") ?? "").trim();
  const specsRaw = String(formData.get("specs") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  if (!image) errors.image = "Primary image URL is required.";
  else if (!/^https?:\/\//i.test(image))
    errors.image = "Image URL must start with http(s)://";
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0)
    errors.price = "Price must be a positive number.";
  let originalPrice: number | undefined;
  if (originalPriceRaw && String(originalPriceRaw).trim() !== "") {
    const op = Number(originalPriceRaw);
    if (!Number.isFinite(op) || op <= price)
      errors.originalPrice = "Original price must be greater than sale price.";
    else originalPrice = op;
  }
  if (categoryId) {
    const cats = await getCategories();
    if (!cats.some((c) => c.id === categoryId))
      errors.categoryId = "Please select a valid category.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const products = await getProducts();
  const existing = idField
    ? products.find((p) => String(p.id) === idField)
    : undefined;

  const gallery = parseGallery(galleryRaw);
  const sizes = parseSizes(sizesRaw);
  const colors = parseColors(colorsRaw);
  const specs = parseSpecs(specsRaw);
  const colorImagesFromForm = parseColorImagesJson(
    String(formData.get("colorImagesJson") ?? ""),
  );

  // Parse dynamic content blocks (same block factory used by CMS pages).
  const contentBlocksRaw = String(formData.get("contentBlocksJson") ?? "").trim();
  let contentBlocks: ContentBlock[] | undefined;
  if (contentBlocksRaw) {
    try {
      const parsed = JSON.parse(contentBlocksRaw) as unknown;
      if (Array.isArray(parsed)) {
        contentBlocks = parsed
          .map((b) => normalizeBlock(b))
          .filter((b): b is ContentBlock => b !== null);
        if (contentBlocks.length === 0) contentBlocks = undefined;
      }
    } catch {
      // fall through — leave existing blocks untouched
      contentBlocks = existing?.contentBlocks;
    }
  } else {
    contentBlocks = existing?.contentBlocks;
  }

  const newProduct: Product = {
    id: existing ? existing.id : nextProductId(products),
    name,
    brand: brand || undefined,
    image,
    gallery: gallery.length ? gallery : undefined,
    price,
    originalPrice,
    rating: existing?.rating,
    reviews: existing?.reviews,
    badge: badge || undefined,
    isNew,
    category: categoryId || existing?.category,
    categoryId: categoryId || undefined,
    description: description || undefined,
    specs: specs.length ? specs : undefined,
    sizes: sizes.length ? sizes : undefined,
    colors: colors.length ? colors : undefined,
    colorImages: colorImagesFromForm ?? existing?.colorImages,
    status: formData.get("publish") === "on" ? "published" : "draft",
    sourceUrl: existing?.sourceUrl,
    contentBlocks,
    seo: (() => {
      const mt = String(formData.get("metaTitle") ?? "").trim();
      const md = String(formData.get("metaDescription") ?? "").trim();
      const og = String(formData.get("ogImage") ?? "").trim();
      const fk = String(formData.get("seoFocusKeyword") ?? "").trim();
      const kws = parseKeywordsJson(
        String(formData.get("seoKeywordsJson") ?? ""),
      );
      if (!mt && !md && !og && !fk && kws.length === 0) return existing?.seo;
      return {
        metaTitle: mt || undefined,
        metaDescription: md || undefined,
        ogImage: og || undefined,
        focusKeyword: fk || undefined,
        keywords: kws.length ? kws : undefined,
      };
    })(),
  };

  const next = existing
    ? products.map((p) => (p.id === existing.id ? newProduct : p))
    : [...products, newProduct];
  try {
    await saveProductsWithRecords(next, [newProduct]);
  } catch (err) {
    rethrowIfNavigationError(err);
    const message =
      err instanceof StoreWriteError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not save product.";
    return { ok: false, errors: { _form: message } };
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

/* -------------------------------------------------------------------------- */
/*  Product importer — URL scrape + auto-content + draft workflow             */
/* -------------------------------------------------------------------------- */

export type ImportProductState =
  | { ok: true; productId: string | number }
  | { ok: false; error: string; productId?: string | number };

export async function importProductFromUrlAction(
  _prev: ImportProductState | null,
  formData: FormData,
): Promise<ImportProductState> {
  try {
    const url = String(formData.get("url") ?? "").trim();
    const focusKeyword = String(formData.get("focusKeyword") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const additionalKeywordsRaw = String(
      formData.get("additionalKeywords") ?? "",
    ).trim();

    if (!url) return { ok: false, error: "Paste a product URL to import." };
    if (!focusKeyword) {
      return {
        ok: false,
        error:
          "Set a focus keyword — the auto-content writer needs it to hit SEO targets.",
      };
    }

    const scraped = await scrapeProductUrl(url);
    if (!scraped.ok) return { ok: false, error: scraped.error };

    const p = scraped.product;
    const [products, cfg] = await Promise.all([getProducts(), getAppConfig()]);
    const additionalKeywords = additionalKeywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    // Generate long-form SEO content blocks + humanise.
    const contentBlocks = generateProductContent({
      name: p.name ?? "Untitled product",
      brand: p.brand,
      description: p.description,
      category: p.category,
      price: p.price,
      sizes: p.sizes,
      colors: p.colors,
      features: p.features,
      sizeAndFit: p.sizeAndFit,
      focusKeyword,
      additionalKeywords,
    });

    const metaDescription = (
      p.description ||
      (p.features?.length ? p.features.slice(0, 2).join(". ") : "") ||
      `${p.name} — curated at ${cfg.siteName}.`
    ).slice(0, 155);

    const firstColor = p.colors?.[0];
    const colorSet =
      firstColor && p.colorImages?.[firstColor]
        ? p.colorImages[firstColor]
        : undefined;

    const newProduct: Product = {
      id: nextProductId(products),
      name: p.name ?? "Imported product",
      brand: p.brand,
      image: colorSet?.image ?? p.images?.[0] ?? "",
      gallery:
        colorSet?.gallery ??
        (p.images && p.images.length > 1 ? p.images.slice(1) : undefined),
      price: p.price ?? 0,
      originalPrice: p.originalPrice,
      rating: p.rating,
      reviews: p.reviewCount,
      description: p.description,
      categoryId: categoryId || undefined,
      category: categoryId || p.category,
      sizes: p.sizes,
      colors: p.colors?.map((name, i) => ({
        name,
        hex:
          p.colorHex?.[i] && /^#?[0-9a-fA-F]{6}$/i.test(p.colorHex[i])
            ? p.colorHex[i].startsWith("#")
              ? p.colorHex[i]
              : `#${p.colorHex[i]}`
            : "#cccccc",
      })),
      colorImages: p.colorImages,
      status: "draft",
      sourceUrl: p.sourceUrl,
      contentBlocks,
      seo: {
        focusKeyword,
        keywords: additionalKeywords.length ? additionalKeywords : undefined,
        metaTitle: `${p.name} · ${cfg.siteName}`.slice(0, 60),
        metaDescription,
      },
    };

    // Write catalog + a fresh per-id Blob record. The shared products.json path
    // can stay CDN-stale right after overwrite; by-id is a new URL so edit works.
    await saveProductsWithRecords([...products, newProduct], [newProduct]);

    const saved = await getProductById(newProduct.id);
    if (!saved) {
      return {
        ok: false,
        error:
          "Product was written but could not be re-loaded yet. Wait a few seconds, then open Products → Drafts.",
        productId: newProduct.id,
      };
    }

    const editPath = `/admin/products/${String(newProduct.id)}/edit`;
    revalidatePath("/admin/products");
    revalidatePath(editPath);
    // Land on the edit screen (publish / save) — same flow as manual product create.
    redirect(editPath);
  } catch (err) {
    rethrowIfNavigationError(err);
    console.error("[importProductFromUrlAction]", err);
    return {
      ok: false,
      error:
        err instanceof StoreWriteError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Import failed unexpectedly. Try again.",
    };
  }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/admin/products?error=delete-failed");
  }
  try {
    await removeProductsByIds([id]);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    redirect("/admin/products?deleted=1");
  } catch (err) {
    rethrowIfNavigationError(err);
    console.error("[deleteProductAction]", err);
    redirect("/admin/products?error=delete-failed");
  }
}

export async function deleteProductsBulkAction(
  formData: FormData,
): Promise<void> {
  const raw = String(formData.get("ids") ?? "").trim();
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    redirect("/admin/products?error=none-selected");
  }
  try {
    await removeProductsByIds(ids);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    redirect(`/admin/products?deleted=${ids.length}`);
  } catch (err) {
    rethrowIfNavigationError(err);
    console.error("[deleteProductsBulkAction]", err);
    redirect("/admin/products?error=delete-failed");
  }
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export type CategoryFormState =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function upsertCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    return await upsertCategoryCore(formData);
  } catch (err) {
    rethrowIfNavigationError(err);
    return {
      ok: false,
      errors: {
        _form:
          err instanceof StoreWriteError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not save category. Check Vercel Blob storage is connected.",
      },
    };
  }
}

async function upsertCategoryCore(
  formData: FormData,
): Promise<CategoryFormState> {
  const idField = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slugField = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const orderRaw = String(formData.get("order") ?? "").trim();
  // SEO
  const seoMetaTitle = String(formData.get("metaTitle") ?? "").trim();
  const seoMetaDescription = String(
    formData.get("metaDescription") ?? "",
  ).trim();
  const seoOgImage = String(formData.get("ogImage") ?? "").trim();
  const seoFocusKeyword = String(formData.get("seoFocusKeyword") ?? "").trim();
  const seoKeywords = parseKeywordsJson(
    String(formData.get("seoKeywordsJson") ?? ""),
  );

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  const slug = slugField ? slugify(slugField) : slugify(name);
  if (!slug) errors.slug = "Could not derive a slug — please enter one.";
  const cats = await getCategories();
  const existing = idField ? cats.find((c) => c.id === idField) : undefined;
  if (slug && cats.some((c) => c.slug === slug && c.id !== existing?.id))
    errors.slug = "Another category already has that slug.";
  if (parentId) {
    if (!cats.some((c) => c.id === parentId))
      errors.parentId = "Parent category does not exist.";
    else if (existing && parentId === existing.id)
      errors.parentId = "A category cannot be its own parent.";
    else if (existing) {
      const descendantIds = new Set<string>();
      const stack = [existing.id];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const c of cats)
          if (c.parentId === cur) {
            descendantIds.add(c.id);
            stack.push(c.id);
          }
      }
      if (descendantIds.has(parentId))
        errors.parentId = "Cannot set parent to a sub-category of this one.";
    }
  }
  const order = orderRaw ? Number(orderRaw) : undefined;
  if (orderRaw && !Number.isFinite(order)) errors.order = "Must be a number.";
  if (image && !image.startsWith("/uploads/") && !/^https?:\/\//i.test(image))
    errors.image = "Image must be uploaded or an http(s):// URL.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const seoField: Category["seo"] | undefined =
    seoMetaTitle ||
    seoMetaDescription ||
    seoOgImage ||
    seoFocusKeyword ||
    seoKeywords.length > 0
      ? {
          metaTitle: seoMetaTitle || undefined,
          metaDescription: seoMetaDescription || undefined,
          ogImage: seoOgImage || undefined,
          focusKeyword: seoFocusKeyword || undefined,
          keywords: seoKeywords.length ? seoKeywords : undefined,
        }
      : undefined;

  const newCategory: Category = {
    id: existing ? existing.id : slug,
    slug,
    name,
    parentId: parentId || null,
    order: Number.isFinite(order) ? order : existing?.order,
    description: description || undefined,
    image: image || undefined,
    seo: seoField,
  };
  const next = existing
    ? cats.map((c) => (c.id === existing.id ? newCategory : c))
    : [...cats, newCategory];
  await saveCategories(next);
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

/**
 * Delete a category with an explicit strategy for its descendants + products:
 *   - "force"   → delete this category (no children allowed); products → Uncategorised
 *   - "orphan"  → sub-categories become top-level; products → Uncategorised
 *   - "cascade" → sub-categories deleted too; products → Uncategorised
 */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const strategy = String(formData.get("strategy") ?? "force").trim() as
    | "force"
    | "orphan"
    | "cascade";
  if (!id) {
    redirect("/admin/categories?error=delete-failed");
  }

  try {
    const [cats, products] = await Promise.all([
      getCategories(),
      getProducts(),
    ]);
    const hasChildren = cats.some((c) => c.parentId === id);

    if (strategy === "force") {
      if (hasChildren) {
        redirect("/admin/categories?error=has-children");
      }
      const productRefs = products.filter((p) => p.categoryId === id);
      if (productRefs.length > 0) {
        const nextProducts = products.map((p) =>
          p.categoryId === id
            ? { ...p, categoryId: undefined, category: undefined }
            : p,
        );
        const touched = nextProducts.filter((p) =>
          productRefs.some((a) => a.id === p.id),
        );
        await saveProductsWithRecords(nextProducts, touched);
      }
      await removeCategoriesByIds([id]);
      revalidatePath("/", "layout");
      revalidatePath("/admin/categories");
      redirect("/admin/categories?deleted=1");
    }

    const toDelete = new Set<string>([id]);
    if (strategy === "cascade") {
      const stack = [id];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const c of cats) {
          if (c.parentId === cur && !toDelete.has(c.id)) {
            toDelete.add(c.id);
            stack.push(c.id);
          }
        }
      }
    }

    const nextCats: Category[] = cats
      .filter((c) => !toDelete.has(c.id))
      .map((c) => {
        if (c.parentId && toDelete.has(c.parentId)) {
          return { ...c, parentId: null };
        }
        return c;
      });

    const affectedProducts = products.filter(
      (p) => p.categoryId && toDelete.has(p.categoryId),
    );
    if (affectedProducts.length > 0) {
      const nextProducts = products.map((p) =>
        p.categoryId && toDelete.has(p.categoryId)
          ? { ...p, categoryId: undefined, category: undefined }
          : p,
      );
      const touched = nextProducts.filter((p) =>
        affectedProducts.some((a) => a.id === p.id),
      );
      await saveProductsWithRecords(nextProducts, touched);
    }

    await removeCategoriesByIds([...toDelete]);
    if (strategy === "orphan") {
      // Persist re-parented survivors (parentId → null).
      await saveCategories(nextCats);
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/categories");
    redirect("/admin/categories?deleted=1");
  } catch (err) {
    rethrowIfNavigationError(err);
    console.error("[deleteCategoryAction]", err);
    redirect("/admin/categories?error=delete-failed");
  }
}

/* -------------------------------------------------------------------------- */
/*  Payment settings — universal merchant                                     */
/* -------------------------------------------------------------------------- */

export type SettingsFormState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function parseManualMethods(raw: string): ManualPaymentMethod[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((m): ManualPaymentMethod | null => {
        if (!m || typeof m !== "object") return null;
        const o = m as Record<string, unknown>;
        return {
          id: String(o.id ?? Math.random().toString(36).slice(2)),
          name: String(o.name ?? "").trim(),
          qrCode: String(o.qrCode ?? "").trim(),
          discountPercent: Math.max(
            0,
            Math.min(100, Number(o.discountPercent) || 0),
          ),
          instructions: String(o.instructions ?? "").trim(),
          enabled: Boolean(o.enabled),
        };
      })
      .filter((m): m is ManualPaymentMethod => m !== null && m.name.length > 0);
  } catch {
    return [];
  }
}

export async function updatePaymentSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const manualMethods = parseManualMethods(
    String(formData.get("manualMethodsJson") ?? ""),
  );

  // Validate manual methods — allow either uploaded paths (/uploads/…)
  // or external URLs (http(s)://…).
  for (const m of manualMethods) {
    if (m.enabled) {
      const q = m.qrCode.trim();
      if (!q) {
        return {
          ok: false,
          error: `${m.name}: upload a QR code image (or disable this method).`,
        };
      }
      const isUploaded = q.startsWith("/uploads/");
      const isUrl = /^https?:\/\//i.test(q);
      if (!isUploaded && !isUrl) {
        return {
          ok: false,
          error: `${m.name}: QR code must be an uploaded image or an http(s):// URL.`,
        };
      }
    }
  }

  const next: PaymentSettings = {
    provider: String(formData.get("provider") ?? "stripe").trim() || "stripe",
    merchantName: String(formData.get("merchantName") ?? "").trim(),
    apiKey: String(formData.get("apiKey") ?? "").trim(),
    secretKey: String(formData.get("secretKey") ?? "").trim(),
    merchantId: String(formData.get("merchantId") ?? "").trim(),
    environment:
      String(formData.get("environment") ?? "sandbox") === "live"
        ? "live"
        : "sandbox",
    apiBaseUrl: String(formData.get("apiBaseUrl") ?? "").trim(),
    webhookSecret: String(formData.get("webhookSecret") ?? "").trim(),
    successRedirectPath: String(formData.get("successRedirectPath") ?? "").trim(),
    currency: String(formData.get("currency") ?? "usd").trim().toLowerCase(),
    enabled: formData.get("enabled") === "on",
    manualMethods,
  };

  // Only validate credentials if the CARD gateway is enabled.
  if (next.enabled) {
    const adapter = new DynamicAdapter(next);
    const result = await adapter.validateCredentials();
    if (!result.ok) {
      return { ok: false, error: `Card gateway: ${result.error}` };
    }
    const settings = await getSettings();
    await saveSettings({ ...settings, payments: next });
    revalidatePath("/admin/settings/payments");
    revalidatePath("/checkout");
    const activeManual = manualMethods.filter((m) => m.enabled).length;
    return {
      ok: true,
      message: `Saved. Card gateway is live in ${result.value.mode} mode${
        activeManual > 0 ? ` alongside ${activeManual} manual method(s)` : ""
      }.`,
    };
  }

  const settings = await getSettings();
  await saveSettings({ ...settings, payments: next });
  revalidatePath("/admin/settings/payments");
  revalidatePath("/checkout");
  const activeManual = manualMethods.filter((m) => m.enabled).length;
  return {
    ok: true,
    message:
      activeManual > 0
        ? `Saved. Card gateway is off; ${activeManual} manual method(s) are available at checkout.`
        : "Saved. No payment methods active — checkout uses the dev-console adapter.",
  };
}

/* -------------------------------------------------------------------------- */
/*  Order lifecycle                                                           */
/* -------------------------------------------------------------------------- */

export type OrderStatusFormState =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Shared internals: apply a transition + persist + email + revalidate.
 */
async function performStatusUpdate(
  orderId: string,
  toStatus: OrderStatus,
  extras?: { note?: string; tracking?: OrderTracking },
): Promise<OrderStatusFormState> {
  if (!orderId) return { ok: false, error: "Missing order id." };
  if (!ORDER_STATUSES.includes(toStatus))
    return { ok: false, error: "Unknown target status." };

  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found." };

  const nextOrder = transitionOrder(order, toStatus, "admin", extras);
  if (!nextOrder) {
    return {
      ok: false,
      error: `Order is already "${order.status}" and nothing else changed.`,
    };
  }
  await replaceOrder(nextOrder);

  // Fire email — non-blocking style.
  try {
    const emailer = getEmailAdapter();
    const last = nextOrder.statusHistory[nextOrder.statusHistory.length - 1];
    const tpl = renderOrderStatusEmail(nextOrder, last);
    const res = await emailer.send({ to: nextOrder.email, ...tpl });
    if (!res.ok) console.warn("[order-status email]", res.error);
  } catch (err) {
    console.warn("[order-status email exception]", err);
  }

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders`);
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/track/${orderId}`);
  return { ok: true, message: `Order marked as ${toStatus}.` };
}

/** Used by the detailed status form (with note + tracking fields). */
export async function updateOrderStatusAction(
  _prev: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const toStatus = String(formData.get("toStatus") ?? "").trim() as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();
  const trackingCarrier = String(formData.get("trackingCarrier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();

  const order = await getOrderById(orderId);
  const tracking: OrderTracking | undefined =
    trackingNumber || trackingCarrier || trackingUrl
      ? {
          carrier: trackingCarrier || undefined,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          estimatedDelivery: order?.tracking?.estimatedDelivery,
        }
      : order?.tracking;

  return performStatusUpdate(orderId, toStatus, {
    note: note || undefined,
    tracking,
  });
}

/** Used by the inline dropdown in the orders table. */
export async function inlineUpdateOrderStatusAction(
  orderId: string,
  toStatus: OrderStatus,
): Promise<OrderStatusFormState> {
  return performStatusUpdate(orderId, toStatus);
}

/* -------------------------------------------------------------------------- */
/*  AppConfig                                                                 */
/* -------------------------------------------------------------------------- */

export async function updateAppConfigAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const current = await getAppConfig();

  const socialKeys = [
    "facebook",
    "instagram",
    "twitter",
    "tiktok",
    "youtube",
    "linkedin",
  ] as const;
  const socials = Object.fromEntries(
    socialKeys.map((k) => {
      const raw = formData.get(`socials.${k}`);
      return [k, raw !== null ? String(raw).trim() : String(current.socials?.[k] ?? "").trim()];
    }),
  ) as AppConfig["socials"];

  const currencyRaw = formData.get("currency");
  const currency = (currencyRaw !== null
    ? String(currencyRaw).trim().toLowerCase()
    : current.currency) as AppConfig["currency"];

  const logoHeightRaw = formData.get("logoHeight");
  const logoWidthRaw = formData.get("logoWidth");
  const menuAlignmentRaw = String(
    formData.get("menuAlignment") ?? current.menuAlignment,
  ).trim();
  const validAlignments = ["justify-start", "justify-center", "justify-end"] as const;
  const menuAlignment: AppConfig["menuAlignment"] = validAlignments.includes(
    menuAlignmentRaw as (typeof validAlignments)[number],
  )
    ? (menuAlignmentRaw as AppConfig["menuAlignment"])
    : current.menuAlignment;

  const activeColorRaw = formData.get("activeColor");
  const activeColor =
    (activeColorRaw !== null
      ? String(activeColorRaw).trim()
      : current.activeLinkStyle.activeColor) || "#b8956b";

  const underlineValues = formData.getAll("activeShowUnderline").map(String);
  const showUnderline =
    underlineValues.length > 0
      ? underlineValues.includes("on")
      : current.activeLinkStyle.showUnderline;

  const textLogoValues = formData.getAll("useTextLogo").map(String);
  const useTextLogo =
    textLogoValues.length > 0
      ? textLogoValues.includes("on")
      : current.useTextLogo ?? true;

  const next: AppConfig = {
    ...current,
    siteName:
      String(formData.get("siteName") ?? current.siteName).trim() || current.siteName,
    tagline:
      formData.get("tagline") !== null
        ? String(formData.get("tagline") ?? "").trim()
        : current.tagline,
    logoUrl:
      formData.get("logoUrl") !== null
        ? String(formData.get("logoUrl") ?? "").trim()
        : current.logoUrl,
    logoHeight:
      logoHeightRaw !== null && Number.isFinite(Number(logoHeightRaw)) && Number(logoHeightRaw) > 0
        ? Number(logoHeightRaw)
        : current.logoHeight ?? 64,
    logoWidth:
      logoWidthRaw !== null && Number.isFinite(Number(logoWidthRaw)) && Number(logoWidthRaw) >= 0
        ? Number(logoWidthRaw)
        : current.logoWidth ?? 0,
    logoBgColor:
      formData.get("logoBgColor") !== null
        ? String(formData.get("logoBgColor") ?? "#ffffff").trim() || "#ffffff"
        : current.logoBgColor ?? "#ffffff",
    useTextLogo,
    contactEmail:
      formData.get("contactEmail") !== null
        ? String(formData.get("contactEmail") ?? "").trim()
        : current.contactEmail,
    supportPhone:
      formData.get("supportPhone") !== null
        ? String(formData.get("supportPhone") ?? "").trim()
        : current.supportPhone,
    currency,
    menuAlignment,
    activeLinkStyle: {
      showUnderline,
      activeColor,
    },
    socials,
    analytics: {
      googleAnalyticsId:
        formData.get("analytics.googleAnalyticsId") !== null
          ? String(formData.get("analytics.googleAnalyticsId") ?? "").trim()
          : current.analytics?.googleAnalyticsId ?? "",
      metaPixelId:
        formData.get("analytics.metaPixelId") !== null
          ? String(formData.get("analytics.metaPixelId") ?? "").trim()
          : current.analytics?.metaPixelId ?? "",
      plausibleDomain:
        formData.get("analytics.plausibleDomain") !== null
          ? String(formData.get("analytics.plausibleDomain") ?? "").trim()
          : current.analytics?.plausibleDomain ?? "",
    },
  };

  // Very light URL validation.
  for (const [k, v] of Object.entries(socials)) {
    const url = String(v ?? "").trim();
    if (url && !/^https?:\/\//i.test(url)) {
      return {
        ok: false,
        error: `Social URL for ${k} must start with http(s)://`,
      };
    }
  }

  await saveAppConfig(next);
  revalidatePath("/", "layout");
  return { ok: true, message: "Site settings saved." };
}

/* -------------------------------------------------------------------------- */
/*  PageFactory (CMS)                                                         */
/* -------------------------------------------------------------------------- */

export type PageFormState =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

function slugifyForPage(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parses the block-editor text back into structured content blocks.
 * Syntax:
 *   ## Heading        → starts a richtext block (heading + following body)
 *   ?? Question       → starts an FAQ item (Q on this line, A on the next)
 *   !! CTA: Heading   → CTA block; supports body + [Label](href)
 *   >> https://…      → Image block; next line is alt text
 *   anything else     → appended to the last block's body
 */
function parseBlocksText(input: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = input.replace(/\r/g, "").split(/\n{2,}/);
  for (const raw of lines) {
    const chunk = raw.trim();
    if (!chunk) continue;
    if (chunk.startsWith("## ")) {
      const nl = chunk.indexOf("\n");
      const heading = (nl === -1 ? chunk : chunk.slice(0, nl)).slice(3).trim();
      const body = nl === -1 ? "" : chunk.slice(nl + 1).trim();
      blocks.push({ id: makeBlockId(), type: "richtext", heading, body });
    } else if (chunk.startsWith("?? ")) {
      // Collect Q/A pairs into an FAQ block.
      const items: Array<{ q: string; a: string }> = [];
      const qLines = chunk.split(/\n/);
      let i = 0;
      while (i < qLines.length) {
        const l = qLines[i];
        if (l.startsWith("?? ")) {
          const q = l.slice(3).trim();
          const a = qLines[i + 1]?.trim() ?? "";
          items.push({ q, a });
          i += 2;
        } else {
          i += 1;
        }
      }
      const last = blocks[blocks.length - 1];
      if (last && last.type === "faq") last.items.push(...items);
      else blocks.push({ id: makeBlockId(), type: "faq", items });
    } else if (chunk.startsWith("!! CTA:")) {
      const [firstLine, ...rest] = chunk.split("\n");
      const heading = firstLine.replace("!! CTA:", "").trim();
      const linkMatch = chunk.match(/\[(.+?)\]\((.+?)\)/);
      const ctaLabel = linkMatch?.[1] ?? "Learn more";
      const ctaHref = linkMatch?.[2] ?? "#";
      const body = rest
        .filter((l) => !l.includes("["))
        .join("\n")
        .trim();
      blocks.push({
        id: makeBlockId(),
        type: "cta",
        heading,
        body,
        ctaLabel,
        ctaHref,
      });
    } else if (chunk.startsWith(">> ")) {
      const [src, ...altLines] = chunk.split("\n");
      blocks.push({
        id: makeBlockId(),
        type: "image",
        src: src.slice(3).trim(),
        alt: altLines.join(" ").trim() || undefined,
      });
    } else {
      // Append as a plain richtext paragraph.
      blocks.push({ id: makeBlockId(), type: "richtext", body: chunk });
    }
  }
  return blocks;
}

function parseBlocksJson(raw: string): ContentBlock[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((b) => normalizeBlock(b))
      .filter((b): b is ContentBlock => b !== null);
  } catch {
    return null;
  }
}

function parseKeywordsJson(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((k) => String(k).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseContactDetailsJson(raw: string): Page["contactDetails"] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return undefined;
    const obj = parsed as {
      heading?: unknown;
      lead?: unknown;
      rows?: unknown;
    };
    const rows = Array.isArray(obj.rows)
      ? obj.rows
          .map((r, i) => {
            if (!r || typeof r !== "object") return null;
            const row = r as { id?: unknown; label?: unknown; body?: unknown };
            const label = String(row.label ?? "").trim();
            const body = String(row.body ?? "");
            if (!label && !body.trim()) return null;
            return {
              id:
                typeof row.id === "string" && row.id
                  ? row.id
                  : `cdr_${i}`,
              label,
              body,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)
      : [];
    const heading = String(obj.heading ?? "").trim();
    const lead = String(obj.lead ?? "").trim();
    if (!heading && !lead && rows.length === 0) return undefined;
    return { heading, lead, rows };
  } catch {
    return undefined;
  }
}

export async function upsertPageAction(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const idField = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugField = String(formData.get("slug") ?? "").trim();
  const eyebrow = String(formData.get("eyebrow") ?? "").trim();
  const hero = String(formData.get("hero") ?? "").trim();
  const blocksJson = String(formData.get("blocksJson") ?? "").trim();
  const blocksText = String(formData.get("blocks") ?? "").trim();
  const metaTitle = String(formData.get("metaTitle") ?? "").trim();
  const metaDescription = String(formData.get("metaDescription") ?? "").trim();
  const ogImage = String(formData.get("ogImage") ?? "").trim();
  const seoKeywords = parseKeywordsJson(
    String(formData.get("seoKeywordsJson") ?? ""),
  );
  const showInFooter = formData.get("showInFooter") === "on";
  const footerColumn = String(formData.get("footerColumn") ?? "company").trim() as Page["footerColumn"];
  const published = formData.get("published") === "on";
  const bannerImage = String(formData.get("bannerImage") ?? "").trim();
  const pageKind = String(formData.get("pageKind") ?? "standard").trim() as Page["pageKind"];
  const mapEmbed = String(formData.get("mapEmbed") ?? "").trim();
  const contactDetails = parseContactDetailsJson(
    String(formData.get("contactDetailsJson") ?? ""),
  );

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";

  const existing = idField ? await PageFactory.getById(idField) : null;
  const slug = slugField
    ? slugifyForPage(slugField)
    : existing?.slug ?? slugifyForPage(title);
  if (!slug) errors.slug = "Slug is required.";

  const all = await PageFactory.list();
  if (
    slug &&
    all.some((p) => p.slug === slug && p.id !== (existing?.id ?? ""))
  ) {
    errors.slug = "Another page already uses that slug.";
  }

  if (ogImage && !/^https?:\/\//i.test(ogImage) && !ogImage.startsWith("/uploads/")) {
    errors.ogImage = "OG image must be an uploaded path or http(s):// URL.";
  }
  if (bannerImage && !/^https?:\/\//i.test(bannerImage) && !bannerImage.startsWith("/uploads/")) {
    errors.bannerImage = "Banner must be an uploaded path or http(s):// URL.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  // Blocks precedence: JSON (visual editor) > text (legacy) > existing.
  const blocksFromJson = parseBlocksJson(blocksJson);
  const nextBlocks: ContentBlock[] =
    blocksFromJson !== null
      ? blocksFromJson
      : blocksText
      ? (parseBlocksText(blocksText) as unknown as ContentBlock[])
      : existing?.blocks ?? [];

  const nextPage: Page = {
    id: existing?.id ?? slug,
    slug,
    title,
    eyebrow: eyebrow || undefined,
    hero: hero || undefined,
    bannerImage: bannerImage || undefined,
    pageKind: pageKind || "standard",
    mapEmbed: mapEmbed || undefined,
    contactDetails:
      (pageKind || "standard") === "contact"
        ? contactDetails ?? existing?.contactDetails
        : undefined,
    published,
    showInFooter,
    footerColumn: showInFooter ? footerColumn : undefined,
    lastUpdated: existing?.lastUpdated,
    seo: {
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ogImage: ogImage || undefined,
      keywords: seoKeywords.length ? seoKeywords : undefined,
    },
    blocks: nextBlocks,
  };

  await PageFactory.upsert(nextPage);
  revalidatePath("/", "layout");
  revalidatePath(`/${slug}`);
  if (slug === "home") revalidatePath("/");
  if (slug === "contact") revalidatePath("/contact");
  if (slug === "shop") revalidatePath("/shop");
  if (slug === "sale") revalidatePath("/sale");
  redirect("/admin/pages");
}

/* -------------------------------------------------------------------------- */
/*  Home Page — one-click seeder                                              */
/* -------------------------------------------------------------------------- */

/**
 * If no home page exists in the CMS, create one with sensible starter blocks
 * (Hero + Banner + ProductGrid + CTA) so the admin has something to edit
 * immediately. If one already exists, just jumps to its editor.
 *
 * Called from `/admin/pages` when the admin clicks "Create Home Page".
 */
export async function createOrEditHomePageAction(): Promise<void> {
  const existing = await PageFactory.getBySlug("home");
  if (existing) {
    redirect(`/admin/pages/${existing.id}/edit`);
  }

  const seed: Page = {
    id: "home",
    slug: "home",
    title: "Home",
    eyebrow: "",
    hero: "",
    published: true,
    showInFooter: false,
    seo: {
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
      keywords: [],
    },
    blocks: [
      {
        id: makeBlockId(),
        type: "hero",
        layout: { alignment: "center", columnCount: 1, padding: "lg" },
        heading: "Welcome to the store",
        subheading: "Premium picks, curated weekly. Free shipping over $75.",
        backgroundImage: "",
        ctaLabel: "Shop the collection",
        ctaHref: "/shop",
        height: "large",
      },
      {
        id: makeBlockId(),
        type: "banner",
        layout: { alignment: "center", columnCount: 1, padding: "md" },
        image: "",
        eyebrow: "New arrivals",
        heading: "Fresh drops every week",
        body: "Handpicked pieces from independent designers and heritage houses.",
        ctaLabel: "Browse new",
        ctaHref: "/new",
        overlay: "dark",
      },
      {
        id: makeBlockId(),
        type: "productgrid",
        layout: { alignment: "center", columnCount: 4, padding: "lg" },
        heading: "Featured collection",
        productIds: [],
        filterTag: "featured",
        limit: 8,
      },
      {
        id: makeBlockId(),
        type: "cta",
        layout: { alignment: "center", columnCount: 1, padding: "lg" },
        heading: "Join the list",
        body: "First looks at new arrivals and members-only offers.",
        ctaLabel: "Subscribe",
        ctaHref: "/#newsletter",
        variant: "dark",
      },
      {
        id: makeBlockId(),
        type: "richtext",
        layout: { alignment: "center", columnCount: 1, padding: "md" },
        heading: "",
        headingLevel: 2,
        body: "Write your content here.",
        alignment: "left",
      },
      {
        id: makeBlockId(),
        type: "features",
        layout: { alignment: "center", columnCount: 1, padding: "none" },
        items: [
          {
            title: "Complimentary Shipping",
            body: "On all orders over $75, delivered with care.",
          },
          {
            title: "Authenticity Guaranteed",
            body: "Every piece sourced from verified partners.",
          },
          {
            title: "Personal Styling",
            body: "Book a complimentary consultation with our team.",
          },
          {
            title: "Easy Returns",
            body: "30-day returns on unworn items, hassle-free.",
          },
        ],
      },
    ],
  };

  await PageFactory.upsert(seed);
  revalidatePath("/", "layout");
  redirect(`/admin/pages/${seed.id}/edit`);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await PageFactory.delete(id);
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function duplicatePageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const copy = await PageFactory.duplicate(id);
  if (!copy) redirect("/admin/pages");
  revalidatePath("/", "layout");
  redirect(`/admin/pages/${copy.id}/edit`);
}
