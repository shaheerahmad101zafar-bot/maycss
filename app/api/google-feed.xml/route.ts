import { NextResponse } from "next/server";
import { buildGoogleShoppingFeedXml } from "@/lib/feeds/google-shopping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Google Merchant Center product feed (XML).
 *
 * Canonical live URLs (same payload):
 *   https://www.myacssstore.store/api/google-feed.xml
 *   https://www.myacssstore.store/feeds/google-shopping.xml
 *
 * Pulls the latest published catalog + prices on each request.
 */
export async function GET() {
  try {
    const { xml, count } = await buildGoogleShoppingFeedXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600, max-age=60",
        "X-Product-Count": String(count),
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("[api/google-feed.xml]", err);
    return new NextResponse(
      `<?xml version="1.0"?><error>Feed generation failed</error>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      },
    );
  }
}
