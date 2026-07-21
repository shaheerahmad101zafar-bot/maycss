import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import ShopCategoryIndex, {
  ShopCatalogSection,
} from "@/components/shop/ShopSections";
import PagePromoBanner from "@/components/marketing/PagePromoBanner";
import { PageFactory } from "@/lib/pages";
import { getCategories, getListingProducts } from "@/lib/data";
import {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const page = await PageFactory.getBySlug("shop");
  if (q?.trim()) {
    return {
      title: `Search “${q.trim()}” · MAYCSS`,
      description: `Shop results for ${q.trim()} at MAYCSS Online Store.`,
    };
  }
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Shop All · MayCSS",
    description: "Browse the full MayCSS collection by category.",
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const { q, page: pageRaw } = await searchParams;
  const query = q?.trim().toLowerCase() || "";
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const [page, allProducts, categories] = await Promise.all([
    PageFactory.getBySlug("shop"),
    getListingProducts(),
    getCategories(),
  ]);

  if (!page) notFound();

  const filtered = query
    ? allProducts.filter((p) => {
        const hay = [p.name, p.brand, p.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
    : allProducts;

  const { pageItems, totalCount, safePage } = paginateProducts(
    filtered,
    pageNum,
    STOREFRONT_PAGE_SIZE,
  );
  const hasProductGrid = page.blocks.some((b) => b.type === "productgrid");
  const basePath = query
    ? `/shop?q=${encodeURIComponent(q!.trim())}`
    : "/shop";

  return (
    <>
      {!query && <PagePromoBanner page="shop" />}
      {!query && (
        <CmsPageView
          page={page}
          products={allProducts.slice(0, 8)}
          categories={categories}
        />
      )}
      {query && (
        <section className="mc-section">
          <div className="mc-container">
            <header className="mc-section-header">
              <p className="mc-section-subtitle">Search</p>
              <h1 className="mc-section-title">Results for “{q?.trim()}”</h1>
              <p className="mc-section-header__lead">
                {totalCount} product{totalCount === 1 ? "" : "s"} found
              </p>
            </header>
          </div>
        </section>
      )}
      {page.pageKind === "shop" && !query && <ShopCategoryIndex />}
      {(page.pageKind === "shop" || query) &&
        (!hasProductGrid || query) && (
          <ShopCatalogSection
            products={pageItems}
            totalCount={totalCount}
            page={safePage}
            basePath={basePath}
            pageSize={STOREFRONT_PAGE_SIZE}
          />
        )}
    </>
  );
}
