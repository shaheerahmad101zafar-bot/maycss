import type { MetadataRoute } from "next";
import { getCategories, getListingProducts } from "@/lib/data";
import { PageFactory } from "@/lib/pages";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sale`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/new`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/shipping-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms-of-service`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/account/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    // Product feeds for Google Merchant Center.
    {
      url: `${base}/api/google-feed.xml`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.4,
    },
    {
      url: `${base}/feeds/google-shopping.xml`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.4,
    },
    {
      url: `${base}/feeds/google-feed.xml`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.3,
    },
    {
      url: `${base}/api/google-feed.csv`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.3,
    },
    {
      url: `${base}/feeds/google-feed.csv`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.3,
    },
  ];

  const [categories, products, pages] = await Promise.all([
    getCategories(),
    getListingProducts(),
    PageFactory.list({ publishedOnly: true }),
  ]);

  const byId = new Map(categories.map((c) => [c.id, c]));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => {
    let path = `/category/${cat.slug}`;
    if (cat.parentId) {
      const parent = byId.get(cat.parentId);
      if (parent) path = `/category/${parent.slug}/${cat.slug}`;
    }
    return {
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: cat.parentId ? 0.7 : 0.8,
    };
  });

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const brandSet = new Set(
    products
      .map((p) => (p.brand || "").trim())
      .filter(Boolean)
      .map((b) => b.toLowerCase()),
  );
  const brandRoutes: MetadataRoute.Sitemap = [...brandSet].map((brand) => ({
    url: `${base}/brands/${encodeURIComponent(brand)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // CMS pages (skip home — already covered as `/`)
  const pageRoutes: MetadataRoute.Sitemap = pages
    .filter((p) => p.slug && p.slug !== "home" && !p.seo?.noindex)
    .map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.lastUpdated ? new Date(p.lastUpdated) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...brandRoutes,
    ...pageRoutes,
  ];
}
