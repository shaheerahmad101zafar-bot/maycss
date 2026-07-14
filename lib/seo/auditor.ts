/**
 * SeoAuditor — client-safe. Analyses a page's title/description/blocks
 * against a set of target keywords and returns a scored checklist.
 */

import type { ContentBlock } from "@/lib/blocks/types";

export type PageForAudit = {
  title: string;
  slug: string;
  hero?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  blocks: ContentBlock[];
};

export type SeoCheck = {
  id: string;
  label: string;
  pass: boolean;
  severity: "error" | "warn" | "ok";
  hint?: string;
};

export type KeywordDensity = {
  keyword: string;
  count: number;
  density: number; // %
};

export type AuditResult = {
  score: number; // 0–100
  checks: SeoCheck[];
  keywordDensity: KeywordDensity[];
  wordCount: number;
  readingTimeMinutes: number;
};

/** Flatten every user-visible string in the block tree for keyword analysis. */
function extractText(blocks: ContentBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "richtext":
        if (b.heading) parts.push(b.heading);
        parts.push(b.body);
        break;
      case "hero":
        parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "cta":
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "faq":
        for (const it of b.items) {
          parts.push(it.q, it.a);
        }
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
    }
  }
  return parts.join(" ");
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const re = new RegExp(
    needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  );
  return (haystack.match(re) ?? []).length;
}

/** Generic input for any entity (Category, Product, or arbitrary content). */
export type EntityForAudit = {
  kind: "category" | "product" | "generic";
  title: string;                 // display name / product title / category name
  slug: string;
  contentText: string;           // all body text to search (description + specs + blocks…)
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    focusKeyword?: string;       // primary keyword (Yoast-style)
    keywords?: string[];         // additional keywords
  };
  /** Optional extras that unlock more checks. */
  extras?: {
    imageAlt?: { total: number; withAlt: number };
    hasHeading?: boolean;
  };
};

export const SeoAuditor = {
  /** Generic entity audit. Same shape as page audit, entity-agnostic checks. */
  analyzeEntity(input: EntityForAudit): AuditResult {
    const focus = input.seo?.focusKeyword?.trim() ?? "";
    const otherKw = (input.seo?.keywords ?? []).filter(
      (k) => k.trim() && k.trim().toLowerCase() !== focus.toLowerCase(),
    );
    const allKeywords = [focus, ...otherKw].filter((k) => k.trim().length > 0);
    const metaTitle = input.seo?.metaTitle ?? "";
    const metaDesc = input.seo?.metaDescription ?? "";
    const text = input.contentText;
    const wordCount = countWords(text);
    const readingTime = Math.max(1, Math.round(wordCount / 220));
    const checks: SeoCheck[] = [];

    checks.push({
      id: "meta-title",
      label: "Meta title present (30–60 chars)",
      pass: metaTitle.length >= 30 && metaTitle.length <= 60,
      severity: metaTitle ? "warn" : "error",
      hint: !metaTitle
        ? "Add a meta title — it's what shows in search results."
        : metaTitle.length < 30
        ? `Only ${metaTitle.length} chars — aim for 30–60.`
        : metaTitle.length > 60
        ? `${metaTitle.length} chars — Google truncates at ~60.`
        : undefined,
    });
    checks.push({
      id: "meta-description",
      label: "Meta description present (120–160 chars)",
      pass: metaDesc.length >= 120 && metaDesc.length <= 160,
      severity: metaDesc ? "warn" : "error",
      hint: !metaDesc
        ? "Add a meta description — it drives click-through rate."
        : metaDesc.length < 120
        ? `Only ${metaDesc.length} chars — aim for 120–160.`
        : metaDesc.length > 160
        ? `${metaDesc.length} chars — Google truncates.`
        : undefined,
    });
    checks.push({
      id: "og-image",
      label: "Open Graph image set",
      pass: Boolean(input.seo?.ogImage),
      severity: "warn",
      hint: !input.seo?.ogImage
        ? "Add an OG image so link previews look sharp."
        : undefined,
    });
    checks.push({
      id: "slug",
      label: "URL slug is descriptive (≥3 chars)",
      pass: input.slug.length >= 3,
      severity: "warn",
    });
    checks.push({
      id: "focus-defined",
      label: "Focus keyword defined",
      pass: focus.length > 0,
      severity: "error",
      hint:
        focus.length === 0
          ? "Set one primary focus keyword so we can grade placement."
          : undefined,
    });
    if (focus) {
      checks.push({
        id: "kw-in-title",
        label: `Focus keyword in meta title (${focus})`,
        pass: includes(metaTitle || input.title, focus),
        severity: "error",
      });
      checks.push({
        id: "kw-in-description",
        label: "Focus keyword in meta description",
        pass: includes(metaDesc, focus),
        severity: "warn",
      });
      checks.push({
        id: "kw-in-body",
        label: "Focus keyword appears in body content",
        pass: includes(text, focus),
        severity: "error",
      });
      checks.push({
        id: "kw-in-slug",
        label: "Focus keyword appears in slug",
        pass: includes(input.slug.replace(/-/g, " "), focus),
        severity: "warn",
      });
    }
    if (input.extras?.imageAlt && input.extras.imageAlt.total > 0) {
      const { total, withAlt } = input.extras.imageAlt;
      checks.push({
        id: "img-alt",
        label: `Every image has alt text (${withAlt}/${total})`,
        pass: withAlt === total,
        severity: withAlt === 0 ? "error" : "warn",
      });
    }
    if (typeof input.extras?.hasHeading === "boolean") {
      checks.push({
        id: "has-heading",
        label: "At least one heading (H2/H3)",
        pass: input.extras.hasHeading,
        severity: "warn",
      });
    }
    const minLength = input.kind === "product" ? 60 : 80;
    checks.push({
      id: "min-length",
      label: `Body content ≥ ${minLength} words`,
      pass: wordCount >= minLength,
      severity: "warn",
      hint:
        wordCount < minLength
          ? `Only ${wordCount} words — thin content may struggle to rank.`
          : undefined,
    });

    for (const c of checks) if (c.pass) c.severity = "ok";

    let earned = 0;
    let possible = 0;
    for (const c of checks) {
      const weight = c.severity === "error" ? 2 : 1;
      possible += weight;
      if (c.pass) earned += weight;
    }
    const score = possible === 0 ? 100 : Math.round((earned / possible) * 100);

    const keywordDensity: KeywordDensity[] = allKeywords.map((k) => {
      const count = occurrences(text, k);
      const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
      return { keyword: k, count, density: Math.round(density * 10) / 10 };
    });

    return {
      score,
      checks,
      keywordDensity,
      wordCount,
      readingTimeMinutes: readingTime,
    };
  },

  analyze(page: PageForAudit): AuditResult {
    const keywords = page.seo?.keywords ?? [];
    const text = extractText(page.blocks);
    const wordCount = countWords(text);
    const readingTime = Math.max(1, Math.round(wordCount / 220));

    const metaTitle = page.seo?.metaTitle ?? "";
    const metaDesc = page.seo?.metaDescription ?? "";

    const checks: SeoCheck[] = [];

    checks.push({
      id: "meta-title",
      label: "Meta title present (30–60 chars)",
      pass:
        metaTitle.length >= 30 && metaTitle.length <= 60,
      severity: metaTitle ? "warn" : "error",
      hint: !metaTitle
        ? "Add a meta title — it's what shows in search results."
        : metaTitle.length < 30
        ? `Only ${metaTitle.length} chars — aim for 30–60.`
        : metaTitle.length > 60
        ? `${metaTitle.length} chars — Google will truncate at ~60.`
        : undefined,
    });

    checks.push({
      id: "meta-description",
      label: "Meta description present (120–160 chars)",
      pass: metaDesc.length >= 120 && metaDesc.length <= 160,
      severity: metaDesc ? "warn" : "error",
      hint: !metaDesc
        ? "Add a meta description — it drives click-through rate."
        : metaDesc.length < 120
        ? `Only ${metaDesc.length} chars — aim for 120–160.`
        : metaDesc.length > 160
        ? `${metaDesc.length} chars — Google will truncate.`
        : undefined,
    });

    checks.push({
      id: "og-image",
      label: "Open Graph image set",
      pass: Boolean(page.seo?.ogImage),
      severity: "warn",
      hint: !page.seo?.ogImage
        ? "Add an OG image so link previews look sharp."
        : undefined,
    });

    checks.push({
      id: "slug",
      label: "URL slug is descriptive (≥3 chars)",
      pass: page.slug.length >= 3,
      severity: "warn",
    });

    checks.push({
      id: "keywords-defined",
      label: "At least one target keyword defined",
      pass: keywords.length > 0,
      severity: "error",
      hint:
        keywords.length === 0
          ? "Add 1–3 target keywords so we can grade placement."
          : undefined,
    });

    if (keywords.length > 0) {
      const primary = keywords[0];
      checks.push({
        id: "kw-in-title",
        label: `Primary keyword in title (${primary})`,
        pass: includes(metaTitle || page.title, primary),
        severity: "error",
      });
      checks.push({
        id: "kw-in-description",
        label: "Primary keyword in meta description",
        pass: includes(metaDesc, primary),
        severity: "warn",
      });
      checks.push({
        id: "kw-in-body",
        label: "Primary keyword appears in body content",
        pass: includes(text, primary),
        severity: "error",
      });
    }

    // Alt text presence for images.
    const imageBlocks = page.blocks.filter((b) => b.type === "image");
    if (imageBlocks.length > 0) {
      const missing = imageBlocks.filter((b) => !("alt" in b) || !b.alt).length;
      checks.push({
        id: "img-alt",
        label: `Every image has alt text (${imageBlocks.length - missing}/${imageBlocks.length})`,
        pass: missing === 0,
        severity: missing === imageBlocks.length ? "error" : "warn",
        hint:
          missing > 0
            ? `${missing} image(s) missing alt text — needed for SEO and screen readers.`
            : undefined,
      });
    }

    // At least one heading in content.
    const hasHeading = page.blocks.some(
      (b) => (b.type === "richtext" && b.heading) || b.type === "hero",
    );
    checks.push({
      id: "has-heading",
      label: "At least one heading (H2/H3) in content",
      pass: hasHeading,
      severity: "warn",
    });

    checks.push({
      id: "min-length",
      label: "Body content ≥ 150 words",
      pass: wordCount >= 150,
      severity: "warn",
      hint:
        wordCount < 150
          ? `Only ${wordCount} words — thin content may struggle to rank.`
          : undefined,
    });

    // Fill in "ok" severity for passing checks that weren't marked otherwise.
    for (const c of checks) if (c.pass) c.severity = "ok";

    // Score = pct of checks passing weighted by severity.
    let earned = 0;
    let possible = 0;
    for (const c of checks) {
      const weight = c.severity === "error" ? 2 : 1;
      possible += weight;
      if (c.pass) earned += weight;
    }
    const score = possible === 0 ? 100 : Math.round((earned / possible) * 100);

    const keywordDensity: KeywordDensity[] = keywords.map((k) => {
      const count = occurrences(text, k);
      const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
      return { keyword: k, count, density: Math.round(density * 10) / 10 };
    });

    return {
      score,
      checks,
      keywordDensity,
      wordCount,
      readingTimeMinutes: readingTime,
    };
  },
};
