/**
 * Block-based CMS — client-safe types + factory helpers.
 *
 * Every block:
 *   • carries a stable `id` so reorder / update / delete can address it
 *     without index drift
 *   • has an optional `layout` bag ({ alignment, columnCount, padding })
 *     shared across every block type, so the admin editor renders those
 *     three controls once and lets the renderer apply them uniformly
 */

import type { ImageFocus } from "@/lib/images/focus";
import { normalizeImageFocus } from "@/lib/images/focus";

function parseImageFocus(raw: unknown): ImageFocus | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return normalizeImageFocus({
    x: typeof o.x === "number" ? o.x : undefined,
    y: typeof o.y === "number" ? o.y : undefined,
    fit: o.fit === "contain" ? "contain" : o.fit === "cover" ? "cover" : undefined,
  });
}

function parseOverlayStrength(raw: unknown): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return Math.min(90, Math.max(0, raw));
}

export type Alignment = "left" | "center" | "right" | "full";
export type ImageWidth = "small" | "medium" | "large" | "full";
export type HeroHeight = "small" | "medium" | "large";
export type CtaVariant = "dark" | "light" | "gold";
export type PaddingSize = "none" | "sm" | "md" | "lg" | "xl";
export type ColumnCount = 1 | 2 | 3 | 4;
/** Container width — Full (100%), Medium (~880px), Half (~50%). */
export type BlockWidth = "full" | "medium" | "half";

/**
 * Universal per-block layout controls. Every block type — old and new — reads
 * this bag. The BlockRenderer wraps the block in a `<div>` whose classes map
 * to real CSS (flex-start / justify-center / max-width caps), so what you see
 * in the admin form is exactly what ships to the storefront.
 */
export type BlockLayout = {
  alignment?: Alignment;   // ↔ horizontal position + text-align
  width?: BlockWidth;      // ↔ max-width of the container
  columnCount?: ColumnCount;
  padding?: PaddingSize;
};

export type BlockType =
  | "richtext"
  | "image"
  | "hero"
  | "cta"
  | "faq"
  | "columns"
  | "banner"
  | "slider"
  | "video"
  | "productgrid"
  | "map"
  | "contactform"
  | "features"
  | "editorial"
  | "splitbanner"
  | "countdown"
  | "categorygrid";

interface BaseBlock {
  id: string;
  type: BlockType;
  /** Shared layout settings — every block type respects these. */
  layout?: BlockLayout;
}

export type RichtextBlock = BaseBlock & {
  type: "richtext";
  heading?: string;
  headingLevel?: 2 | 3 | 4;
  body: string;
  alignment?: "left" | "center" | "right";
};

export type ImageBlock = BaseBlock & {
  type: "image";
  src: string;
  alt?: string;
  caption?: string;
  alignment?: Alignment;
  wrapText?: boolean;
  width?: ImageWidth;
  imageFocus?: ImageFocus;
};

export type HeroBlock = BaseBlock & {
  type: "hero";
  eyebrow?: string;
  heading: string;
  subheading?: string;
  backgroundImage?: string;
  imageFocus?: ImageFocus;
  overlayStrength?: number;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Ghost buttons for top categories next to the primary CTA. */
  showCategoryLinks?: boolean;
  height?: HeroHeight;
};

export type CtaBlock = BaseBlock & {
  type: "cta";
  heading: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  variant?: CtaVariant;
};

export type FaqItem = { q: string; a: string };
export type FaqBlock = BaseBlock & {
  type: "faq";
  items: FaqItem[];
};

export type ColumnData = { heading?: string; body: string };
export type ColumnsBlock = BaseBlock & {
  type: "columns";
  count: 2 | 3;
  columns: ColumnData[];
};

/** Full-bleed marketing banner — image background + eyebrow + heading + CTA. */
export type BannerBlock = BaseBlock & {
  type: "banner";
  image: string;
  imageFocus?: ImageFocus;
  overlayStrength?: number;
  eyebrow?: string;
  heading: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  overlay?: "none" | "light" | "dark";
};

export type SlideData = {
  image: string;
  imageFocus?: ImageFocus;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/** Rotating hero slider. Autoplay + interval configurable per instance. */
export type SliderBlock = BaseBlock & {
  type: "slider";
  slides: SlideData[];
  autoplay?: boolean;
  intervalMs?: number;
  /** `marketing` = storefront promo banner (optional store slides). */
  variant?: "simple" | "marketing";
  /** When true, marketing slider pulls slides from banner-slides.json. */
  useStoreSlides?: boolean;
  /** Optional countdown target for the marketing banner. */
  countdownTo?: string;
};

/** Video embed — supports YouTube / Vimeo / self-hosted mp4. */
export type VideoBlock = BaseBlock & {
  type: "video";
  url: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  caption?: string;
};

/** Curated product grid — pulls live from products.json by ids OR by tag. */
export type ProductGridBlock = BaseBlock & {
  type: "productgrid";
  heading?: string;
  productIds?: Array<number | string>;
  filterTag?: "new" | "sale" | "featured" | "all";
  limit?: number;
};

/** Google Maps iframe embed. */
export type MapBlock = BaseBlock & {
  type: "map";
  embedHtml: string;
  caption?: string;
};

/** Renders the storefront contact form — no fields to configure. */
export type ContactFormBlock = BaseBlock & {
  type: "contactform";
  heading?: string;
  subheading?: string;
};

/** Four-column store benefits strip (shipping, authenticity, etc.). */
export type FeatureItem = { title: string; body: string };
export type FeaturesBlock = BaseBlock & {
  type: "features";
  items: FeatureItem[];
};

/** Split editorial — image + copy side by side. */
export type EditorialBlock = BaseBlock & {
  type: "editorial";
  eyebrow?: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
  imageAlt?: string;
  imageFocus?: ImageFocus;
};

/** 50/50 promo — portrait image + text panel. */
export type SplitBannerBlock = BaseBlock & {
  type: "splitbanner";
  image: string;
  imageFocus?: ImageFocus;
  imagePosition?: "left" | "right";
  eyebrow?: string;
  heading: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  variant?: "light" | "cream" | "dark";
};

/** Urgency strip with live countdown timer. */
export type CountdownBlock = BaseBlock & {
  type: "countdown";
  heading: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  targetDate: string;
  variant?: "accent" | "dark";
};

/** Category showcase — pulls from categories.json. */
export type CategoryGridBlock = BaseBlock & {
  type: "categorygrid";
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  limit?: number;
  categoryIds?: string[];
  /** `banners` = full category promo strips; `grid` = compact cards. */
  variant?: "grid" | "banners";
};

export type ContentBlock =
  | RichtextBlock
  | ImageBlock
  | HeroBlock
  | CtaBlock
  | FaqBlock
  | ColumnsBlock
  | BannerBlock
  | SliderBlock
  | VideoBlock
  | ProductGridBlock
  | MapBlock
  | ContactFormBlock
  | FeaturesBlock
  | EditorialBlock
  | SplitBannerBlock
  | CountdownBlock
  | CategoryGridBlock;

export type BlockTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: "landing" | "content" | "product" | "legal";
  blocks: ContentBlock[];
};

/** Client + server safe id generator. */
export function makeBlockId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `blk_${rand}`;
}

const defaultLayout: BlockLayout = {
  alignment: "center",
  width: "full",
  columnCount: 1,
  padding: "md",
};

const defaultFeatureItems: FeatureItem[] = [
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
];

/**
 * BlockFactory — creates blocks with sensible defaults + stable ids.
 */
export const BlockFactory = {
  allTypes(): Array<{ type: BlockType; label: string; icon: string }> {
    return [
      { type: "hero", label: "Hero", icon: "★" },
      { type: "banner", label: "Banner", icon: "▬" },
      { type: "slider", label: "Slider", icon: "⟷" },
      { type: "richtext", label: "Text", icon: "¶" },
      { type: "image", label: "Image", icon: "▣" },
      { type: "video", label: "Video", icon: "▶" },
      { type: "productgrid", label: "Product grid", icon: "▦" },
      { type: "features", label: "Store benefits", icon: "✦" },
      { type: "editorial", label: "Editorial split", icon: "◫" },
      { type: "splitbanner", label: "Split promo", icon: "▥" },
      { type: "countdown", label: "Countdown offer", icon: "⏱" },
      { type: "categorygrid", label: "Category grid", icon: "▦" },
      { type: "map", label: "Map embed", icon: "⌖" },
      { type: "contactform", label: "Contact form", icon: "✉" },
      { type: "cta", label: "Call-to-action", icon: "◆" },
      { type: "faq", label: "FAQ", icon: "?" },
      { type: "columns", label: "Columns", icon: "▥" },
    ];
  },

  create(type: BlockType): ContentBlock {
    const id = makeBlockId();
    const layout = { ...defaultLayout };
    switch (type) {
      case "richtext":
        return {
          id,
          type,
          layout,
          heading: "",
          headingLevel: 2,
          body: "Write your content here.",
          alignment: "left",
        };
      case "image":
        return {
          id,
          type,
          layout,
          src: "",
          alt: "",
          caption: "",
          alignment: "center",
          wrapText: false,
          width: "medium",
        };
      case "hero":
        return {
          id,
          type,
          layout,
          eyebrow: "New Season",
          heading: "Your headline here",
          subheading: "A short subheading that sets the scene.",
          backgroundImage: "",
          ctaLabel: "Shop now",
          ctaHref: "/shop",
          secondaryCtaLabel: "Explore the edit",
          secondaryCtaHref: "/shop",
          showCategoryLinks: true,
          height: "medium",
        };
      case "cta":
        return {
          id,
          type,
          layout,
          heading: "Ready to get started?",
          body: "Optional supporting copy.",
          ctaLabel: "Get started",
          ctaHref: "/shop",
          variant: "dark",
        };
      case "faq":
        return {
          id,
          type,
          layout,
          items: [{ q: "Question here?", a: "Answer here." }],
        };
      case "columns":
        return {
          id,
          type,
          layout: { ...layout, columnCount: 2 },
          count: 2,
          columns: [
            { heading: "Column 1", body: "First column body." },
            { heading: "Column 2", body: "Second column body." },
          ],
        };
      case "banner":
        return {
          id,
          type,
          layout,
          image: "",
          eyebrow: "New collection",
          heading: "Bold banner headline",
          body: "One-line supporting copy.",
          ctaLabel: "Explore",
          ctaHref: "/shop",
          overlay: "dark",
        };
      case "slider":
        return {
          id,
          type,
          layout: { ...layout, padding: "none" },
          slides: [
            {
              image: "",
              heading: "Slide one",
              body: "Short line.",
              ctaLabel: "Shop",
              ctaHref: "/shop",
            },
            {
              image: "",
              heading: "Slide two",
              body: "Short line.",
              ctaLabel: "Shop",
              ctaHref: "/shop",
            },
          ],
          autoplay: true,
          intervalMs: 5000,
          variant: "simple",
          useStoreSlides: false,
          countdownTo: "",
        };
      case "video":
        return {
          id,
          type,
          layout,
          url: "",
          poster: "",
          autoplay: false,
          muted: true,
          caption: "",
        };
      case "productgrid":
        return {
          id,
          type,
          layout: { ...layout, columnCount: 4 },
          heading: "Featured products",
          productIds: [],
          filterTag: "featured",
          limit: 8,
        };
      case "map":
        return {
          id,
          type,
          layout,
          embedHtml: "",
          caption: "",
        };
      case "contactform":
        return {
          id,
          type,
          layout,
          heading: "Send a message",
          subheading: "We'll respond within one business day.",
        };
      case "features":
        return {
          id,
          type,
          layout: { ...layout, padding: "none" },
          items: defaultFeatureItems.map((item) => ({ ...item })),
        };
      case "editorial":
        return {
          id,
          type,
          layout: { ...layout, padding: "lg" },
          eyebrow: "The MayCSS Edit",
          heading: "Where Craft Meets Contemporary Style",
          body: "We partner with independent ateliers and heritage maisons to bring you a considered collection.",
          ctaLabel: "Our Story",
          ctaHref: "/about",
          image: "",
          imageAlt: "",
        };
      case "splitbanner":
        return {
          id,
          type,
          layout: { ...layout, padding: "none" },
          image: "",
          imagePosition: "left",
          eyebrow: "The Edit",
          heading: "Simple Is More",
          body: "Refined silhouettes for wardrobes that outlast trends.",
          ctaLabel: "Shop the look",
          ctaHref: "/shop",
          variant: "cream",
        };
      case "countdown":
        return {
          id,
          type,
          layout: { ...layout, padding: "none" },
          heading: "Limited-Time Offer",
          body: "Extra 15% off selected pieces — ends soon.",
          ctaLabel: "Shop the sale",
          ctaHref: "/sale",
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          variant: "accent",
        };
      case "categorygrid":
        return {
          id,
          type,
          layout: { ...layout, padding: "lg" },
          eyebrow: "Browse",
          heading: "Shop by Category",
          subheading: "Every piece, organised the way we shop.",
          limit: 5,
          categoryIds: [],
          variant: "grid",
        };
    }
  },

  /** Deep clone a block with a fresh id (for template application). */
  clone(block: ContentBlock): ContentBlock {
    return { ...JSON.parse(JSON.stringify(block)), id: makeBlockId() };
  },
};

/**
 * Normalise a legacy block (missing `id`, missing optional fields, missing
 * layout bag) into a fully-formed ContentBlock. Idempotent.
 */
export function normalizeBlock(raw: unknown): ContentBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const type = String(b.type ?? "");
  const id = typeof b.id === "string" && b.id ? b.id : makeBlockId();
  const rawLayout = b.layout as BlockLayout | undefined;
  const layout: BlockLayout = {
    alignment: rawLayout?.alignment ?? defaultLayout.alignment,
    width: rawLayout?.width ?? defaultLayout.width,
    columnCount: rawLayout?.columnCount ?? defaultLayout.columnCount,
    padding: rawLayout?.padding ?? defaultLayout.padding,
  };

  switch (type) {
    case "richtext":
      return {
        id,
        type: "richtext",
        layout,
        heading: typeof b.heading === "string" ? b.heading : undefined,
        headingLevel: (b.headingLevel as 2 | 3 | 4) ?? 2,
        body: String(b.body ?? ""),
        alignment:
          (b.alignment as "left" | "center" | "right" | undefined) ?? "left",
      };
    case "image":
      return {
        id,
        type: "image",
        layout,
        src: String(b.src ?? ""),
        alt: typeof b.alt === "string" ? b.alt : "",
        caption: typeof b.caption === "string" ? b.caption : "",
        alignment: (b.alignment as Alignment | undefined) ?? "center",
        wrapText: Boolean(b.wrapText),
        width: (b.width as ImageWidth | undefined) ?? "medium",
        imageFocus: parseImageFocus(b.imageFocus),
      };
    case "hero":
      return {
        id,
        type: "hero",
        layout,
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow : "",
        heading: String(b.heading ?? ""),
        subheading: typeof b.subheading === "string" ? b.subheading : "",
        backgroundImage:
          typeof b.backgroundImage === "string" ? b.backgroundImage : "",
        imageFocus: parseImageFocus(b.imageFocus),
        overlayStrength: parseOverlayStrength(b.overlayStrength),
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        secondaryCtaLabel:
          typeof b.secondaryCtaLabel === "string" ? b.secondaryCtaLabel : "",
        secondaryCtaHref:
          typeof b.secondaryCtaHref === "string" ? b.secondaryCtaHref : "",
        showCategoryLinks: b.showCategoryLinks !== false,
        height: (b.height as HeroHeight | undefined) ?? "medium",
      };
    case "cta":
      return {
        id,
        type: "cta",
        layout,
        heading: String(b.heading ?? ""),
        body: typeof b.body === "string" ? b.body : "",
        ctaLabel: String(b.ctaLabel ?? "Learn more"),
        ctaHref: String(b.ctaHref ?? "#"),
        variant: (b.variant as CtaVariant | undefined) ?? "dark",
      };
    case "faq":
      return {
        id,
        type: "faq",
        layout,
        items: Array.isArray(b.items)
          ? (b.items as unknown[]).map((it) => {
              const item = it as Record<string, unknown>;
              return {
                q: String(item.q ?? ""),
                a: String(item.a ?? ""),
              };
            })
          : [],
      };
    case "columns":
      return {
        id,
        type: "columns",
        layout,
        count: (b.count as 2 | 3) ?? 2,
        columns: Array.isArray(b.columns)
          ? (b.columns as unknown[]).map((c) => {
              const col = c as Record<string, unknown>;
              return {
                heading: typeof col.heading === "string" ? col.heading : "",
                body: String(col.body ?? ""),
              };
            })
          : [],
      };
    case "banner":
      return {
        id,
        type: "banner",
        layout,
        image: String(b.image ?? ""),
        imageFocus: parseImageFocus(b.imageFocus),
        overlayStrength: parseOverlayStrength(b.overlayStrength),
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow : "",
        heading: String(b.heading ?? ""),
        body: typeof b.body === "string" ? b.body : "",
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        overlay:
          (b.overlay as "none" | "light" | "dark" | undefined) ?? "dark",
      };
    case "slider":
      return {
        id,
        type: "slider",
        layout,
        slides: Array.isArray(b.slides)
          ? (b.slides as unknown[]).map((s) => {
              const slide = s as Record<string, unknown>;
              return {
                image: String(slide.image ?? ""),
                imageFocus: parseImageFocus(slide.imageFocus),
                heading: typeof slide.heading === "string" ? slide.heading : "",
                body: typeof slide.body === "string" ? slide.body : "",
                ctaLabel:
                  typeof slide.ctaLabel === "string" ? slide.ctaLabel : "",
                ctaHref:
                  typeof slide.ctaHref === "string" ? slide.ctaHref : "",
              };
            })
          : [],
        autoplay: b.autoplay !== false,
        intervalMs:
          typeof b.intervalMs === "number" && b.intervalMs > 500
            ? b.intervalMs
            : 5000,
        variant: b.variant === "marketing" ? "marketing" : "simple",
        useStoreSlides: Boolean(b.useStoreSlides),
        countdownTo:
          typeof b.countdownTo === "string" ? b.countdownTo : "",
      };
    case "video":
      return {
        id,
        type: "video",
        layout,
        url: String(b.url ?? ""),
        poster: typeof b.poster === "string" ? b.poster : "",
        autoplay: Boolean(b.autoplay),
        muted: b.muted !== false,
        caption: typeof b.caption === "string" ? b.caption : "",
      };
    case "productgrid":
      return {
        id,
        type: "productgrid",
        layout,
        heading: typeof b.heading === "string" ? b.heading : "",
        productIds: Array.isArray(b.productIds)
          ? (b.productIds as Array<number | string>)
          : [],
        filterTag:
          (b.filterTag as "new" | "sale" | "featured" | "all" | undefined) ??
          "featured",
        limit:
          typeof b.limit === "number" && b.limit > 0 && b.limit < 100
            ? b.limit
            : 8,
      };
    case "map":
      return {
        id,
        type: "map",
        layout,
        embedHtml: String(b.embedHtml ?? ""),
        caption: typeof b.caption === "string" ? b.caption : "",
      };
    case "contactform":
      return {
        id,
        type: "contactform",
        layout,
        heading: typeof b.heading === "string" ? b.heading : "",
        subheading: typeof b.subheading === "string" ? b.subheading : "",
      };
    case "features":
      return {
        id,
        type: "features",
        layout: { ...layout, padding: "none" },
        items: Array.isArray(b.items)
          ? (b.items as unknown[])
              .map((it) => {
                const item = it as Record<string, unknown>;
                const title = String(item.title ?? "").trim();
                const body = String(item.body ?? "").trim();
                if (!title && !body) return null;
                return { title, body };
              })
              .filter((item): item is FeatureItem => item !== null)
          : defaultFeatureItems.map((item) => ({ ...item })),
      };
    case "editorial":
      return {
        id,
        type: "editorial",
        layout,
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow : "",
        heading: String(b.heading ?? ""),
        body: String(b.body ?? ""),
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        image: typeof b.image === "string" ? b.image : "",
        imageAlt: typeof b.imageAlt === "string" ? b.imageAlt : "",
        imageFocus: parseImageFocus(b.imageFocus),
      };
    case "splitbanner":
      return {
        id,
        type: "splitbanner",
        layout: { ...layout, padding: "none" },
        image: String(b.image ?? ""),
        imageFocus: parseImageFocus(b.imageFocus),
        imagePosition: b.imagePosition === "right" ? "right" : "left",
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow : "",
        heading: String(b.heading ?? ""),
        body: typeof b.body === "string" ? b.body : "",
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        variant:
          (b.variant as "light" | "cream" | "dark" | undefined) ?? "cream",
      };
    case "countdown":
      return {
        id,
        type: "countdown",
        layout: { ...layout, padding: "none" },
        heading: String(b.heading ?? ""),
        body: typeof b.body === "string" ? b.body : "",
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        targetDate:
          typeof b.targetDate === "string" && b.targetDate.trim()
            ? b.targetDate.trim()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        variant: (b.variant as "accent" | "dark" | undefined) ?? "accent",
      };
    case "categorygrid":
      return {
        id,
        type: "categorygrid",
        layout,
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow : "",
        heading: typeof b.heading === "string" ? b.heading : "",
        subheading: typeof b.subheading === "string" ? b.subheading : "",
        limit:
          typeof b.limit === "number" && b.limit > 0 && b.limit <= 12
            ? b.limit
            : 5,
        categoryIds: Array.isArray(b.categoryIds)
          ? (b.categoryIds as unknown[]).map(String)
          : [],
        variant: b.variant === "banners" ? "banners" : "grid",
      };
    default:
      return null;
  }
}
