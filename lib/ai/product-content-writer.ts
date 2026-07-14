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

  switch (section) {
    case "overview":
      return (
        `${input.description ?? `${name} sets a new standard for ${noun}.`} ` +
        `We picked this piece because it delivers on the details that matter — ` +
        `crafted materials, a considered fit, and a design that will earn ` +
        `its place in your rotation. If you have been searching for the right ` +
        `${noun}, this is a strong pick.`
      );
    case "features":
      return (
        `Every ${noun} we stock has to earn its shelf space. Here is what ` +
        `stood out with ${name}. Quality of materials shows in how the piece ` +
        `hangs, wears, and ages. Construction details — from the stitching ` +
        `to the finish — signal that this was made by people who care about ` +
        `their craft. The result: a ${noun} you will reach for again and again.`
      );
    case "styling":
      return (
        `Style ${name} however you love. Dressed down, pair it with your ` +
        `favourite denim and a clean sneaker. Dressed up, layer it under a ` +
        `blazer or over a slip dress. The versatility is part of what makes ` +
        `this such a strong ${noun}. Once you have it in your wardrobe, you ` +
        `will find yourself styling it three, maybe four different ways in ` +
        `a single week.`
      );
    case "sizing":
      if (!input.sizes || input.sizes.length === 0) {
        return `Available in a range of sizes. Consult the size guide on the product page for the best fit.`;
      }
      return (
        `${name} is available in ${joinList(input.sizes)}. If you are between ` +
        `sizes, most customers size down for a fitted look and size up for ` +
        `a relaxed silhouette. When in doubt, check the size guide or ` +
        `contact us — we are happy to help you land the right fit.`
      );
    case "care":
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
        `the weight, the finish, the way it feels in your hands. When you ` +
        `love the piece, you will care for it. When you care for it, it ` +
        `keeps its shape and its story. That is the ${brand} promise.`
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
    { level: 2, heading: `Why this ${kw || "piece"} works`, body: writeSection("features", input) },
    { level: 2, heading: `How to style your ${name}`, body: writeSection("styling", input) },
    { level: 3, heading: `Sizing & fit`, body: writeSection("sizing", input) },
    { level: 3, heading: `Care instructions`, body: writeSection("care", input) },
    { level: 2, heading: `Why we chose it`, body: writeSection("why-buy", input) },
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
