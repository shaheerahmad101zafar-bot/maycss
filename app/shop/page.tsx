import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import ShopCategoryIndex, {
  ShopCatalogSection,
} from "@/components/shop/ShopSections";
import { PageFactory } from "@/lib/pages";
import { getCategories, getProducts } from "@/lib/data";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("shop");
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Shop All · MayCSS",
    description: "Browse the full MayCSS collection by category.",
  };
}

export default async function ShopPage() {
  const [page, products, categories] = await Promise.all([
    PageFactory.getBySlug("shop"),
    getProducts(),
    getCategories(),
  ]);

  if (!page) notFound();

  const hasProductGrid = page.blocks.some((b) => b.type === "productgrid");

  return (
    <>
      <CmsPageView page={page} products={products} categories={categories} />
      {page.pageKind === "shop" && <ShopCategoryIndex />}
      {page.pageKind === "shop" && !hasProductGrid && <ShopCatalogSection />}
    </>
  );
}
