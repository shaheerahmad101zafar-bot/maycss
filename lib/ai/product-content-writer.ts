/**
 * Auto-SEO content writer.
 *
 * Given a product + focus keyword, generates a set of ContentBlock items
 * that form a long-form article below the standard PDP. Uses templates
 * (deterministic, safe to run at import time) and pipes the output through
 * AiHumanizer to reduce AI-tell phrasing.
 *
 * Swap `writeSection()` for a GPT-4 / Claude call when you have an API key
 * — every consumer (`generateProductContent`) keeps working.
 */

import type { ContentBlock, FaqItem } from "@/lib/blocks/types";
import { BlockFactory } from "@/lib/blocks/types";
import { AiHumanizer } from "@/lib/ai/humanizer";

export type ProductContentInput = {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  price?: number;
  sizes?: string[];
  colors?: string[];
  /** Source PDP bullets (materials, features, care). */
  features?: string[];
  /** Model / hem / fit notes from the source. */
  sizeAndFit?: string[];
  focusKeyword: string;
  additionalKeywords?: string[];
};

function sentenceCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Section body writer. Template-based today.
 * Swap the body for an LLM call — same signature works.
 */
function writeSection(
  section:
    | "overview"
    | "features"
    | "styling"
    | "sizing"
    | "care"
    | "why-buy",
  input: ProductContentInput,
): string {
  const kw = input.focusKeyword.trim();
  const name = input.name;
  const noun = kw || name.toLowerCase();
  const brand = input.brand ?? "our featured brand";

  const features = (input.features ?? []).filter(Boolean);
  const fitNotes = (input.sizeAndFit ?? []).filter(Boolean);
  const careLines = features.filter((f) =>
    /clean|wash|dry|care|polyester|cotton|silk|imported|spot/i.test(f),
  );
  const designLines = features.filter((f) => !careLines.includes(f));

  switch (section) {
    case "overview":
      return (
        `${input.description ?? `${name} sets a new standard for ${noun}.`} ` +
        (designLines.length
          ? `Standout details include ${joinList(designLines.slice(0, 3).map((f) => f.replace(/\.$/, "").toLowerCase()))}. `
          : `We picked this piece because it delivers on the details that matter — crafted materials, a considered fit, and a design that earns its place in your rotation. `) +
        `If you have been searching for the right ${noun}, this is a strong pick from ${brand}.`
      );
    case "features":
      if (designLines.length > 0) {
        return (
          `Every ${noun} we stock has to earn its shelf space. With ${name}, ` +
          `these are the details that stood out: ${joinList(
            designLines.map((f) => f.replace(/\.$/, "")),
          )}. ` +
          `Quality of materials shows in how the piece hangs, wears, and ages — ` +
          `the kind of finish you notice the first time you try it on.`
        );
      }
      return (
        `Every ${noun} we stock has to earn its shelf space. Here is what ` +
        `stood out with ${name}. Quality of materials shows in how the piece ` +
        `hangs, wears, and ages. Construction details — from the stitching ` +
        `to the finish — signal that this was made by people who care about ` +
        `their craft. The result: a ${noun} you will reach for again and again.`
      );
    case "styling":
      return (
        `Style ${name} however you love. For evenings and formal events, pair it with ` +
        `refined heels and delicate jewellery. For a softer look, keep accessories minimal ` +
        `and let the silhouette lead. The versatility is part of what makes ` +
        `this such a strong ${noun}` +
        (input.colors?.length
          ? ` — available in ${joinList(input.colors)}`
          : "") +
        `. Once you have it in your wardrobe, you will find yourself reaching for it again.`
      );
    case "sizing": {
      const sizeLine =
        input.sizes && input.sizes.length > 0
          ? `${name} is available in sizes ${joinList(input.sizes)}. `
          : `Available in a range of sizes. `;
      const fitLine = fitNotes.length
        ? `${fitNotes.join(" ")} `
        : `If you are between sizes, most customers size down for a fitted look and size up for a relaxed silhouette. `;
      return (
        sizeLine +
        fitLine +
        `When in doubt, check the size guide or contact us — we are happy to help you land the right fit.`
      );
    }
    case "care":
      if (careLines.length > 0) {
        return (
          `Care for your ${noun} with intention: ${joinList(
            careLines.map((f) => f.replace(/\.$/, "")),
          )}. ` +
          `Well-cared-for pieces reward you with years of wear.`
        );
      }
      return (
        `To keep your ${noun} looking its best, follow the care label. ` +
        `In general: wash cold when possible, air-dry over a hanger or ` +
        `flat, and store folded rather than hung to preserve the shape. ` +
        `Well-cared-for pieces reward you with years of wear.`
      );
    case "why-buy":
      return (
        `Choosing ${name} means investing in a ${noun} that is designed to ` +
        `last. From the moment you unbox it, the difference is obvious — ` +
        `the weight, the finish, the way it feels. When you love the piece, you will care for it. ` +
        `That is the ${brand} promise — and why we carry it at MayCSS.`
      );
  }
}

function faqItems(input: ProductContentInput): FaqItem[] {
  const noun = input.focusKeyword || input.name.toLowerCase();
  const items: FaqItem[] = [
    {
      q: `Is ${input.name} true to size?`,
      a: input.sizes && input.sizes.length > 1
        ? `Yes — ${input.name} runs true to size. If you're between sizes, size down for a slim fit or up for relaxed. The full size guide is on the product page.`
        : `${input.name} is available in a single fit. See the size guide for measurements.`,
    },
    {
      q: `What is ${input.name} made of?`,
      a:
        input.description ||
        `See the specifications tab for the full material breakdown. We only stock pieces made with materials we trust.`,
    },
    {
      q: `How should I care for my ${noun}?`,
      a: `Follow the care label included with your order. In general, wash cold and air-dry to preserve the fit and finish.`,
    },
    {
      q: `Do you offer returns on ${noun}?`,
      a: `Yes. Unworn items can be returned within 30 days for a full refund. See our full refund policy for details.`,
    },
  ];
  return items;
}

function block(
  b: ContentBlock,
  overrides: Partial<ContentBlock> = {},
): ContentBlock {
  return { ...b, ...overrides } as ContentBlock;
}

/**
 * Generate a full long-form SEO article as an array of ContentBlocks.
 * Each block gets a stable id via BlockFactory.
 * Output is Humanized before returning.
 */
export function generateProductContent(
  input: ProductContentInput,
): ContentBlock[] {
  const kw = input.focusKeyword.trim();
  const name = input.name;
  const sections = [
    { level: 2, heading: `About the ${name}`, body: writeSection("overview", input) },
    {
      level: 2,
      heading: `Why this ${kw || "piece"} is in style`,
      body: writeSection("features", input),
    },
    {
      level: 2,
      heading: `How to style our ${name}`,
      body: writeSection("styling", input),
    },
    { level: 3, heading: `Size and fit`, body: writeSection("sizing", input) },
    { level: 3, heading: `Materials & care`, body: writeSection("care", input) },
    { level: 2, heading: `Why we love it`, body: writeSection("why-buy", input) },
  ];

  const richtextBlocks: ContentBlock[] = sections.map((s) => {
    const b = BlockFactory.create("richtext");
    return block(b, {
      heading: sentenceCase(s.heading),
      headingLevel: s.level as 2 | 3 | 4,
      body: AiHumanizer.humanize(s.body, {
        keywords: [kw, ...(input.additionalKeywords ?? [])].filter(Boolean),
      }),
      alignment: "left",
    });
  });

  // FAQ block at the end.
  const faqBlock = BlockFactory.create("faq");
  const faq = block(faqBlock, { items: faqItems(input) });

  return [...richtextBlocks, faq];
}
