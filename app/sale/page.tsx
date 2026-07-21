import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import PagePromoBanner from "@/components/marketing/PagePromoBanner";
import CategoryPage, {
  paginateProducts,
} from "@/components/products/CategoryPage";
import { PageFactory } from "@/lib/pages";
import { getSaleItems } from "@/lib/data";
import type { Metadata } from "next";

/** Sale page shows denser grids so shoppers can browse the full markdown edit. */
const SALE_PAGE_SIZE = 48;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("sale");
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Black Friday Sale · MayCSS",
    description:
      "Black Friday sale — 20% off women's clothing, dresses, and denim at MAYCSS.",
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

  const cmsPage = {
    ...page,
    blocks: page.blocks.filter((b) => b.type !== "productgrid"),
  };

  const { pageItems, totalCount, safePage } = paginateProducts(
    saleProducts,
    pageNum,
    SALE_PAGE_SIZE,
  );

  return (
    <>
      <PagePromoBanner page="sale" />
      <CmsPageView page={cmsPage} products={[]} hideBanner />
      <CategoryPage
        eyebrow="Black Friday"
        title="On Sale Now"
        subtitle={`${totalCount.toLocaleString()} pieces with 20% off — women's clothing, dresses, and denim.`}
        products={pageItems}
        totalCount={totalCount}
        emptyLabel="No sale items right now."
        page={safePage}
        basePath="/sale"
        pageSize={SALE_PAGE_SIZE}
      />
    </>
  );
}
