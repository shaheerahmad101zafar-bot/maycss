import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import { PageFactory } from "@/lib/pages";
import { withCanonical } from "@/lib/seo/canonical";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("contact");
  if (page) return PageFactory.toMetadata(page);
  return withCanonical(
    {
      title: "Contact Us · MAYCSS Clothing Store",
      description:
        "Get in touch with the MAYCSS concierge team — styling advice, order enquiries, and personal shopping for women clothes and fashion products.",
      keywords: ["MAYCSS", "clothing store", "fashion products", "contact"],
    },
    "/contact",
  );
}

export default async function ContactPage() {
  const page = await PageFactory.getBySlug("contact");
  if (!page) notFound();

  return (
    <>
      <CmsPageView page={page} products={[]} />
      <FeaturesStrip />
    </>
  );
}
