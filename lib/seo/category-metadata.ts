import type { Metadata } from "next";
import type { Category } from "@/lib/utils";

/** Build Next.js Metadata from category.seo (admin-editable) with safe fallbacks. */
export function categoryToMetadata(category: Category | null | undefined): Metadata {
  if (!category) {
    return {
      title: "Category not found · MAYCSS",
      description: "Browse the MAYCSS curated collection.",
    };
  }
  const seo = category.seo ?? {};
  const title =
    seo.metaTitle?.replace(/(\s*·\s*MAYCSS)+\s*$/i, "").trim() ||
    `${category.name} · MAYCSS`;
  const titled = /maycss/i.test(title) ? title : `${title} · MAYCSS`;
  const description =
    seo.metaDescription?.replace(/(\s*·\s*MAYCSS)+/gi, "").trim() ||
    category.description ||
    `Shop ${category.name} at MAYCSS — curated fashion products online.`;
  const keywords = Array.from(
    new Set(
      [seo.focusKeyword, ...(seo.keywords ?? []), "MAYCSS"].filter(
        (k): k is string => Boolean(k && k.trim()),
      ),
    ),
  );

  return {
    title: { absolute: titled },
    description,
    keywords,
    openGraph: {
      title: titled,
      description,
      type: "website",
      images: seo.ogImage || category.image ? [seo.ogImage || category.image!] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titled,
      description,
      images: seo.ogImage || category.image ? [seo.ogImage || category.image!] : undefined,
    },
  };
}

export function categoryBreadcrumbJsonLd(opts: {
  origin: string;
  items: { name: string; path: string }[];
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${opts.origin}${item.path}`,
    })),
  });
}
