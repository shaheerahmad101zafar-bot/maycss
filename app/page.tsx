import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import EditorialSection from "@/components/marketing/EditorialSection";
import ProductCard from "@/components/products/ProductCard";
import BlockRenderer from "@/components/cms/BlockRenderer";
import MarketingBanner from "@/components/marketing/MarketingBanner";
import HomeCategoryBanners from "@/components/marketing/HomeCategoryBanners";
import { getBannerSlides, getCategories, getHomeListingProducts } from "@/lib/data";
import { heroImageUrl } from "@/lib/images/cdn-url";
import { PageFactory } from "@/lib/pages";
import { withCanonical } from "@/lib/seo/canonical";
import type { Metadata } from "next";

const FALLBACK_META: Metadata = withCanonical(
  {
    title: "MAYCSS | Curated Luxury Fashion Online",
    description:
      "Shop MAYCSS for women clothes, dresses for women, jeans and denim, and fashion products — curated luxury from our online clothing store.",
    keywords: [
      "MAYCSS",
      "fashion products",
      "women clothes",
      "clothing store",
      "wholesale clothing",
    ],
  },
  "/",
);

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("home");
  if (!page) return FALLBACK_META;
  return PageFactory.toMetadata(page);
}

export default async function Home() {
  const [homePage, listingProducts, slides, categories] = await Promise.all([
    PageFactory.getBySlug("home"),
    getHomeListingProducts(6),
    getBannerSlides(),
    getCategories(),
  ]);

  const lcpHero = slides[0]?.image ? heroImageUrl(slides[0].image) : "";

  if (homePage && homePage.blocks.length > 0) {
    const jsonLd = PageFactory.toJsonLd(homePage);
    const hasFeaturesBlock = homePage.blocks.some((b) => b.type === "features");
    const hasMarketingSlider = homePage.blocks.some(
      (b) => b.type === "slider" && b.variant === "marketing",
    );

    return (
      <>
        {lcpHero ? <link rel="preload" as="image" href={lcpHero} /> : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        {!hasMarketingSlider && slides.length > 0 && (
          <MarketingBanner
            slides={slides}
            showDelay={0}
            countdownTo="2026-12-01T00:00:00.000Z"
          />
        )}
        <BlockRenderer
          blocks={homePage.blocks}
          products={listingProducts}
          categories={categories}
          bannerSlides={slides}
        />
        {!hasFeaturesBlock && <FeaturesStrip />}
      </>
    );
  }

  return (
    <>
      {lcpHero ? <link rel="preload" as="image" href={lcpHero} /> : null}
      {slides.length > 0 && <MarketingBanner slides={slides} />}

      <section id="featured" className="mc-section">
        <div className="mc-container">
          <header className="mc-section-header">
            <p className="mc-section-subtitle">Curated for you</p>
            <h1 className="mc-section-title">MAYCSS Curated Luxury Fashion</h1>
            <p className="mc-section-header__lead">
              Hand-selected women clothes, dresses for women, and jeans and denim
              from independent ateliers and heritage maisons — each chosen for
              craftsmanship, longevity, and quiet luxury.
            </p>
          </header>

          <h2 className="mc-section-title" style={{ marginTop: "1.5rem" }}>
            The Featured Edit
          </h2>

          <div className="mc-product-grid">
            {listingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <HomeCategoryBanners
        categories={categories}
        showPromoBanners={false}
      />
      <FeaturesStrip />
      <EditorialSection />
    </>
  );
}
