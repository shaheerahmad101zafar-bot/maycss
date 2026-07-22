/**
 * KeywordChecker — client-safe. Local heuristics only (no external SEO API).
 * When you're ready to upgrade, swap `suggest()` for a call to a real KW tool.
 */

import { keywordsForSuggest } from "./maycss-keywords";

const MODIFIERS = [
  "best",
  "top",
  "affordable",
  "premium",
  "cheap",
  "buy",
  "online",
  "for women",
  "sale",
];

function pluralise(word: string): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z")) {
    return word + "es";
  }
  if (lower.endsWith("y") && word.length > 1 && !/[aeiou]/i.test(word[word.length - 2]!)) {
    return word.slice(0, -1) + "ies";
  }
  return word + "s";
}

export const KeywordChecker = {
  /** Local suggestions: MAYCSS catalog first, then modifiers. No "near me". */
  suggest(seed: string, limit = 12): string[] {
    const s = seed.trim().toLowerCase();
    const catalog = keywordsForSuggest(seed, limit);
    if (!s) return catalog;
    const out = new Set<string>(catalog);
    out.add(s);
    out.add(pluralise(s));
    for (const m of MODIFIERS) {
      out.add(`${m} ${s}`);
    }
    out.add(`${s} online`);
    return Array.from(out).slice(0, limit);
  },

  density(text: string, keyword: string): number {
    if (!text.trim() || !keyword.trim()) return 0;
    const re = new RegExp(
      keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi",
    );
    const words = text.trim().split(/\s+/).length;
    const hits = (text.match(re) ?? []).length;
    return words === 0 ? 0 : (hits / words) * 100;
  },
};
