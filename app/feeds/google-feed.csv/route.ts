import { NextResponse } from "next/server";
import { buildGoogleShoppingFeedCsv } from "@/lib/feeds/google-shopping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Alias CSV feed under /feeds/ (robots-allowed path).
 * Same payload as /api/google-feed.csv
 */
export async function GET() {
  try {
    const { csv, count } = await buildGoogleShoppingFeedCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600, max-age=60",
        "X-Product-Count": String(count),
        "X-Robots-Tag": "noindex",
        "Content-Disposition": 'attachment; filename="maycss-google-feed.csv"',
      },
    });
  } catch (err) {
    console.error("[feeds/google-feed.csv]", err);
    return new NextResponse("Feed generation failed", { status: 500 });
  }
}
