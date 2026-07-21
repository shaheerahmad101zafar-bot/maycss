import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import { PageFactory } from "@/lib/pages";
import { getSaleItems } from "@/lib/data";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("sale");
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Sale · MayCSS",
    description: "Limited-time markdowns on curated MayCSS pieces.",
  };
}

export default async function SalePage({ searchParams }: Props) {
  const { page: pageRaw } = await searchParams;
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const [page, saleProducts] = await Promise.all([
    PageFactory.getBySlug("sale"),
    getSaleItems(),
  ]);

  if (!page) notFound();

  const hasProductGrid = page.blocks.some((b) => b.type === "productgrid");
  const { pageItems, totalCount, safePage } = paginateProducts(
    saleProducts,
    pageNum,
    STOREFRONT_PAGE_SIZE,
  );

  return (
    <>
      <CmsPageView page={page} products={saleProducts.slice(0, 8)} />
      {page.pageKind === "sale" && !hasProductGrid && (
        <CategoryPage
          eyebrow="Limited Time"
          title="Sale"
          subtitle="Investment pieces at investment-friendly prices."
          products={pageItems}
          totalCount={totalCount}
          emptyLabel="No sale items right now."
          page={safePage}
          basePath="/sale"
        />
      )}
    </>
  );
}
