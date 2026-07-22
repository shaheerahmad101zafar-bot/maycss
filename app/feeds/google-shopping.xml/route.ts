import { NextResponse } from "next/server";
import { buildGoogleShoppingFeedXml } from "@/lib/feeds/google-shopping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public Google Merchant Center product feed (RSS 2.0 / XML).
 *
 * Live URL: https://www.myacssstore.store/feeds/google-shopping.xml
 *
 * How to submit in GMC:
 *   Products → Feeds → Add primary feed → Scheduled fetch
 *   → paste this URL → country/language → fetch daily or hourly.
 *
 * See docs/google-merchant-center-feed.md
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
    console.error("[google-shopping-feed]", err);
    return new NextResponse(
      `<?xml version="1.0"?><error>Feed generation failed</error>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      },
    );
  }
}
