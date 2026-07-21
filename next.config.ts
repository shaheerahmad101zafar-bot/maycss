import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Only @auth/core needs to be external so Turbopack doesn't try to bundle
   * its internal Preact-based pages for the browser.
   * `next-auth` itself must NOT be external — it does `import "next/server"`
   * internally, and Node's ESM resolver can't find that path when the module
   * is externalized. Letting Next.js bundle it resolves the import correctly.
   */
  serverExternalPackages: ["@auth/core"],

  /**
   * Keep CMS/catalog JSON in serverless traces so local fallback works when
   * Vercel Blob is suspended or unreachable.
   */
  outputFileTracingIncludes: {
    "/*": [
      "./data/pages.json",
      "./data/products.json",
      "./data/products-listing.json",
      "./data/categories.json",
      "./data/banner-slides.json",
      "./data/footer-pages.json",
      "./data/menus.json",
      "./data/app-config.json",
    ],
  },

  /**
   * Allow-list for remote images fed into `<Image>` / `<img>`. Scrapers
   * pull hero shots from Macy's, Unsplash, etc. — add any new host you
   * import from.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "assets.macys.com" },
      { protocol: "https", hostname: "images.nordstrom.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Trim payload:
   *   • poweredByHeader off  — no `x-powered-by: Next.js`
   *   • compress on          — gzip / brotli via Node
   *   • reactStrictMode      — surfaces hydration mismatches early in dev
   */
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  /**
   * Security headers applied to every response. Locks the site down without
   * needing a reverse proxy. Add HSTS + a full CSP once you're on HTTPS.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/category/women",
        destination: "/category/womens-clothing",
        permanent: false,
      },
      {
        source: "/category/women-clothing",
        destination: "/category/womens-clothing",
        permanent: false,
      },
      {
        source: "/category/women/:subslug",
        destination: "/category/womens-dresses/:subslug",
        permanent: false,
      },
      {
        source: "/category/dresses",
        destination: "/category/womens-dresses",
        permanent: false,
      },
      {
        source: "/category/dresses/:subslug",
        destination: "/category/womens-dresses/:subslug",
        permanent: false,
      },
      {
        source: "/category/jeans",
        destination: "/category/womens-jeans-denim",
        permanent: false,
      },
      {
        source: "/collections/women",
        destination: "/category/womens-clothing",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
