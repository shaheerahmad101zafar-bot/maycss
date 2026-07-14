import "server-only";

import type { Metadata } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  normalizeBlock,
  type ContentBlock,
  type BlockTemplate,
} from "./blocks/types";

export type PageSeo = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
};

/** Controls optional route-specific storefront behaviour. */
export type PageKind = "standard" | "contact" | "shop" | "sale";

export type Page = {
  id: string;
  slug: string;
  title: string;
  eyebrow?: string;
  hero?: string;
  /** Full-width banner image shown above the page header. */
  bannerImage?: string;
  /** Route template — contact (map/form), shop (category index), sale (sale grid). */
  pageKind?: PageKind;
  /** Google Maps iframe embed HTML — used when pageKind is contact. */
  mapEmbed?: string;
  published: boolean;
  showInFooter?: boolean;
  footerColumn?: "company" | "legal" | "shop";
  lastUpdated?: string;
  seo?: PageSeo;
  blocks: ContentBlock[];
};

export type { ContentBlock } from "./blocks/types";

const file = path.join(process.cwd(), "data", "pages.json");

const PAGE_KINDS: PageKind[] = ["standard", "contact", "shop", "sale"];

function normalizePage(raw: Partial<Page>): Page {
  const pageKind = PAGE_KINDS.includes(raw.pageKind as PageKind)
    ? (raw.pageKind as PageKind)
    : "standard";
  return {
    id: String(raw.id ?? raw.slug ?? "page"),
    slug: String(raw.slug ?? raw.id ?? "page"),
    title: String(raw.title ?? "Untitled"),
    eyebrow: raw.eyebrow,
    hero: raw.hero,
    bannerImage:
      typeof raw.bannerImage === "string" ? raw.bannerImage : undefined,
    pageKind,
    mapEmbed: typeof raw.mapEmbed === "string" ? raw.mapEmbed : undefined,
    published: raw.published ?? true,
    showInFooter: raw.showInFooter,
    footerColumn: raw.footerColumn,
    lastUpdated: raw.lastUpdated,
    seo: raw.seo ?? {},
    blocks: Array.isArray(raw.blocks)
      ? (raw.blocks
          .map((b) => normalizeBlock(b))
          .filter((b): b is ContentBlock => b !== null))
      : [],
  };
}

async function readAll(): Promise<Page[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Page>[];
    return parsed.map(normalizePage);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(list: Page[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(list, null, 2) + "\n", "utf8");
}

/**
 * PageFactory — CRUD + block-level manipulation + SEO helpers.
 * Block CRUD helpers are pure — they return a new Page; caller persists.
 */
export const PageFactory = {
  async list(opts?: { publishedOnly?: boolean }): Promise<Page[]> {
    const all = await readAll();
    return opts?.publishedOnly ? all.filter((p) => p.published) : all;
  },

  async getBySlug(slug: string): Promise<Page | null> {
    const all = await readAll();
    return all.find((p) => p.slug === slug && p.published) ?? null;
  },

  async getById(id: string): Promise<Page | null> {
    const all = await readAll();
    return all.find((p) => p.id === id) ?? null;
  },

  async upsert(page: Page): Promise<Page> {
    const all = await readAll();
    const idx = all.findIndex((p) => p.id === page.id);
    const withTimestamp: Page = {
      ...page,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    if (idx >= 0) all[idx] = withTimestamp;
    else all.push(withTimestamp);
    await writeAll(all);
    return withTimestamp;
  },

  async delete(id: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((p) => p.id !== id));
  },

  /** Clone a page with a fresh id/slug for admin duplication. */
  async duplicate(id: string): Promise<Page | null> {
    const source = await PageFactory.getById(id);
    if (!source) return null;
    const all = await readAll();
    let n = 1;
    let slug = `${source.slug}-copy`;
    while (all.some((p) => p.slug === slug)) {
      n += 1;
      slug = `${source.slug}-copy-${n}`;
    }
    const copy: Page = {
      ...source,
      id: `${source.id}-copy-${Date.now().toString(36)}`,
      slug,
      title: `${source.title} (Copy)`,
      published: false,
      blocks: source.blocks.map((b) => ({
        ...JSON.parse(JSON.stringify(b)),
        id: `blk_${Math.random().toString(36).slice(2, 14)}`,
      })),
    };
    return PageFactory.upsert(copy);
  },

  /* ────────── Block-level CRUD (pure) ────────── */

  addBlock(page: Page, block: ContentBlock, atIndex?: number): Page {
    const blocks = [...page.blocks];
    const i =
      typeof atIndex === "number"
        ? Math.max(0, Math.min(blocks.length, atIndex))
        : blocks.length;
    blocks.splice(i, 0, block);
    return { ...page, blocks };
  },

  updateBlock(
    page: Page,
    blockId: string,
    patch: Partial<ContentBlock>,
  ): Page {
    const blocks = page.blocks.map((b) =>
      b.id === blockId ? ({ ...b, ...patch } as ContentBlock) : b,
    );
    return { ...page, blocks };
  },

  deleteBlock(page: Page, blockId: string): Page {
    return { ...page, blocks: page.blocks.filter((b) => b.id !== blockId) };
  },

  reorderBlocks(page: Page, orderedIds: string[]): Page {
    const byId = new Map(page.blocks.map((b) => [b.id, b]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((b): b is ContentBlock => b !== undefined);
    // Append any block not in the id list at the end (safety net).
    for (const b of page.blocks) {
      if (!orderedIds.includes(b.id)) reordered.push(b);
    }
    return { ...page, blocks: reordered };
  },

  applyTemplate(
    page: Page,
    template: BlockTemplate,
    atIndex?: number,
  ): Page {
    const cloned = template.blocks
      .map((b) => normalizeBlock({ ...b, id: undefined }))
      .filter((b): b is ContentBlock => b !== null);
    let result = page;
    for (let i = 0; i < cloned.length; i += 1) {
      result = PageFactory.addBlock(
        result,
        cloned[i],
        typeof atIndex === "number" ? atIndex + i : undefined,
      );
    }
    return result;
  },

  /* ────────── SEO ────────── */

  toMetadata(page: Page): Metadata {
    const seo = page.seo ?? {};
    const title = seo.metaTitle || `${page.title} · myacss`;
    const description = seo.metaDescription || page.hero || page.title;
    return {
      title,
      description,
      keywords: seo.keywords,
      alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
      robots: seo.noindex ? { index: false, follow: false } : undefined,
      openGraph: {
        title,
        description,
        type: "article",
        images: seo.ogImage ? [seo.ogImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: seo.ogImage ? [seo.ogImage] : undefined,
      },
    };
  },

  toJsonLd(page: Page): string {
    const hasFaq = page.blocks.some((b) => b.type === "faq");
    if (hasFaq) {
      const faqs = page.blocks
        .filter((b): b is Extract<ContentBlock, { type: "faq" }> => b.type === "faq")
        .flatMap((b) => b.items);
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.hero,
      dateModified: page.lastUpdated,
      keywords: page.seo?.keywords?.join(", "),
    });
  },
};
