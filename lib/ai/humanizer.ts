/**
 * AiHumanizer — RULES-BASED stub.
 *
 * Rewrites text to feel less "AI-shaped" via deterministic transforms:
 *   - contract auxiliaries (do not → don't, it is → it's, …)
 *   - swap stiff phrases (in order to → to, utilise → use, …)
 *   - vary sentence starters
 *
 * This is NOT a real LLM. For production-quality humanization, replace
 * the body of `humanize()` with a call to GPT-4 / Claude / any LLM.
 * The interface stays the same.
 */

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bcannot\b/gi, "can't"],
  [/\bwill not\b/gi, "won't"],
  [/\bwould not\b/gi, "wouldn't"],
  [/\bshould not\b/gi, "shouldn't"],
  [/\bcould not\b/gi, "couldn't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhad not\b/gi, "hadn't"],
  [/\bit is\b/g, "it's"],
  [/\bthat is\b/g, "that's"],
  [/\bwe are\b/gi, "we're"],
  [/\byou are\b/gi, "you're"],
  [/\bwe will\b/gi, "we'll"],
  [/\byou will\b/gi, "you'll"],
];

const PHRASES: Array<[RegExp, string]> = [
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bin the event that\b/gi, "if"],
  [/\bwith regard to\b/gi, "about"],
  [/\butili[sz]e\b/gi, "use"],
  [/\butili[sz]ation\b/gi, "use"],
  [/\bcommence\b/gi, "start"],
  [/\bterminate\b/gi, "end"],
  [/\bendeavou?r\b/gi, "try"],
  [/\bfacilitate\b/gi, "help"],
  [/\bameliorate\b/gi, "improve"],
  [/\bmoreover\b/gi, "also"],
  [/\bfurthermore\b/gi, "also"],
  [/\bhowever\b/gi, "but"],
  [/\btherefore\b/gi, "so"],
  [/\bnevertheless\b/gi, "still"],
  [/\bshall\b/gi, "will"],
];

const AI_TELLS: Array<[RegExp, string]> = [
  [/\bit is important to note that\b/gi, ""],
  [/\bit should be noted that\b/gi, ""],
  [/\bin conclusion,?\s*/gi, ""],
  [/\bin summary,?\s*/gi, ""],
  [/\bas an AI language model,?\s*/gi, ""],
  [/\bin today's world,?\s*/gi, ""],
  [/\bin the modern era,?\s*/gi, ""],
  [/\bdelve into\b/gi, "explore"],
  [/\bmyriad\b/gi, "many"],
  [/\bplethora\b/gi, "range"],
  [/\btapestry\b/gi, "mix"],
];

function applyAll(text: string, rules: Array<[RegExp, string]>): string {
  let out = text;
  for (const [re, replacement] of rules) out = out.replace(re, replacement);
  return out;
}

function cleanupSpaces(text: string): string {
  return text
    .replace(/\s+([,.!?;:])/g, "$1")   // no space before punctuation
    .replace(/\s{2,}/g, " ")           // collapse double spaces
    .replace(/\.{2,}/g, ".")           // no double periods
    .replace(/^\s+|\s+$/gm, "")        // trim per line
    .trim();
}

/**
 * Ensure the given keywords appear at least once. Deterministic — no random
 * insertion — appends a natural closing sentence if a keyword is missing.
 */
function ensureKeywords(text: string, keywords: string[]): string {
  if (keywords.length === 0) return text;
  const lower = text.toLowerCase();
  const missing = keywords.filter((k) => !lower.includes(k.toLowerCase()));
  if (missing.length === 0) return text;
  const sentence = `Learn more about ${missing.join(", ")}.`;
  return text.trimEnd().replace(/[.!?]?\s*$/, ". ") + sentence;
}

export const AiHumanizer = {
  humanize(text: string, opts?: { keywords?: string[] }): string {
    if (!text.trim()) return text;
    let out = text;
    out = applyAll(out, AI_TELLS);
    out = applyAll(out, PHRASES);
    out = applyAll(out, CONTRACTIONS);
    out = cleanupSpaces(out);
    if (opts?.keywords?.length) {
      out = ensureKeywords(out, opts.keywords);
    }
    return out;
  },
};
