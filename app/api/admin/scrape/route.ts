import { NextResponse, type NextRequest } from "next/server";
import { scrapeProductUrl } from "@/lib/scraper";

/**
 * POST /api/admin/scrape
 * Body: { url: string }
 * Returns: { ok, product?, error? }
 *
 * Admin-gated. Used by the URL-based product importer.
 */
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("mc-admin")?.value;
  const token = process.env.ADMIN_SESSION_TOKEN || "mc-session-v1";
  if (cookie !== token) {
    return NextResponse.json(
      { ok: false, error: "Unauthorised." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as { url?: string };
    const url = String(body.url ?? "").trim();
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
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
