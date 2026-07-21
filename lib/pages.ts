import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import {
  normalizeBlock,
  type ContentBlock,
  type BlockTemplate,
} from "./blocks/types";
import { readStoreJson, writeStoreJson } from "./storage/json-store";

const file = "data/pages.json";
const footerIndexFile = "data/footer-pages.json";

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

/** One label/body pair in the Contact page sidebar. */
export type ContactDetailRow = {
  id: string;
  label: string;
  body: string;
};

/** Editable Contact page sidebar (Visit & Connect, address, hours, etc.). */
export type ContactDetails = {
  heading: string;
  lead: string;
  rows: ContactDetailRow[];
};

export type Page = {
  id: string;
  slug: string;
  title: string;
  eyebrow?: string;
  hero?: string;
  /** Full-width banner image shown behind the page hero header. */
  bannerImage?: string;
  /** When false, hide the top hero/title banner strip on the storefront. */
  showHeroBanner?: boolean;
  /** Route template — contact (map/form), shop (category index), sale (sale grid). */
  pageKind?: PageKind;
  /** Google Maps iframe embed HTML — used when pageKind is contact. */
  mapEmbed?: string;
  /** Contact sidebar copy — used when pageKind is contact. */
  contactDetails?: ContactDetails;
  published: boolean;
  showInFooter?: boolean;
  footerColumn?: "company" | "legal" | "shop";
  lastUpdated?: string;
  seo?: PageSeo;
  blocks: ContentBlock[];
};

/** Lean footer nav row — avoids loading full CMS blocks on every page. */
export type FooterPageLink = {
  id: string;
  slug: string;
  title: string;
  showInFooter?: boolean;
  footerColumn?: Page["footerColumn"];
  published: boolean;
};

export type { ContentBlock } from "./blocks/types";

const PAGE_KINDS: PageKind[] = ["standard", "contact", "shop", "sale"];

function normalizeContactDetails(raw: unknown): ContactDetails | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Partial<ContactDetails>;
  const rows = Array.isArray(obj.rows)
    ? obj.rows
        .map((r, i) => {
          if (!r || typeof r !== "object") return null;
          const row = r as Partial<ContactDetailRow>;
          const label = String(row.label ?? "").trim();
          const body = String(row.body ?? "");
          if (!label && !body.trim()) return null;
          return {
            id:
              typeof row.id === "string" && row.id
                ? row.id
                : `cdr_${i}_${Math.random().toString(36).slice(2, 7)}`,
            label,
            body,
          };
        })
        .filter((r): r is ContactDetailRow => r !== null)
    : [];
  const heading = String(obj.heading ?? "").trim();
  const lead = String(obj.lead ?? "").trim();
  if (!heading && !lead && rows.length === 0) return undefined;
  return { heading, lead, rows };
}

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
    showHeroBanner: raw.showHeroBanner !== false,
    pageKind,
    mapEmbed: typeof raw.mapEmbed === "string" ? raw.mapEmbed : undefined,
    contactDetails: normalizeContactDetails(raw.contactDetails),
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

function toFooterLink(p: Page): FooterPageLink {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    showInFooter: p.showInFooter,
    footerColumn: p.footerColumn,
    published: p.published,
  };
}

async function readAll(fresh = false): Promise<Page[]> {
  try {
    const parsed = await readStoreJson<Partial<Page>[]>(file, [], {
      bypassCache: fresh,
    });
    return parsed.map(normalizePage);
  } catch {
    return [];
  }
}

const getPagesCached = unstable_cache(
  () => readAll(false),
  ["cms-pages-v1"],
  { revalidate: 5, tags: ["cms-pages"] },
);

const getFooterLinksCached = unstable_cache(
  async () => {
    const indexed = await readStoreJson<FooterPageLink[] | null>(
      footerIndexFile,
      null,
    );
    if (Array.isArray(indexed) && indexed.length > 0) {
      return indexed.filter((p) => p.published && p.showInFooter);
    }
    const all = await readAll(false);
    return all.filter((p) => p.published && p.showInFooter).map(toFooterLink);
  },
  ["cms-footer-links-v1"],
  { revalidate: 5, tags: ["cms-pages"] },
);

async function writeAll(list: Page[]): Promise<void> {
  await writeStoreJson(file, list);
  await writeStoreJson(footerIndexFile, list.map(toFooterLink));
}

/**
 * PageFactory — CRUD + block-level manipulation + SEO helpers.
 * Block CRUD helpers are pure — they return a new Page; caller persists.
 */
export const PageFactory = {
  async list(opts?: {
    publishedOnly?: boolean;
    fresh?: boolean;
  }): Promise<Page[]> {
    const all = opts?.fresh ? await readAll(true) : await getPagesCached();
    return opts?.publishedOnly ? all.filter((p) => p.published) : all;
  },

  /** Tiny footer nav — does not download full pages.json blocks. */
  listFooterLinks: cache(async function listFooterLinks(): Promise<
    FooterPageLink[]
  > {
    return getFooterLinksCached();
  }),

  getBySlug: cache(async function getBySlug(slug: string): Promise<Page | null> {
    const all = await getPagesCached();
    return all.find((p) => p.slug === slug && p.published) ?? null;
  }),

  async getById(id: string): Promise<Page | null> {
    const all = await readAll(true);
    return all.find((p) => p.id === id) ?? null;
  },

  async upsert(page: Page): Promise<Page> {
    const all = await readAll(true);
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
    const all = await readAll(true);
    await writeAll(all.filter((p) => p.id !== id));
  },

  /** Clone a page with a fresh id/slug for admin duplication. */
  async duplicate(id: string): Promise<Page | null> {
    const source = await PageFactory.getById(id);
    if (!source) return null;
    const all = await readAll(true);
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
