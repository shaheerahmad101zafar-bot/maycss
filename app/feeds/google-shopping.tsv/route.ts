import { NextResponse } from "next/server";
import { buildGoogleShoppingFeedTsv } from "@/lib/feeds/google-shopping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Alternate TSV feed for Google Merchant Center scheduled fetch. */
export async function GET() {
  try {
    const { tsv, count } = await buildGoogleShoppingFeedTsv();
    return new NextResponse(tsv, {
      status: 200,
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600, max-age=60",
        "X-Product-Count": String(count),
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("[google-shopping-feed-tsv]", err);
    return new NextResponse("Feed generation failed", { status: 500 });
  }
}
