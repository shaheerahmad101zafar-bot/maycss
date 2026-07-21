import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import BlackFridayHero from "@/components/marketing/BlackFridayHero";
import { PageFactory } from "@/lib/pages";
import { getListingProducts } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

/** CMS pages that should open with the Black Friday hero slider. */
const BF_BANNER_SLUGS = new Set(["about", "faq", "privacy", "refund"]);

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
  const products = (await getListingProducts()).slice(0, 24);
  const showBfBanner = BF_BANNER_SLUGS.has(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      {showBfBanner && <BlackFridayHero />}
      <CmsPageView page={page} products={products} />
    </>
  );
}
