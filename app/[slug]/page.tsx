import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import { PageFactory } from "@/lib/pages";
import { getProducts } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

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
  const products = await getProducts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <CmsPageView page={page} products={products} />
    </>
  );
}
