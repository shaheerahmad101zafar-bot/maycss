"use client";

import { useActionState, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  upsertProductAction,
  type ProductFormState,
} from "@/app/admin/actions";
import { cx, type Category, type Product } from "@/lib/utils";
import type { BlockTemplate, ContentBlock } from "@/lib/blocks/types";
import {
  countWords,
  extractBodyTextFromBlocks,
  listPageBodySources,
  type BodySource,
} from "@/lib/seo/body-content";
import BlockEditor from "./BlockEditor";
import MetaSeoPanel from "./MetaSeoPanel";

const initial: ProductFormState = { ok: true };

function toSizesString(p?: Product) {
  return p?.sizes?.join(", ") ?? "";
}
function toGalleryString(p?: Product) {
  return (p?.gallery ?? []).join("\n");
}
function toColorsString(p?: Product) {
  return (p?.colors ?? []).map((c) => `${c.name}: ${c.hex}`).join("\n");
}
function toSpecsString(p?: Product) {
  return (p?.specs ?? []).map((s) => `${s.label}: ${s.value}`).join("\n");
}

interface Props {
  product?: Product;
  categories: Category[];
  templates: BlockTemplate[];
}

export default function ProductForm({ product, categories, templates }: Props) {
  const [state, formAction, pending] = useActionState(
    upsertProductAction,
    initial,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Fields that feed the live SEO audit — controlled state.
  const [name, setName] = useState<string>(product?.name ?? "");
  const [brand, setBrand] = useState<string>(product?.brand ?? "");
  const [price, setPrice] = useState<string>(
    product?.price != null ? String(product.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState<string>(
    product?.originalPrice != null ? String(product.originalPrice) : "",
  );
  const [image, setImage] = useState<string>(product?.image ?? "");
  const [sizes, setSizes] = useState<string>(toSizesString(product));
  const [colors, setColors] = useState<string>(toColorsString(product));
  const [gallery, setGallery] = useState<string>(toGalleryString(product));
  const [description, setDescription] = useState<string>(
    product?.description ?? "",
  );
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeError, setScrapeError] = useState("");
  const [scraping, setScraping] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    product?.contentBlocks ?? [],
  );

  // SEO state
  const [focusKeyword, setFocusKeyword] = useState<string>(
    product?.seo?.focusKeyword ?? "",
  );
  const [metaTitle, setMetaTitle] = useState<string>(
    product?.seo?.metaTitle ?? "",
  );
  const [metaDescription, setMetaDescription] = useState<string>(
    product?.seo?.metaDescription ?? "",
  );
  const [ogImage, setOgImage] = useState<string>(product?.seo?.ogImage ?? "");
  const [additionalKeywords, setAdditionalKeywords] = useState<string[]>(
    product?.seo?.keywords ?? [],
  );

  const serverErrors = state.ok === false ? state.errors : {};
  const errors = { ...serverErrors, ...clientErrors };
  const errFor = (key: string) =>
    errors[key] ? (
      <p className="mc-field__error" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  // Compose everything the auditor should search.
  // Deps list matches React Compiler's inferred set — we depend on `product`
  // as a whole rather than `product?.specs` so the compiler can memoise.
  const contentText = useMemo(() => {
    const parts: string[] = [name, description];
    if (product?.specs) {
      for (const s of product.specs) parts.push(s.label, s.value);
    }
    parts.push(extractBodyTextFromBlocks(contentBlocks));
    return parts.filter(Boolean).join(" ");
  }, [name, description, product, contentBlocks]);

  const seoBodySources = useMemo((): BodySource[] => {
    const sources: BodySource[] = [];
    if (name.trim()) {
      sources.push({
        id: "product-name",
        label: "Product name",
        field: "name",
        words: countWords(name),
        preview: name,
      });
    }
    if (description.trim()) {
      sources.push({
        id: "product-description",
        label: "Description (main body text)",
        field: "description",
        words: countWords(description),
        preview: description,
      });
    }
    if (product?.specs?.length) {
      const specText = product.specs
        .map((s) => `${s.label} ${s.value}`)
        .join(" ");
      sources.push({
        id: "product-specs",
        label: "Specs",
        field: "specs",
        words: countWords(specText),
        preview: specText,
      });
    }
    sources.push(...listPageBodySources(contentBlocks));
    return sources;
  }, [name, description, product, contentBlocks]);

  // Extras for image alt-text check on content blocks.
  const seoExtras = useMemo(() => {
    const imageBlocks = contentBlocks.filter((b) => b.type === "image");
    const withAlt = imageBlocks.filter(
      (b) => b.type === "image" && b.alt && b.alt.trim().length > 0,
    ).length;
    const hasHeading = contentBlocks.some(
      (b) =>
        (b.type === "richtext" && b.heading) ||
        b.type === "hero" ||
        (b.type === "columns" && b.columns.some((c) => c.heading)),
    );
    return imageBlocks.length > 0
      ? { imageAlt: { total: imageBlocks.length, withAlt }, hasHeading }
      : { hasHeading };
  }, [contentBlocks]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (!String(fd.get("name") ?? "").trim()) errs.name = "Name is required.";
    const image = String(fd.get("image") ?? "").trim();
    if (!image) errs.image = "Primary image URL is required.";
    else if (!image.startsWith("/uploads/") && !/^https?:\/\//i.test(image))
      errs.image = "Image must be uploaded or an http(s):// URL.";
    const price = Number(fd.get("price"));
    if (!Number.isFinite(price) || price <= 0)
      errs.price = "Price must be greater than zero.";
    const opRaw = fd.get("originalPrice");
    if (opRaw && String(opRaw).trim() !== "") {
      const op = Number(opRaw);
      if (!Number.isFinite(op) || op <= price)
        errs.originalPrice = "Original price must be greater than sale price.";
    }
    if (Object.keys(errs).length > 0) {
      e.preventDefault();
      setClientErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = e.currentTarget.querySelector<HTMLElement>(
        `[name="${firstKey}"]`,
      );
      el?.focus();
    } else {
      setClientErrors({});
    }
  };

  const handleScrape = async () => {
    const url = scrapeUrl.trim();
    if (!url) {
      setScrapeError("Paste a product URL first.");
      return;
    }
    setScraping(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        product?: {
          name?: string;
          brand?: string;
          description?: string;
          price?: number;
          originalPrice?: number;
          images?: string[];
          sizes?: string[];
          colors?: string[];
        };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.product) {
        setScrapeError(data.error ?? "Could not scrape that URL.");
        return;
      }
      const p = data.product;
      if (p.name) setName(p.name);
      if (p.brand) setBrand(p.brand);
      if (p.description) setDescription(p.description);
      if (typeof p.price === "number" && p.price > 0) setPrice(String(p.price));
      if (typeof p.originalPrice === "number" && p.originalPrice > 0) {
        setOriginalPrice(String(p.originalPrice));
      }
      if (p.images?.[0]) setImage(p.images[0]);
      if (p.images && p.images.length > 1) {
        setGallery(p.images.slice(1).join("\n"));
      }
      if (p.sizes?.length) setSizes(p.sizes.join(", "));
      if (p.colors?.length) {
        setColors(p.colors.map((c) => `${c}: #cccccc`).join("\n"));
      }
      if (p.name && !metaTitle) setMetaTitle(`${p.name} · myacss`);
      if (p.description && !metaDescription) {
        setMetaDescription(p.description.slice(0, 155));
      }
      if (p.images?.[0] && !ogImage) setOgImage(p.images[0]);
    } catch {
      setScrapeError("Network error while scraping. Try again.");
    } finally {
      setScraping(false);
    }
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="mc-admin__form"
      noValidate
    >
      {product && <input type="hidden" name="id" value={String(product.id)} />}

      {serverErrors._form && (
        <p className="mc-admin__banner is-error" role="alert">
          {serverErrors._form}
        </p>
      )}

      {!product && (
        <fieldset className="mc-fieldset mc-admin__scrape">
          <legend>Auto-scrape from URL</legend>
          <p className="mc-admin__hint">
            Paste any fashion product link — we fetch name, price, description,
            sizes, colors, and images server-side, then fill the form below.
          </p>
          <div className="mc-admin__scrape-row">
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://www.example.com/product/…"
              aria-label="Product URL to scrape"
            />
            <button
              type="button"
              className={cx("mc-btn mc-btn--ghost", scraping && "is-loading")}
              disabled={scraping}
              onClick={handleScrape}
            >
              {scraping ? "Scraping…" : "Auto-fill"}
            </button>
          </div>
          {scrapeError && (
            <p className="mc-admin__banner is-error" role="alert">
              {scrapeError}
            </p>
          )}
        </fieldset>
      )}

      <fieldset className="mc-fieldset">
        <legend>Product basics</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errFor("name")}
          </div>

          <div className="mc-field">
            <label htmlFor="brand">Brand</label>
            <input
              id="brand"
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="mc-field">
            <label htmlFor="price">Price (USD) *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            {errFor("price")}
          </div>

          <div className="mc-field">
            <label htmlFor="originalPrice">Original price (for sale)</label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              step="0.01"
              min="0"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
            />
            {errFor("originalPrice")}
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="image">Primary image URL *</label>
            <input
              id="image"
              name="image"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
              placeholder="https://…"
            />
            {errFor("image")}
          </div>

          <div className="mc-field">
            <label htmlFor="categoryId">Category</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
            >
              <option value="">— Uncategorised —</option>
              {roots.map((root) => {
                const kids = childrenOf(root.id);
                if (kids.length === 0) {
                  return (
                    <option key={root.id} value={root.id}>
                      {root.name}
                    </option>
                  );
                }
                return (
                  <optgroup key={root.id} label={root.name}>
                    <option value={root.id}>All {root.name}</option>
                    {kids.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {errFor("categoryId")}
          </div>

          <div className="mc-field">
            <label htmlFor="badge">Badge label</label>
            <input
              id="badge"
              name="badge"
              defaultValue={product?.badge ?? ""}
              placeholder="e.g. Best Seller"
            />
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="gallery">Gallery URLs (one per line)</label>
            <textarea
              id="gallery"
              name="gallery"
              rows={4}
              value={gallery}
              onChange={(e) => setGallery(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="sizes">Sizes (comma-separated)</label>
            <input
              id="sizes"
              name="sizes"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              placeholder="XS, S, M, L, XL"
            />
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="colors">
              Colors — one per line as <code>Name: #hex</code>
            </label>
            <textarea
              id="colors"
              name="colors"
              rows={4}
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Camel: #B4885A"
            />
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="specs">
              Specs — one per line as <code>Label: Value</code>
            </label>
            <textarea
              id="specs"
              name="specs"
              rows={4}
              defaultValue={toSpecsString(product)}
              placeholder="Material: 100% Wool"
            />
          </div>

          <div className="mc-field mc-field--check mc-field--full">
            <label>
              <input
                type="checkbox"
                name="isNew"
                defaultChecked={product?.isNew ?? false}
              />{" "}
              Mark as new arrival
            </label>
          </div>

          <div className="mc-field mc-field--check mc-field--full">
            <label>
              <input
                type="checkbox"
                name="publish"
                defaultChecked={product?.status !== "draft"}
              />{" "}
              Published (visible on the storefront)
            </label>
            {product?.sourceUrl && (
              <p className="mc-admin__hint">
                Imported from{" "}
                <a href={product.sourceUrl} target="_blank" rel="noopener">
                  {product.sourceUrl.slice(0, 60)}…
                </a>
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>Dynamic content (below the standard PDP)</legend>
        <p className="mc-admin__hint" style={{ marginBottom: 12 }}>
          Add rich text, images, FAQs, or full sections that appear below the
          product details. Same block editor as the CMS pages — image uploads
          go through Sharp / WebP automatically.
        </p>
        <input
          type="hidden"
          name="contentBlocksJson"
          value={JSON.stringify(contentBlocks)}
        />
        <BlockEditor
          initial={contentBlocks}
          templates={templates}
          seoKeywords={
            focusKeyword
              ? [focusKeyword, ...additionalKeywords]
              : additionalKeywords
          }
          onBlocksChange={setContentBlocks}
        />
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>SEO &amp; social</legend>
        <MetaSeoPanel
          kind="product"
          title={name}
          slug={String(product?.id ?? "new")}
          contentText={contentText}
          bodySources={seoBodySources}
          extras={seoExtras}
          focusKeyword={focusKeyword}
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          ogImage={ogImage}
          additionalKeywords={additionalKeywords}
          onFocusKeywordChange={setFocusKeyword}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          onOgImageChange={setOgImage}
          onAdditionalKeywordsChange={setAdditionalKeywords}
        />
      </fieldset>

      <div className="mc-admin__form-actions">
        <button
          type="submit"
          className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
          disabled={pending}
        >
          {pending
            ? "Saving…"
            : product
            ? "Save Changes"
            : "Create Product"}
        </button>
        <Link href="/admin/products" className="mc-btn mc-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
