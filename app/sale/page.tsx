import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import CategoryPage from "@/components/products/CategoryPage";
import { PageFactory } from "@/lib/pages";
import { getProducts, getSaleItems } from "@/lib/data";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("sale");
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Sale · MayCSS",
    description: "Limited-time markdowns on curated MayCSS pieces.",
  };
}

export default async function SalePage() {
  const [page, products, saleProducts] = await Promise.all([
    PageFactory.getBySlug("sale"),
    getProducts(),
    getSaleItems(),
  ]);

  if (!page) notFound();

  const hasProductGrid = page.blocks.some((b) => b.type === "productgrid");

  return (
    <>
      <CmsPageView page={page} products={products} />
      {page.pageKind === "sale" && !hasProductGrid && (
        <CategoryPage
          eyebrow="Limited Time"
          title="Sale"
          subtitle="Investment pieces at investment-friendly prices."
          products={saleProducts}
          emptyLabel="No sale items right now."
        />
      )}
    </>
  );
}
