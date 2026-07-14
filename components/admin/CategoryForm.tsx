"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  upsertCategoryAction,
  type CategoryFormState,
} from "@/app/admin/actions";
import { cx, type Category } from "@/lib/utils";
import HybridImagePicker from "./HybridImagePicker";
import MetaSeoPanel from "./MetaSeoPanel";

const initial: CategoryFormState = { ok: true };

interface Props {
  category?: Category;
  allCategories: Category[];
}

export default function CategoryForm({ category, allCategories }: Props) {
  const [state, formAction, pending] = useActionState(
    upsertCategoryAction,
    initial,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string>(category?.image ?? "");
  const [name, setName] = useState<string>(category?.name ?? "");
  const [slug, setSlug] = useState<string>(category?.slug ?? "");
  const [description, setDescription] = useState<string>(
    category?.description ?? "",
  );

  // SEO state
  const [focusKeyword, setFocusKeyword] = useState<string>(
    category?.seo?.focusKeyword ?? "",
  );
  const [metaTitle, setMetaTitle] = useState<string>(
    category?.seo?.metaTitle ?? "",
  );
  const [metaDescription, setMetaDescription] = useState<string>(
    category?.seo?.metaDescription ?? "",
  );
  const [ogImage, setOgImage] = useState<string>(
    category?.seo?.ogImage ?? "",
  );
  const [additionalKeywords, setAdditionalKeywords] = useState<string[]>(
    category?.seo?.keywords ?? [],
  );

  const serverErrors = state.ok === false ? state.errors : {};
  const errors = { ...serverErrors, ...clientErrors };
  const err = (k: string) =>
    errors[k] ? (
      <p className="mc-field__error" role="alert">
        {errors[k]}
      </p>
    ) : null;

  const descendantIds = new Set<string>();
  if (category) {
    descendantIds.add(category.id);
    const stack = [category.id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const c of allCategories) {
        if (c.parentId === cur) {
          descendantIds.add(c.id);
          stack.push(c.id);
        }
      }
    }
  }
  const parentOptions = allCategories.filter((c) => !descendantIds.has(c.id));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (!String(fd.get("name") ?? "").trim()) errs.name = "Name is required.";
    const img = String(fd.get("image") ?? "").trim();
    if (img && !img.startsWith("/uploads/") && !/^https?:\/\//i.test(img)) {
      errs.image = "Image must be uploaded or an http(s):// URL.";
    }
    if (Object.keys(errs).length) {
      e.preventDefault();
      setClientErrors(errs);
    } else {
      setClientErrors({});
    }
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="mc-admin__form"
      noValidate
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="image" value={image} />

      <fieldset className="mc-fieldset">
        <legend>Basics</legend>
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
            {err("name")}
          </div>
          <div className="mc-field">
            <label htmlFor="slug">Slug (URL segment)</label>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from name"
            />
            {err("slug")}
          </div>
          <div className="mc-field">
            <label htmlFor="parentId">Parent category</label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={category?.parentId ?? ""}
            >
              <option value="">— None (top-level) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err("parentId")}
          </div>
          <div className="mc-field">
            <label htmlFor="order">Display order</label>
            <input
              id="order"
              name="order"
              type="number"
              step="1"
              defaultValue={category?.order ?? ""}
              placeholder="1"
            />
            {err("order")}
          </div>
          <div className="mc-field mc-field--full">
            <HybridImagePicker
              value={image}
              onChange={setImage}
              label="Hero image"
              subdir="categories"
              helpText="Files are auto-optimised to WebP via Sharp."
            />
            {err("image")}
          </div>
          <div className="mc-field mc-field--full">
            <label htmlFor="description">Description (SEO body copy)</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Longer descriptive text — the SEO audit uses this."
            />
            <p className="mc-admin__hint">
              Shown on the category page and used by the auditor for keyword-in-body checks.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>SEO &amp; social</legend>
        <MetaSeoPanel
          kind="category"
          title={name}
          slug={slug}
          contentText={`${name} ${description}`}
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
            : category
            ? "Save Changes"
            : "Create Category"}
        </button>
        <Link href="/admin/categories" className="mc-btn mc-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
