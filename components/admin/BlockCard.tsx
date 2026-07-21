"use client";

import { useRef, useState } from "react";
import type {
  Alignment,
  BannerBlock,
  BlockLayout,
  BlockWidth,
  ColumnCount,
  ColumnData,
  ContactFormBlock,
  ContentBlock,
  FaqItem,
  FeatureItem,
  MapBlock,
  PaddingSize,
  ProductGridBlock,
  SliderBlock,
  SlideData,
  VideoBlock,
} from "@/lib/blocks/types";
import { cx } from "@/lib/utils";
import { postAdminUpload } from "@/lib/uploads/client";
import HybridImagePicker from "./HybridImagePicker";
import ImageAdjustFields from "./ImageAdjustFields";
import { BANNER_SHOP_LINK_OPTIONS } from "@/components/cms/blocks/BannerPromoView";

interface Props {
  block: ContentBlock;
  index: number;
  total: number;
  onChange: (patch: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onHumanize?: (blockId: string) => void;
  humanizing?: boolean;
  seoKeyword?: string;
}

const TYPE_LABELS: Record<ContentBlock["type"], string> = {
  hero: "Hero",
  banner: "Banner",
  slider: "Slider",
  richtext: "Text",
  image: "Image",
  video: "Video",
  productgrid: "Product grid",
  map: "Map",
  contactform: "Contact form",
  features: "Store benefits",
  editorial: "Editorial split",
  splitbanner: "Split promo",
  countdown: "Countdown offer",
  categorygrid: "Category grid",
  cta: "Call-to-action",
  faq: "FAQ",
  columns: "Columns",
};

function blockLabel(block: ContentBlock): string {
  const base = TYPE_LABELS[block.type] ?? block.type;
  if (block.type === "richtext" && block.body.trim()) {
    const preview =
      block.body.length > 36 ? `${block.body.slice(0, 36)}…` : block.body;
    return `${base} — ${preview}`;
  }
  if ("heading" in block && typeof block.heading === "string" && block.heading.trim()) {
    return `${base} — ${block.heading}`;
  }
  return base;
}

/**
 * BlockCard — per-block inline editor.
 *
 * Structure:
 *   • Header  → up/down/duplicate/delete controls
 *   • Layout  → universal alignment / columns / padding (shared)
 *   • Body    → type-specific field editor
 *   • Actions → AI Suggest for text-bearing blocks
 */
export default function BlockCard({
  block,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onHumanize,
  humanizing,
  seoKeyword,
}: Props) {
  return (
    <div className="mc-blk-card">
      <header className="mc-blk-card__header">
        <span className="mc-blk-card__type">{blockLabel(block)}</span>
        <div className="mc-blk-card__actions">
          <button
            type="button"
            className="mc-blk-card__btn"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move up"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="mc-blk-card__btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move down"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="mc-blk-card__btn"
            onClick={onDuplicate}
            aria-label="Duplicate"
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            type="button"
            className="mc-blk-card__btn mc-blk-card__btn--danger"
            onClick={onDelete}
            aria-label="Delete block"
            title="Delete"
          >
            ×
          </button>
        </div>
      </header>

      <div className="mc-blk-card__body">
        <LayoutFields
          layout={block.layout}
          onChange={(next) => onChange({ layout: next } as Partial<ContentBlock>)}
          alignmentHint={
            block.type === "editorial" || block.type === "splitbanner"
              ? "Centers or aligns the text panel (heading, body, button) on the live site."
              : undefined
          }
        />

        {block.type === "richtext" && (
          <RichtextFields
            block={block}
            onChange={onChange}
            onHumanize={onHumanize}
            humanizing={humanizing}
            seoKeyword={seoKeyword}
          />
        )}
        {block.type === "image" && <ImageFields block={block} onChange={onChange} />}
        {block.type === "hero" && <HeroFields block={block} onChange={onChange} />}
        {block.type === "cta" && <CtaFields block={block} onChange={onChange} />}
        {block.type === "faq" && <FaqFields block={block} onChange={onChange} />}
        {block.type === "columns" && (
          <ColumnsFields block={block} onChange={onChange} />
        )}
        {block.type === "banner" && (
          <BannerFields
            block={block}
            onChange={onChange}
            seoKeyword={seoKeyword}
          />
        )}
        {block.type === "slider" && (
          <SliderFields block={block} onChange={onChange} />
        )}
        {block.type === "video" && (
          <VideoFields block={block} onChange={onChange} />
        )}
        {block.type === "productgrid" && (
          <ProductGridFields block={block} onChange={onChange} />
        )}
        {block.type === "map" && <MapFields block={block} onChange={onChange} />}
        {block.type === "contactform" && (
          <ContactFormFields block={block} onChange={onChange} />
        )}
        {block.type === "features" && (
          <FeaturesFields block={block} onChange={onChange} />
        )}
        {block.type === "editorial" && (
          <EditorialFields block={block} onChange={onChange} />
        )}
        {block.type === "splitbanner" && (
          <SplitBannerFields block={block} onChange={onChange} />
        )}
        {block.type === "countdown" && (
          <CountdownFields block={block} onChange={onChange} />
        )}
        {block.type === "categorygrid" && (
          <CategoryGridFields block={block} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Universal layout ─────────────────────── */

function LayoutFields({
  layout,
  onChange,
  alignmentHint,
}: {
  layout: BlockLayout | undefined;
  onChange: (next: BlockLayout) => void;
  alignmentHint?: string;
}) {
  const l = layout ?? {};
  const patch = (p: Partial<BlockLayout>) => onChange({ ...l, ...p });
  return (
    <details className="mc-blk-layout" open>
      <summary>Layout &amp; spacing</summary>
      <div
        className="mc-admin__form-grid"
        style={{ marginTop: 8, background: "rgba(0,0,0,0.03)", padding: 10, borderRadius: 6 }}
      >
        <div className="mc-field">
          <label>Alignment (text position)</label>
          <select
            value={l.alignment ?? "center"}
            onChange={(e) => patch({ alignment: e.target.value as Alignment })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="full">Stretch (full)</option>
          </select>
          {alignmentHint && (
            <p className="mc-admin__hint">{alignmentHint}</p>
          )}
        </div>
        <div className="mc-field">
          <label>Width</label>
          <select
            value={l.width ?? "full"}
            onChange={(e) => patch({ width: e.target.value as BlockWidth })}
          >
            <option value="full">Full (100%)</option>
            <option value="medium">Medium (≈880px)</option>
            <option value="half">Half (≈50%)</option>
          </select>
        </div>
        <div className="mc-field">
          <label>Columns (1–4)</label>
          <select
            value={l.columnCount ?? 1}
            onChange={(e) =>
              patch({ columnCount: Number(e.target.value) as ColumnCount })
            }
          >
            <option value={1}>1 column</option>
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
            <option value={4}>4 columns</option>
          </select>
        </div>
        <div className="mc-field">
          <label>Padding</label>
          <select
            value={l.padding ?? "md"}
            onChange={(e) => patch({ padding: e.target.value as PaddingSize })}
          >
            <option value="none">None</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </div>
      </div>
    </details>
  );
}

/* ─────────────────────── AI Suggest button ─────────────────────── */

async function fetchSuggest(
  body: string,
  hint: "hero" | "cta" | "product" | "generic",
  keyword?: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, hint, keyword: keyword ?? "" }),
    });
    const data = (await res.json()) as { ok: boolean; suggestion?: string; error?: string };
    if (data.ok && data.suggestion) return data.suggestion;
    console.warn("[AI Suggest]", data.error);
    return null;
  } catch (err) {
    console.warn("[AI Suggest] request failed", err);
    return null;
  }
}

function AiSuggestButton({
  current,
  hint,
  keyword,
  onSuggest,
  label = "✨ AI Suggest",
}: {
  current: string;
  hint: "hero" | "cta" | "product" | "generic";
  keyword?: string;
  onSuggest: (text: string) => void;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="mc-btn mc-btn--ghost"
      disabled={pending || !current.trim()}
      onClick={async () => {
        setPending(true);
        const suggestion = await fetchSuggest(current, hint, keyword);
        setPending(false);
        if (suggestion) onSuggest(suggestion);
      }}
      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
    >
      {pending ? "Thinking…" : label}
    </button>
  );
}

/* ─────────────────────── Image upload helper ─────────────────────── */

function ImageUpload({
  value,
  onChange,
  label = "Image",
  accept = "image/*",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const result = await postAdminUpload(file, "cms");
    if (result.ok) onChange(result.url);
    else setError(result.error);
    setUploading(false);
  };

  return (
    <div>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <div className="mc-qr-upload">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={cx("mc-btn mc-btn--primary mc-upload-btn", uploading && "is-loading")}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            className="mc-admin__link mc-admin__link--danger"
            onClick={() => onChange("")}
            style={{ marginLeft: 8 }}
          >
            Remove
          </button>
        )}
      </div>
      {value && (
        <p className="mc-admin__hint">
          <code>{value}</code>
        </p>
      )}
      {error && (
        <p className="mc-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────── Type-specific field editors ─────────────────────── */

type FieldsProps<T extends ContentBlock> = {
  block: T;
  onChange: (patch: Partial<T>) => void;
};

function RichtextFields({
  block,
  onChange,
  onHumanize,
  humanizing,
  seoKeyword,
}: FieldsProps<Extract<ContentBlock, { type: "richtext" }>> & {
  onHumanize?: (id: string) => void;
  humanizing?: boolean;
  seoKeyword?: string;
}) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field">
        <label>Heading</label>
        <input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Optional heading"
        />
      </div>
      <div className="mc-field">
        <label>Heading level</label>
        <select
          value={block.headingLevel ?? 2}
          onChange={(e) =>
            onChange({ headingLevel: Number(e.target.value) as 2 | 3 | 4 })
          }
        >
          <option value={2}>H2</option>
          <option value={3}>H3</option>
          <option value={4}>H4</option>
        </select>
      </div>
      <div className="mc-field mc-field--full">
        <label>Body *</label>
        <textarea
          rows={5}
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
          required
        />
      </div>
      <div className="mc-field mc-field--full" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <AiSuggestButton
          current={block.body}
          hint="generic"
          keyword={seoKeyword}
          onSuggest={(text) => onChange({ body: text })}
        />
        {onHumanize && (
          <button
            type="button"
            className="mc-btn mc-btn--ghost"
            disabled={humanizing || !block.body.trim()}
            onClick={() => onHumanize(block.id)}
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
          >
            {humanizing ? "Humanizing…" : "✨ Humanize"}
          </button>
        )}
      </div>
    </div>
  );
}

function ImageFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "image" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <ImageUpload
          value={block.src}
          onChange={(url) => onChange({ src: url })}
          label="Image *"
        />
      </div>
      <div className="mc-field">
        <label>Alt text (SEO)</label>
        <input
          value={block.alt ?? ""}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Describe the image"
        />
      </div>
      <div className="mc-field">
        <label>Caption</label>
        <input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
      </div>
      {block.src && (
        <div className="mc-field mc-field--full">
          <label>Image framing</label>
          <ImageAdjustFields
            value={block.imageFocus}
            onChange={(imageFocus) => onChange({ imageFocus })}
            previewUrl={block.src}
          />
        </div>
      )}
    </div>
  );
}

function HeroFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "hero" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Eyebrow</label>
        <input
          value={block.eyebrow ?? ""}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
          placeholder="New Season"
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Subheading</label>
        <input
          value={block.subheading ?? ""}
          onChange={(e) => onChange({ subheading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <AiSuggestButton
          current={`${block.heading} ${block.subheading ?? ""}`.trim()}
          hint="hero"
          onSuggest={(text) => onChange({ subheading: text })}
          label="✨ Suggest subheading"
        />
      </div>
      <div className="mc-field mc-field--full">
        <HybridImagePicker
          value={block.backgroundImage ?? ""}
          onChange={(url) => onChange({ backgroundImage: url })}
          subdir="cms"
          label="Background image"
          helpText="Upload, paste a URL, replace, or remove."
        />
      </div>
      {block.backgroundImage && (
        <div className="mc-field mc-field--full">
          <label>Image framing</label>
          <ImageAdjustFields
            value={block.imageFocus}
            onChange={(imageFocus) => onChange({ imageFocus })}
            showOverlay
            overlay={block.overlayStrength ?? 55}
            onOverlayChange={(overlayStrength) => onChange({ overlayStrength })}
            previewUrl={block.backgroundImage}
          />
        </div>
      )}
      <div className="mc-field">
        <label>CTA label</label>
        <input
          value={block.ctaLabel ?? ""}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>CTA link</label>
        <input
          value={block.ctaHref ?? ""}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
          placeholder="/shop or https://…"
        />
      </div>
      <div className="mc-field mc-field--full">
        <label className="mc-check">
          <input
            type="checkbox"
            checked={block.showCategoryLinks !== false}
            onChange={(e) =>
              onChange({ showCategoryLinks: e.target.checked })
            }
          />{" "}
          Show all top categories as buttons (next to primary CTA)
        </label>
        <p className="mc-admin__hint">
          Pulls live category names/links from your catalog — add or rename
          categories in Admin → Categories and they appear here after save.
        </p>
      </div>
      {block.showCategoryLinks === false && (
        <>
          <div className="mc-field">
            <label>Secondary CTA label</label>
            <input
              value={block.secondaryCtaLabel ?? ""}
              onChange={(e) =>
                onChange({ secondaryCtaLabel: e.target.value })
              }
            />
          </div>
          <div className="mc-field">
            <label>Secondary CTA link</label>
            <input
              value={block.secondaryCtaHref ?? ""}
              onChange={(e) => onChange({ secondaryCtaHref: e.target.value })}
              placeholder="/shop"
            />
          </div>
        </>
      )}
      <div className="mc-field">
        <label>Height</label>
        <select
          value={block.height ?? "medium"}
          onChange={(e) =>
            onChange({ height: e.target.value as "small" | "medium" | "large" })
          }
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );
}

function CtaFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "cta" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Body</label>
        <input
          value={block.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <AiSuggestButton
          current={block.body ?? block.heading}
          hint="cta"
          onSuggest={(text) => onChange({ body: text })}
        />
      </div>
      <div className="mc-field">
        <label>Button label *</label>
        <input
          value={block.ctaLabel}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>Button link *</label>
        <input
          value={block.ctaHref}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>Variant</label>
        <select
          value={block.variant ?? "dark"}
          onChange={(e) =>
            onChange({ variant: e.target.value as "dark" | "light" | "gold" })
          }
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="gold">Gold</option>
        </select>
      </div>
    </div>
  );
}

function FaqFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "faq" }>>) {
  const updateItem = (i: number, patch: Partial<FaqItem>) =>
    onChange({
      items: block.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    });
  const removeItem = (i: number) =>
    onChange({ items: block.items.filter((_, idx) => idx !== i) });
  const addItem = () =>
    onChange({ items: [...block.items, { q: "", a: "" }] });

  return (
    <div className="mc-admin__form-grid">
      {block.items.map((it, i) => (
        <div key={i} className="mc-field mc-field--full mc-blk-faq-item">
          <div className="mc-blk-faq-item__header">
            <span className="mc-admin__row-id">Q&amp;A #{i + 1}</span>
            <button
              type="button"
              className="mc-admin__link mc-admin__link--danger"
              onClick={() => removeItem(i)}
              disabled={block.items.length <= 1}
            >
              Remove
            </button>
          </div>
          <label>Question</label>
          <input
            value={it.q}
            onChange={(e) => updateItem(i, { q: e.target.value })}
          />
          <label style={{ marginTop: 8 }}>Answer</label>
          <textarea
            rows={2}
            value={it.a}
            onChange={(e) => updateItem(i, { a: e.target.value })}
          />
        </div>
      ))}
      <div className="mc-field mc-field--full">
        <button type="button" className="mc-btn mc-btn--ghost" onClick={addItem}>
          + Add Q&amp;A
        </button>
      </div>
    </div>
  );
}

function FeaturesFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "features" }>>) {
  const updateItem = (i: number, patch: Partial<FeatureItem>) =>
    onChange({
      items: block.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    });
  const removeItem = (i: number) =>
    onChange({ items: block.items.filter((_, idx) => idx !== i) });
  const addItem = () =>
    onChange({ items: [...block.items, { title: "New benefit", body: "" }] });

  return (
    <div className="mc-admin__form-grid">
      <p className="mc-field__hint mc-field--full" style={{ margin: 0 }}>
        Four-column benefits bar — Complimentary Shipping, Authenticity, etc.
        Edit each column&apos;s title and description below.
      </p>
      {block.items.map((it, i) => (
        <div key={i} className="mc-field mc-field--full mc-blk-faq-item">
          <div className="mc-blk-faq-item__header">
            <span className="mc-admin__row-id">Column #{i + 1}</span>
            <button
              type="button"
              className="mc-admin__link mc-admin__link--danger"
              onClick={() => removeItem(i)}
              disabled={block.items.length <= 1}
            >
              Remove
            </button>
          </div>
          <label>Title</label>
          <input
            value={it.title}
            onChange={(e) => updateItem(i, { title: e.target.value })}
            placeholder="Complimentary Shipping"
          />
          <label style={{ marginTop: 8 }}>Description</label>
          <textarea
            rows={2}
            value={it.body}
            onChange={(e) => updateItem(i, { body: e.target.value })}
            placeholder="On all orders over $75, delivered with care."
          />
        </div>
      ))}
      <div className="mc-field mc-field--full">
        <button
          type="button"
          className="mc-btn mc-btn--ghost"
          onClick={addItem}
          disabled={block.items.length >= 6}
        >
          + Add column
        </button>
      </div>
    </div>
  );
}

function EditorialFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "editorial" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <p className="mc-field mc-field--full mc-admin__callout">
        Homepage About-style section — edit eyebrow, heading, body, image, and button
        here. Open <strong>Layout &amp; spacing → Alignment → Center</strong> to center
        text on the live site.
      </p>
      <div className="mc-field">
        <label>Eyebrow</label>
        <input
          value={block.eyebrow ?? ""}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Body * (counts for SEO word count)</label>
        <textarea
          rows={6}
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Write at least 150 words total across your page blocks. Include your primary keyword here."
        />
      </div>
      <div className="mc-field mc-field--full">
        <ImageUpload
          value={block.image ?? ""}
          onChange={(url) => onChange({ image: url })}
          label="Image"
        />
      </div>
      {block.image && (
        <div className="mc-field mc-field--full">
          <label>Image framing</label>
          <ImageAdjustFields
            value={block.imageFocus}
            onChange={(imageFocus) => onChange({ imageFocus })}
            previewUrl={block.image}
          />
        </div>
      )}
      <div className="mc-field">
        <label>CTA label</label>
        <input
          value={block.ctaLabel ?? ""}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>CTA link</label>
        <input
          value={block.ctaHref ?? ""}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
        />
      </div>
    </div>
  );
}

function SplitBannerFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "splitbanner" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <p className="mc-field mc-field--full mc-admin__callout">
        Split image + text promo (e.g. &quot;Explore the look&quot;). Edit heading,
        body, and CTA below. Use <strong>Layout → Alignment → Center</strong> to center
        the text panel.
      </p>
      <div className="mc-field mc-field--full">
        <ImageUpload
          value={block.image}
          onChange={(url) => onChange({ image: url })}
          label="Image *"
        />
      </div>
      {block.image && (
        <div className="mc-field mc-field--full">
          <label>Image framing</label>
          <ImageAdjustFields
            value={block.imageFocus}
            onChange={(imageFocus) => onChange({ imageFocus })}
            previewUrl={block.image}
          />
        </div>
      )}
      <div className="mc-field">
        <label>Image position</label>
        <select
          value={block.imagePosition ?? "left"}
          onChange={(e) =>
            onChange({ imagePosition: e.target.value as "left" | "right" })
          }
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div className="mc-field">
        <label>Panel style</label>
        <select
          value={block.variant ?? "cream"}
          onChange={(e) =>
            onChange({ variant: e.target.value as "light" | "cream" | "dark" })
          }
        >
          <option value="cream">Cream</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="mc-field">
        <label>Eyebrow</label>
        <input
          value={block.eyebrow ?? ""}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Body (counts for SEO word count)</label>
        <textarea
          rows={5}
          value={block.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Long paragraph beside the image — include your primary keyword."
        />
      </div>
      <div className="mc-field">
        <label>CTA label</label>
        <input
          value={block.ctaLabel ?? ""}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>CTA link</label>
        <input
          value={block.ctaHref ?? ""}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
        />
      </div>
    </div>
  );
}

function CountdownFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "countdown" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Body</label>
        <input
          value={block.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Countdown ends (date &amp; time)</label>
        <input
          type="datetime-local"
          value={block.targetDate ? block.targetDate.slice(0, 16) : ""}
          onChange={(e) =>
            onChange({
              targetDate: e.target.value
                ? new Date(e.target.value).toISOString()
                : block.targetDate,
            })
          }
        />
      </div>
      <div className="mc-field">
        <label>Style</label>
        <select
          value={block.variant ?? "accent"}
          onChange={(e) =>
            onChange({ variant: e.target.value as "accent" | "dark" })
          }
        >
          <option value="accent">Accent (red)</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="mc-field">
        <label>CTA label</label>
        <input
          value={block.ctaLabel ?? ""}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>CTA link</label>
        <input
          value={block.ctaHref ?? ""}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
        />
      </div>
    </div>
  );
}

function CategoryGridFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "categorygrid" }>>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field">
        <label>Layout style</label>
        <select
          value={block.variant ?? "grid"}
          onChange={(e) =>
            onChange({
              variant: e.target.value === "banners" ? "banners" : "grid",
            })
          }
        >
          <option value="grid">Compact category cards</option>
          <option value="banners">Full category promo banners</option>
        </select>
      </div>
      {block.variant === "banners" && (
        <div className="mc-field">
          <label>Show large promo banners</label>
          <select
            value={block.showPromoBanners === false ? "off" : "on"}
            onChange={(e) =>
              onChange({ showPromoBanners: e.target.value === "on" })
            }
          >
            <option value="on">Yes — promo strips + style cards</option>
            <option value="off">No — style cards only</option>
          </select>
        </div>
      )}
      <div className="mc-field">
        <label>Eyebrow</label>
        <input
          value={block.eyebrow ?? ""}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>Heading</label>
        <input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Subheading</label>
        <input
          value={block.subheading ?? ""}
          onChange={(e) => onChange({ subheading: e.target.value })}
        />
      </div>
      {block.variant !== "banners" && (
        <div className="mc-field">
          <label>Max categories</label>
          <input
            type="number"
            min={1}
            max={12}
            value={block.limit ?? 5}
            onChange={(e) => onChange({ limit: Number(e.target.value) || 5 })}
          />
        </div>
      )}
      <p className="mc-field__hint mc-field--full">
        Categories are managed under Admin → Categories. Use ↑ ↓ on this card to
        move the whole section on the page. Delete the block to remove it.
      </p>
    </div>
  );
}

function ColumnsFields({
  block,
  onChange,
}: FieldsProps<Extract<ContentBlock, { type: "columns" }>>) {
  const updateCol = (i: number, patch: Partial<ColumnData>) => {
    const columns = block.columns.map((c, idx) =>
      idx === i ? { ...c, ...patch } : c,
    );
    onChange({ columns });
  };
  const setCount = (count: 2 | 3) => {
    const columns = block.columns.slice(0, count);
    while (columns.length < count) columns.push({ heading: "", body: "" });
    onChange({ count, columns });
  };

  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field">
        <label>Number of columns</label>
        <select
          value={block.count}
          onChange={(e) => setCount(Number(e.target.value) as 2 | 3)}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
      {block.columns.map((c, i) => (
        <div
          key={i}
          className={cx("mc-field", block.count === 3 ? "mc-field--full" : "")}
        >
          <label>Column {i + 1} heading</label>
          <input
            value={c.heading ?? ""}
            onChange={(e) => updateCol(i, { heading: e.target.value })}
          />
          <label style={{ marginTop: 6 }}>Body</label>
          <textarea
            rows={3}
            value={c.body}
            onChange={(e) => updateCol(i, { body: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

/* ─────────────── New block editors ─────────────── */

function BannerFields({
  block,
  onChange,
  seoKeyword,
}: FieldsProps<BannerBlock> & { seoKeyword?: string }) {
  const selected = new Set(block.categoryIds ?? []);
  const toggleCat = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ categoryIds: [...next] });
  };
  const fillShopLinks = () =>
    onChange({
      variant: "promo",
      categoryIds: BANNER_SHOP_LINK_OPTIONS.map((o) => o.id),
      eyebrow: block.eyebrow || "Black Friday Sale",
      heading: block.heading || "Shop Women's Clothing",
      body:
        block.body ||
        "Dresses, denim, and everyday essentials — Black Friday savings now on.",
      ctaLabel: block.ctaLabel || "Shop Black Friday",
      ctaHref: block.ctaHref || "/sale",
      secondaryCtaLabel:
        block.secondaryCtaLabel || "Browse Women's Clothing",
      secondaryCtaHref:
        block.secondaryCtaHref || "/category/womens-clothing",
    });

  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field">
        <label>Banner style</label>
        <select
          value={block.variant ?? "overlay"}
          onChange={(e) =>
            onChange({
              variant: e.target.value === "promo" ? "promo" : "overlay",
            })
          }
        >
          <option value="overlay">Classic centered overlay</option>
          <option value="promo">Shop promo + category links</option>
        </select>
      </div>
      <div className="mc-field mc-field--full">
        <ImageUpload
          value={block.image}
          onChange={(url) => onChange({ image: url })}
          label="Banner image *"
        />
      </div>
      {block.image && (
        <div className="mc-field mc-field--full">
          <label>Image framing</label>
          <ImageAdjustFields
            value={block.imageFocus}
            onChange={(imageFocus) => onChange({ imageFocus })}
            showOverlay
            overlay={block.overlayStrength ?? 50}
            onOverlayChange={(overlayStrength) => onChange({ overlayStrength })}
            previewUrl={block.image}
          />
        </div>
      )}
      <div className="mc-field">
        <label>Eyebrow</label>
        <input
          value={block.eyebrow ?? ""}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
          placeholder="e.g. Black Friday Sale"
        />
      </div>
      <div className="mc-field">
        <label>Overlay</label>
        <select
          value={block.overlay ?? "dark"}
          onChange={(e) =>
            onChange({ overlay: e.target.value as "none" | "light" | "dark" })
          }
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="none">None</option>
        </select>
      </div>
      <div className="mc-field mc-field--full">
        <label>Heading *</label>
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Body</label>
        <input
          value={block.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <AiSuggestButton
          current={block.body || block.heading}
          hint="generic"
          keyword={seoKeyword}
          onSuggest={(text) => onChange({ body: text })}
        />
      </div>
      <div className="mc-field">
        <label>Primary CTA label</label>
        <input
          value={block.ctaLabel ?? ""}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>
      <div className="mc-field">
        <label>Primary CTA link</label>
        <input
          value={block.ctaHref ?? ""}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
          placeholder="/sale"
        />
      </div>
      <div className="mc-field">
        <label>Secondary CTA label</label>
        <input
          value={block.secondaryCtaLabel ?? ""}
          onChange={(e) => onChange({ secondaryCtaLabel: e.target.value })}
          placeholder="Browse Women's Clothing"
        />
      </div>
      <div className="mc-field">
        <label>Secondary CTA link</label>
        <input
          value={block.secondaryCtaHref ?? ""}
          onChange={(e) => onChange({ secondaryCtaHref: e.target.value })}
          placeholder="/category/womens-clothing"
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Category quick links (chips)</label>
        <p className="mc-field__hint" style={{ marginBottom: 8 }}>
          Customers click these to open each category. Tick the styles you want
          on this banner.
        </p>
        <button
          type="button"
          className="mc-admin__link"
          onClick={fillShopLinks}
          style={{ marginBottom: 10 }}
        >
          Fill clothing + jeans styles
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 6,
          }}
        >
          {BANNER_SHOP_LINK_OPTIONS.map((opt) => (
            <label key={opt.id} style={{ fontSize: "0.85rem" }}>
              <input
                type="checkbox"
                checked={selected.has(opt.id)}
                onChange={() => toggleCat(opt.id)}
              />{" "}
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderFields({
  block,
  onChange,
}: FieldsProps<SliderBlock>) {
  const updateSlide = (i: number, patch: Partial<SlideData>) =>
    onChange({
      slides: block.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  const removeSlide = (i: number) =>
    onChange({ slides: block.slides.filter((_, idx) => idx !== i) });
  const addSlide = () =>
    onChange({
      slides: [
        ...block.slides,
        { image: "", heading: "", body: "", ctaLabel: "Shop", ctaHref: "/shop" },
      ],
    });
  const isMarketing = block.variant === "marketing";

  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field">
        <label>Slider style</label>
        <select
          value={block.variant ?? "simple"}
          onChange={(e) =>
            onChange({
              variant: e.target.value === "marketing" ? "marketing" : "simple",
              useStoreSlides:
                e.target.value === "marketing"
                  ? block.useStoreSlides !== false
                  : false,
            })
          }
        >
          <option value="simple">Simple image slider</option>
          <option value="marketing">Marketing promo banner</option>
        </select>
      </div>
      {isMarketing && (
        <>
          <div className="mc-field">
            <label>Slide source</label>
            <select
              value={block.useStoreSlides === false ? "inline" : "store"}
              onChange={(e) =>
                onChange({ useStoreSlides: e.target.value === "store" })
              }
            >
              <option value="store">Store banner slides (recommended)</option>
              <option value="inline">Custom slides below</option>
            </select>
          </div>
          <div className="mc-field">
            <label>Countdown ends (ISO date)</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(block.countdownTo)}
              onChange={(e) =>
                onChange({
                  countdownTo: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
            />
          </div>
        </>
      )}
      <div className="mc-field">
        <label>Autoplay</label>
        <select
          value={block.autoplay === false ? "off" : "on"}
          onChange={(e) => onChange({ autoplay: e.target.value === "on" })}
        >
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
      </div>
      <div className="mc-field">
        <label>Interval (ms)</label>
        <input
          type="number"
          min={1500}
          step={500}
          value={block.intervalMs ?? 5000}
          onChange={(e) =>
            onChange({
              intervalMs: Math.max(1500, Number(e.target.value) || 5000),
            })
          }
        />
      </div>
      {isMarketing && block.useStoreSlides !== false ? (
        <p className="mc-field__hint mc-field--full">
          This block uses the storefront banner slides. Move it with ↑ ↓, or
          delete it to remove the top promo banner from the page.
        </p>
      ) : (
        <>
          {block.slides.map((s, i) => (
            <div
              key={i}
              className="mc-field mc-field--full mc-blk-faq-item"
              style={{ borderTop: "1px dashed #ccc", paddingTop: 12 }}
            >
              <div className="mc-blk-faq-item__header">
                <span className="mc-admin__row-id">Slide #{i + 1}</span>
                <button
                  type="button"
                  className="mc-admin__link mc-admin__link--danger"
                  onClick={() => removeSlide(i)}
                  disabled={block.slides.length <= 1}
                >
                  Remove
                </button>
              </div>
              <ImageUpload
                value={s.image}
                onChange={(url) => updateSlide(i, { image: url })}
                label="Slide image *"
              />
              <label style={{ marginTop: 8 }}>Heading</label>
              <input
                value={s.heading ?? ""}
                onChange={(e) => updateSlide(i, { heading: e.target.value })}
              />
              <label style={{ marginTop: 6 }}>Body</label>
              <input
                value={s.body ?? ""}
                onChange={(e) => updateSlide(i, { body: e.target.value })}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                <div>
                  <label>CTA label</label>
                  <input
                    value={s.ctaLabel ?? ""}
                    onChange={(e) =>
                      updateSlide(i, { ctaLabel: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>CTA link</label>
                  <input
                    value={s.ctaHref ?? ""}
                    onChange={(e) =>
                      updateSlide(i, { ctaHref: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="mc-field mc-field--full">
            <button
              type="button"
              className="mc-btn mc-btn--ghost"
              onClick={addSlide}
            >
              + Add slide
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function VideoFields({
  block,
  onChange,
}: FieldsProps<VideoBlock>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Video URL *</label>
        <input
          value={block.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="YouTube, Vimeo, or direct .mp4"
        />
        <p className="mc-admin__hint">
          Paste a YouTube / Vimeo watch URL, or a direct video file URL.
        </p>
      </div>
      <div className="mc-field mc-field--full">
        <ImageUpload
          value={block.poster ?? ""}
          onChange={(url) => onChange({ poster: url })}
          label="Poster image (optional)"
        />
      </div>
      <div className="mc-field">
        <label>Autoplay</label>
        <select
          value={block.autoplay ? "on" : "off"}
          onChange={(e) => onChange({ autoplay: e.target.value === "on" })}
        >
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </div>
      <div className="mc-field">
        <label>Muted</label>
        <select
          value={block.muted === false ? "off" : "on"}
          onChange={(e) => onChange({ muted: e.target.value === "on" })}
        >
          <option value="on">Yes</option>
          <option value="off">No</option>
        </select>
      </div>
      <div className="mc-field mc-field--full">
        <label>Caption</label>
        <input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
      </div>
    </div>
  );
}

function ProductGridFields({
  block,
  onChange,
}: FieldsProps<ProductGridBlock>) {
  const idsAsString = (block.productIds ?? []).join(", ");
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Heading</label>
        <input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Featured products"
        />
      </div>
      <div className="mc-field">
        <label>Filter</label>
        <select
          value={block.filterTag ?? "featured"}
          onChange={(e) =>
            onChange({
              filterTag: e.target.value as "new" | "sale" | "featured" | "all",
            })
          }
        >
          <option value="featured">Featured (rating ≥ 4.5)</option>
          <option value="new">New arrivals</option>
          <option value="sale">On sale</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="mc-field">
        <label>Limit</label>
        <input
          type="number"
          min={1}
          max={48}
          value={block.limit ?? 8}
          onChange={(e) =>
            onChange({
              limit: Math.max(1, Math.min(48, Number(e.target.value) || 8)),
            })
          }
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Or, pin specific product IDs (comma-separated)</label>
        <input
          value={idsAsString}
          onChange={(e) =>
            onChange({
              productIds: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="2, 3, 5"
        />
        <p className="mc-admin__hint">
          When set, this overrides the Filter above. Empty = use the filter.
        </p>
      </div>
    </div>
  );
}

function MapFields({ block, onChange }: FieldsProps<MapBlock>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Map embed HTML</label>
        <textarea
          rows={4}
          value={block.embedHtml}
          onChange={(e) => onChange({ embedHtml: e.target.value })}
          placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Caption</label>
        <input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
      </div>
    </div>
  );
}

function ContactFormFields({
  block,
  onChange,
}: FieldsProps<ContactFormBlock>) {
  return (
    <div className="mc-admin__form-grid">
      <div className="mc-field mc-field--full">
        <label>Heading</label>
        <input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="mc-field mc-field--full">
        <label>Subheading</label>
        <input
          value={block.subheading ?? ""}
          onChange={(e) => onChange({ subheading: e.target.value })}
        />
      </div>
      <p className="mc-admin__hint mc-field--full">
        Renders the live contact form on the storefront. Pair with a Map block
        or the page-level Map embed field.
      </p>
    </div>
  );
}
