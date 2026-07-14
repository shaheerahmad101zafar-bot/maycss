import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { AiHumanizer } from "@/lib/ai/humanizer";
import { rateLimit, clientKey, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/admin/suggest
 *
 * AI-Suggest button endpoint. Given a text block's current content + optional
 * intent hint ("hero" / "cta" / "product"), returns a conversion-focused
 * variant. Uses the rules-based humanizer for now — swap for a real LLM
 * call (Claude / GPT) when you're ready. The interface stays identical.
 *
 * Request:  { body: string; hint?: "hero" | "cta" | "product" | "generic"; keyword?: string }
 * Response: { ok: true; suggestion: string } | { ok: false; error: string }
 */

const CTA_STARTERS = [
  "Ready to",
  "Don't miss",
  "Discover",
  "Unlock",
  "Grab",
];

const HERO_STARTERS = [
  "Designed for",
  "Made for",
  "Built to",
  "Crafted with",
];

function seed<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 5 suggestions per minute per admin — plenty for iteration, keeps abuse down.
  const rl = rateLimit(clientKey(req, "suggest"), {
    requests: 10,
    windowMs: 60_000,
  });
  if (!rl.allowed) return rateLimitedResponse(rl);

  let body: { body?: string; hint?: string; keyword?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const source = String(body.body ?? "").trim();
  if (!source) {
    return NextResponse.json(
      { ok: false, error: "Provide the current text so we can rewrite it." },
      { status: 400 },
    );
  }

  const keyword = String(body.keyword ?? "").trim();
  const hint = String(body.hint ?? "generic");

  // Rules-based rewrite: humanise + prepend a punchy opener + weave keyword.
  const humanised = AiHumanizer.humanize(source, {
    keywords: keyword ? [keyword] : undefined,
  });
  const opener =
    hint === "hero"
      ? seed(HERO_STARTERS)
      : hint === "cta"
      ? seed(CTA_STARTERS)
      : "";
  const withKeyword =
    keyword && !humanised.toLowerCase().includes(keyword.toLowerCase())
      ? `${humanised} Built around ${keyword}.`
      : humanised;
  const final = opener
    ? `${opener} ${withKeyword.charAt(0).toLowerCase()}${withKeyword.slice(1)}`
    : withKeyword;

  return NextResponse.json({ ok: true, suggestion: final });
}
