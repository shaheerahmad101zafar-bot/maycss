import { NextResponse } from "next/server";
import { buildGoogleShoppingFeedTsv } from "@/lib/feeds/google-shopping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Google Merchant Center product feed (TSV / CSV-compatible).
 *
 * Live URL: https://www.myacssstore.store/api/google-feed.csv
 */
export async function GET() {
  try {
    const { tsv, count } = await buildGoogleShoppingFeedTsv();
    return new NextResponse(tsv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600, max-age=60",
        "X-Product-Count": String(count),
        "X-Robots-Tag": "noindex",
        "Content-Disposition": 'inline; filename="maycss-google-feed.csv"',
      },
    });
  } catch (err) {
    console.error("[api/google-feed.csv]", err);
    return new NextResponse("Feed generation failed", { status: 500 });
  }
}
