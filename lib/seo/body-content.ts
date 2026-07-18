/**
 * Shared helpers for SEO "body content" checks — word count + keyword placement.
 * Used by the auditor and admin SEO panels so both agree on what counts.
 */

import type { ContentBlock } from "@/lib/blocks/types";

export type BodySource = {
  id: string;
  label: string;
  field: string;
  words: number;
  preview: string;
};

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function preview(text: string, max = 72): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "(empty)";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Every user-visible string inside content blocks. */
export function extractBodyTextFromBlocks(blocks: ContentBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "richtext":
        if (b.heading) parts.push(b.heading);
        parts.push(b.body);
        break;
      case "hero":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "cta":
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "faq":
        for (const it of b.items) parts.push(it.q, it.a);
        break;
      case "columns":
        for (const c of b.columns) {
          if (c.heading) parts.push(c.heading);
          parts.push(c.body);
        }
        break;
      case "image":
        if (b.alt) parts.push(b.alt);
        if (b.caption) parts.push(b.caption);
        break;
      case "banner":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "slider":
        for (const s of b.slides) {
          if (s.heading) parts.push(s.heading);
          if (s.body) parts.push(s.body);
        }
        break;
      case "video":
        if (b.caption) parts.push(b.caption);
        break;
      case "productgrid":
        if (b.heading) parts.push(b.heading);
        break;
      case "map":
        if (b.caption) parts.push(b.caption);
        break;
      case "contactform":
        if (b.heading) parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "features":
        for (const it of b.items) parts.push(it.title, it.body);
        break;
      case "editorial":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading, b.body);
        break;
      case "splitbanner":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "countdown":
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "categorygrid":
        if (b.eyebrow) parts.push(b.eyebrow);
        if (b.heading) parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
    }
  }
  return parts.filter(Boolean).join(" ");
}

export function extractPageBodyText(
  blocks: ContentBlock[],
  hero?: string,
): string {
  const parts: string[] = [];
  if (hero?.trim()) parts.push(hero.trim());
  parts.push(extractBodyTextFromBlocks(blocks));
  return parts.filter(Boolean).join(" ");
}

const BLOCK_TYPE_LABEL: Record<ContentBlock["type"], string> = {
  hero: "Hero",
  banner: "Banner",
  slider: "Slider",
  richtext: "Rich text",
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

function pushSource(
  sources: BodySource[],
  id: string,
  label: string,
  field: string,
  text: string,
) {
  const words = countWords(text);
  if (words === 0) return;
  sources.push({
    id,
    label,
    field,
    words,
    preview: preview(text),
  });
}

/** Human-readable list of fields that feed page body word count / keyword checks. */
export function listPageBodySources(
  blocks: ContentBlock[],
  hero?: string,
): BodySource[] {
  const sources: BodySource[] = [];

  if (hero?.trim()) {
    pushSource(sources, "page-hero", "Page basics → Hero paragraph", "hero", hero);
  }

  for (const b of blocks) {
    const typeLabel = BLOCK_TYPE_LABEL[b.type];
    switch (b.type) {
      case "richtext":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body`,
          "body",
          `${b.heading ?? ""} ${b.body}`.trim(),
        );
        break;
      case "editorial":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body (About-style section)`,
          "body",
          `${b.eyebrow ?? ""} ${b.heading} ${b.body}`.trim(),
        );
        break;
      case "splitbanner":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body (image + text panel)`,
          "body",
          `${b.eyebrow ?? ""} ${b.heading} ${b.body ?? ""}`.trim(),
        );
        break;
      case "hero":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Heading & subheading`,
          "heading",
          `${b.eyebrow ?? ""} ${b.heading} ${b.subheading ?? ""}`.trim(),
        );
        break;
      case "cta":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body`,
          "body",
          `${b.heading} ${b.body ?? ""}`.trim(),
        );
        break;
      case "banner":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body`,
          "body",
          `${b.eyebrow ?? ""} ${b.heading} ${b.body ?? ""}`.trim(),
        );
        break;
      case "faq":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Questions & answers`,
          "items",
          b.items.map((i) => `${i.q} ${i.a}`).join(" "),
        );
        break;
      case "columns":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Column text`,
          "columns",
          b.columns.map((c) => `${c.heading ?? ""} ${c.body}`).join(" "),
        );
        break;
      case "features":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Benefit text`,
          "items",
          b.items.map((i) => `${i.title} ${i.body}`).join(" "),
        );
        break;
      case "countdown":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Body`,
          "body",
          `${b.heading} ${b.body ?? ""}`.trim(),
        );
        break;
      case "slider":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Slide copy`,
          "slides",
          b.slides.map((s) => `${s.heading ?? ""} ${s.body ?? ""}`).join(" "),
        );
        break;
      case "categorygrid":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Intro text`,
          "subheading",
          `${b.eyebrow ?? ""} ${b.heading ?? ""} ${b.subheading ?? ""}`.trim(),
        );
        break;
      case "productgrid":
        if (b.heading) {
          pushSource(sources, b.id, `${typeLabel} → Heading`, "heading", b.heading);
        }
        break;
      case "image":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Alt / caption`,
          "alt",
          `${b.alt ?? ""} ${b.caption ?? ""}`.trim(),
        );
        break;
      case "video":
        if (b.caption) {
          pushSource(sources, b.id, `${typeLabel} → Caption`, "caption", b.caption);
        }
        break;
      case "map":
        if (b.caption) {
          pushSource(sources, b.id, `${typeLabel} → Caption`, "caption", b.caption);
        }
        break;
      case "contactform":
        pushSource(
          sources,
          b.id,
          `${typeLabel} → Intro`,
          "subheading",
          `${b.heading ?? ""} ${b.subheading ?? ""}`.trim(),
        );
        break;
    }
  }

  return sources;
}
