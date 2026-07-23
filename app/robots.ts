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
        ],
        disallow: ["/admin/", "/api/", "/account/orders", "/checkout", "/track/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
