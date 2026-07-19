import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth-config";
import { scrapeProductUrl } from "@/lib/scraper";
import { buildProductAutofill } from "@/lib/scraper/product-autofill";

/**
 * POST /api/admin/scrape
 * Body: { url: string, focusKeyword?: string }
 * Returns: { ok, product?, autofill?, error? }
 *
 * Admin-gated. Used by New Product → Auto-scrape from URL.
 * `autofill` includes long-form content blocks + SEO fields tuned for green checks.
 */
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("mc-admin")?.value;
  if (cookie !== getSessionToken()) {
    return NextResponse.json(
      { ok: false, error: "Unauthorised." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as {
      url?: string;
      focusKeyword?: string;
    };
    const url = String(body.url ?? "").trim();
    const focusKeyword = String(body.focusKeyword ?? "").trim() || undefined;
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "URL is required." },
        { status: 400 },
      );
    }
    const result = await scrapeProductUrl(url);
    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }
    const autofill = buildProductAutofill(result.product, focusKeyword);
    return NextResponse.json({ ok: true, product: result.product, autofill });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
