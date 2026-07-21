import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import ShopCategoryIndex, {
  ShopCatalogSection,
} from "@/components/shop/ShopSections";
import { PageFactory } from "@/lib/pages";
import { getCategories, getProducts } from "@/lib/data";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ q?: string }>;
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
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() || "";
  const [page, allProducts, categories] = await Promise.all([
    PageFactory.getBySlug("shop"),
    getProducts(),
    getCategories(),
  ]);

  if (!page) notFound();

  const products = query
    ? allProducts.filter((p) => {
        const hay = [
          p.name,
          p.brand,
          p.category,
          p.description,
          ...(p.seo?.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
    : allProducts;

  const hasProductGrid = page.blocks.some((b) => b.type === "productgrid");

  return (
    <>
      {!query && (
        <CmsPageView page={page} products={products} categories={categories} />
      )}
      {query && (
        <section className="mc-section">
          <div className="mc-container">
            <header className="mc-section-header">
              <p className="mc-section-subtitle">Search</p>
              <h1 className="mc-section-title">Results for “{q?.trim()}”</h1>
              <p className="mc-section-header__lead">
                {products.length} product{products.length === 1 ? "" : "s"} found
              </p>
            </header>
          </div>
        </section>
      )}
      {page.pageKind === "shop" && !query && <ShopCategoryIndex />}
      {(page.pageKind === "shop" || query) &&
        (!hasProductGrid || query) && (
          <ShopCatalogSection products={products} />
        )}
    </>
  );
}
