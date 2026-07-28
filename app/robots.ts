import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/feeds/",
          "/api/google-feed.xml",
          "/api/google-feed.csv",
          "/feeds/google-feed.csv",
          "/google-feed.csv",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/account/",
          "/checkout",
          "/track/",
        ],
      },
    ],
    host: base,
    sitemap: `${base}/sitemap.xml`,
  };
}
