import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import PagePromoBanner from "@/components/marketing/PagePromoBanner";
import { PageFactory } from "@/lib/pages";
import { getListingProducts } from "@/lib/data";
import type { PagePromoKey } from "@/components/marketing/PagePromoBanner";

type Props = { params: Promise<{ slug: string }> };

const PAGE_BANNER: Partial<Record<string, PagePromoKey>> = {
  about: "about",
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await PageFactory.getBySlug(slug);
  if (!page) return { title: "Not found · MayCSS" };
  return PageFactory.toMetadata(page);
}

export default async function CmsPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await PageFactory.getBySlug(slug);
  if (!page) notFound();
  const jsonLd = PageFactory.toJsonLd(page);
  const bannerKey = PAGE_BANNER[slug];

  // Only pull catalog when a CMS block actually needs products.
  const needsProducts = page.blocks.some(
    (b) =>
      b.type === "productgrid" ||
      b.type === "featured" ||
      b.type === "productcarousel",
  );
  const products = needsProducts
    ? (await getListingProducts()).slice(0, 12)
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      {bannerKey && <PagePromoBanner page={bannerKey} />}
      <CmsPageView page={page} products={products} />
    </>
  );
}
