import MarketingBanner from "@/components/marketing/MarketingBanner";
import HomeCategoryBanners from "@/components/marketing/HomeCategoryBanners";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import EditorialSection from "@/components/marketing/EditorialSection";
import ProductCard from "@/components/products/ProductCard";
import BlockRenderer from "@/components/cms/BlockRenderer";
import { getBannerSlides, getCategories, getListingProducts } from "@/lib/data";
import { PageFactory } from "@/lib/pages";
import type { Metadata } from "next";

const FALLBACK_META: Metadata = {
  title: "myacss — Premium fashion & lifestyle, curated",
  description:
    "Independent designers and heritage houses, sourced with integrity.",
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("home");
  if (!page) return FALLBACK_META;
  return PageFactory.toMetadata(page);
}

export default async function Home() {
  const [homePage, products, slides, categories] = await Promise.all([
    PageFactory.getBySlug("home"),
    getListingProducts(),
    getBannerSlides(),
    getCategories(),
  ]);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 16);
  const fallback = products.slice(0, 12);
  const seen = new Set<string>();
  const listingProducts = [...newArrivals, ...fallback]
    .filter((p) => {
      const id = String(p.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 24);

  if (homePage && homePage.blocks.length > 0) {
    const jsonLd = PageFactory.toJsonLd(homePage);
    const hasFeaturesBlock = homePage.blocks.some((b) => b.type === "features");
    // Skip duplicate categorygrid — HomeCategoryBanners handles shop-by-category.
    const blocks = homePage.blocks.filter((b) => b.type !== "categorygrid");

    // Annotated homepage order:
    // 1st  MarketingBanner (hero)
    // 2nd  SEO copy + product grid
    // 3rd  Full-bleed banner
    // 4th  Shop-by-category banners
    // then remaining CMS blocks
    const secondIds = new Set(["blk_home_seo_copy", "blk_home_grid"]);
    const thirdIds = new Set(["blk_home_banner"]);
    const secondBlocks = blocks.filter((b) => secondIds.has(b.id));
    const thirdBlocks = blocks.filter((b) => thirdIds.has(b.id));
    const restBlocks = blocks.filter(
      (b) => !secondIds.has(b.id) && !thirdIds.has(b.id),
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        {slides.length > 0 && (
          <MarketingBanner
            slides={slides}
            showDelay={0}
            countdownTo="2026-12-01T00:00:00.000Z"
          />
        )}
        <BlockRenderer
          blocks={secondBlocks}
          products={listingProducts}
          categories={categories}
        />
        <BlockRenderer
          blocks={thirdBlocks}
          products={listingProducts}
          categories={categories}
        />
        <HomeCategoryBanners categories={categories} />
        <BlockRenderer
          blocks={restBlocks}
          products={listingProducts}
          categories={categories}
        />
        {!hasFeaturesBlock && <FeaturesStrip />}
      </>
    );
  }

  return (
    <>
      <MarketingBanner slides={slides} />

      <section id="featured" className="mc-section">
        <div className="mc-container">
          <header className="mc-section-header">
            <p className="mc-section-subtitle">Curated for you</p>
            <h2 className="mc-section-title">The Featured Edit</h2>
            <p className="mc-section-header__lead">
              Hand-selected pieces from independent ateliers and heritage
              maisons — each chosen for craftsmanship, longevity, and quiet
              luxury.
            </p>
          </header>

          <div className="mc-product-grid">
            {listingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <HomeCategoryBanners categories={categories} />
      <FeaturesStrip />
      <EditorialSection />
    </>
  );
}
