"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { upsertPageAction, type PageFormState } from "@/app/admin/actions";
import type { ContactDetails, Page, PageKind } from "@/lib/pages";
import type { BlockTemplate, ContentBlock } from "@/lib/blocks/types";
import { cx } from "@/lib/utils";
import BlockEditor from "./BlockEditor";
import ContactDetailsEditor from "./ContactDetailsEditor";
import SeoPanel from "./SeoPanel";
import HybridImagePicker from "./HybridImagePicker";
import HomePageEditGuide from "./HomePageEditGuide";

const EMPTY_CONTACT_DETAILS: ContactDetails = {
  heading: "Visit & Connect",
  lead: "",
  rows: [],
};

const initial: PageFormState = { ok: true };

interface Props {
  page?: Page;
  templates: BlockTemplate[];
}

export default function PageForm({ page, templates }: Props) {
  // Live state for anything the SEO audit needs to see.
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [hero, setHero] = useState(page?.hero ?? "");
  const [blocks, setBlocks] = useState<ContentBlock[]>(page?.blocks ?? []);
  const [metaTitle, setMetaTitle] = useState(page?.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    page?.seo?.metaDescription ?? "",
  );
  const [ogImage, setOgImage] = useState(page?.seo?.ogImage ?? "");
  const [keywords, setKeywords] = useState<string[]>(page?.seo?.keywords ?? []);
  const [bannerImage, setBannerImage] = useState(page?.bannerImage ?? "");
  const [showHeroBanner, setShowHeroBanner] = useState(
    page?.showHeroBanner !== false,
  );
  const [heroCtaLabel, setHeroCtaLabel] = useState(page?.heroCtaLabel ?? "");
  const [heroCtaHref, setHeroCtaHref] = useState(page?.heroCtaHref ?? "");
  const [heroSecondaryCtaLabel, setHeroSecondaryCtaLabel] = useState(
    page?.heroSecondaryCtaLabel ?? "",
  );
  const [heroSecondaryCtaHref, setHeroSecondaryCtaHref] = useState(
    page?.heroSecondaryCtaHref ?? "",
  );
  const [pageKind, setPageKind] = useState<PageKind>(page?.pageKind ?? "standard");
  const [mapEmbed, setMapEmbed] = useState(page?.mapEmbed ?? "");
  const [contactDetails, setContactDetails] = useState<ContactDetails>(
    page?.contactDetails ?? EMPTY_CONTACT_DETAILS,
  );

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const err = (k: string) =>
    clientErrors[k] ? (
      <p className="mc-field__error" role="alert">
        {clientErrors[k]}
      </p>
    ) : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!slug.trim() && !page?.slug) errs.slug = "Slug is required.";
    if (Object.keys(errs).length) {
      setClientErrors(errs);
      return;
    }
    setClientErrors({});
    setPending(true);
    const fd = new FormData(e.currentTarget);
    // React 19 server actions accept FormData via .action, but we use
    // the imperative form since we manage all state locally.
    const result = await upsertPageAction(initial, fd);
    setPending(false);
    if (result && !result.ok) {
      setClientErrors(result.errors);
    }
    // On success the action redirects — nothing more to do.
  };

  return (
    <form onSubmit={handleSubmit} className="mc-admin__form" noValidate>
      {page && <input type="hidden" name="id" value={page.id} />}

      <fieldset className="mc-fieldset">
        <legend>Basics</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {err("title")}
          </div>
          <div className="mc-field">
            <label htmlFor="slug">URL slug *</label>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="about-us"
              required={!page}
            />
            {err("slug")}
          </div>
          <div className="mc-field">
            <label htmlFor="eyebrow">Eyebrow (small label above title)</label>
            <input
              id="eyebrow"
              name="eyebrow"
              defaultValue={page?.eyebrow}
            />
          </div>
          <div className="mc-field mc-field--check">
            <label>
              <input
                type="checkbox"
                name="published"
                defaultChecked={page?.published ?? true}
              />{" "}
              Published (visible on site)
            </label>
          </div>
          <div className="mc-field mc-field--full">
            <label htmlFor="hero">Hero paragraph</label>
            <textarea
              id="hero"
              name="hero"
              rows={3}
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="Short intro shown on the page hero…"
            />
            <p className="mc-admin__hint">
              This text sits on the hero area (title + paragraph). Add a
              background image below so it looks like a banner.
            </p>
          </div>
          <div className="mc-field mc-field--full">
            <label className="mc-check">
              <input
                type="checkbox"
                name="showHeroBanner"
                checked={showHeroBanner}
                onChange={(e) => setShowHeroBanner(e.target.checked)}
              />{" "}
              Show hero banner at top of page
            </label>
            <p className="mc-admin__hint">
              Turn off to hide the promo banner at the top of the page.
            </p>
          </div>
          <div className="mc-field mc-field--full">
            <label>Hero background image</label>
            <input type="hidden" name="bannerImage" value={bannerImage} readOnly />
            <HybridImagePicker
              value={bannerImage}
              onChange={setBannerImage}
              subdir="cms"
              label=""
              helpText="Full-bleed promo banner image (same style as category Black Friday banners)."
            />
            {err("bannerImage")}
          </div>
          <div className="mc-field">
            <label htmlFor="heroCtaLabel">Primary button label</label>
            <input
              id="heroCtaLabel"
              name="heroCtaLabel"
              value={heroCtaLabel}
              onChange={(e) => setHeroCtaLabel(e.target.value)}
              placeholder="Shop Black Friday"
            />
          </div>
          <div className="mc-field">
            <label htmlFor="heroCtaHref">Primary button link</label>
            <input
              id="heroCtaHref"
              name="heroCtaHref"
              value={heroCtaHref}
              onChange={(e) => setHeroCtaHref(e.target.value)}
              placeholder="/sale"
            />
          </div>
          <div className="mc-field">
            <label htmlFor="heroSecondaryCtaLabel">Secondary button label</label>
            <input
              id="heroSecondaryCtaLabel"
              name="heroSecondaryCtaLabel"
              value={heroSecondaryCtaLabel}
              onChange={(e) => setHeroSecondaryCtaLabel(e.target.value)}
              placeholder="Browse the collection"
            />
          </div>
          <div className="mc-field">
            <label htmlFor="heroSecondaryCtaHref">Secondary button link</label>
            <input
              id="heroSecondaryCtaHref"
              name="heroSecondaryCtaHref"
              value={heroSecondaryCtaHref}
              onChange={(e) => setHeroSecondaryCtaHref(e.target.value)}
              placeholder="/shop"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>Visual &amp; page type</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="pageKind">Page type</label>
            <select
              id="pageKind"
              name="pageKind"
              value={pageKind}
              onChange={(e) => setPageKind(e.target.value as PageKind)}
            >
              <option value="standard">Standard</option>
              <option value="contact">Contact (form + map)</option>
              <option value="shop">Shop (category index)</option>
              <option value="sale">Sale (sale products)</option>
            </select>
            <p className="mc-admin__hint">
              Controls route-specific sections on /contact, /shop, and /sale.
            </p>
          </div>
          {pageKind === "contact" && (
            <div className="mc-field mc-field--full">
              <label htmlFor="mapEmbed">Map embed (iframe HTML)</label>
              <textarea
                id="mapEmbed"
                name="mapEmbed"
                rows={4}
                value={mapEmbed}
                onChange={(e) => setMapEmbed(e.target.value)}
                placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              />
              <p className="mc-admin__hint">
                Paste the Google Maps embed code. Also available as a Map block
                in the content editor.
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {pageKind === "contact" && (
        <fieldset className="mc-fieldset">
          <legend>Contact sidebar (Visit &amp; Connect)</legend>
          <p className="mc-admin__hint" style={{ marginTop: 0 }}>
            This is the right-hand panel on the Contact Us page — address, hours,
            email, phone, or any other detail you want customers to see. Edit
            freely; Save Page publishes it live.
          </p>
          <ContactDetailsEditor
            value={contactDetails}
            onChange={setContactDetails}
          />
        </fieldset>
      )}

      <fieldset className="mc-fieldset">
        <legend>Content blocks</legend>
        {page?.slug === "home" && <HomePageEditGuide blocks={blocks} />}
        <BlockEditor
          initial={blocks}
          templates={templates}
          seoKeywords={keywords}
          onBlocksChange={setBlocks}
        />
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>SEO &amp; social</legend>
        <SeoPanel
          title={title}
          slug={slug}
          hero={hero}
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          ogImage={ogImage}
          keywords={keywords}
          blocks={blocks}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          onOgImageChange={setOgImage}
          onKeywordsChange={setKeywords}
        />
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>Footer visibility</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field mc-field--check">
            <label>
              <input
                type="checkbox"
                name="showInFooter"
                defaultChecked={page?.showInFooter ?? false}
              />{" "}
              Show in footer
            </label>
          </div>
          <div className="mc-field">
            <label htmlFor="footerColumn">Footer column</label>
            <select
              id="footerColumn"
              name="footerColumn"
              defaultValue={page?.footerColumn ?? "company"}
            >
              <option value="company">Company</option>
              <option value="legal">Legal</option>
              <option value="shop">Shop</option>
            </select>
          </div>
        </div>
      </fieldset>

      <div className="mc-admin__form-actions">
        <button
          type="submit"
          className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
          disabled={pending}
        >
          {pending ? "Saving…" : page ? "Save Page" : "Create Page"}
        </button>
        <Link href="/admin/pages" className="mc-btn mc-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
