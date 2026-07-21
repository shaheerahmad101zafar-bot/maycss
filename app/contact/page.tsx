import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import BlackFridayHero from "@/components/marketing/BlackFridayHero";
import { PageFactory } from "@/lib/pages";
import { getListingProducts } from "@/lib/data";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await PageFactory.getBySlug("contact");
  if (page) return PageFactory.toMetadata(page);
  return {
    title: "Contact Us · MayCSS",
    description:
      "Get in touch with our concierge team — styling advice, order enquiries, and personal shopping.",
  };
}

export default async function ContactPage() {
  const [page, products] = await Promise.all([
    PageFactory.getBySlug("contact"),
    getListingProducts(),
  ]);

  if (!page) notFound();

  return (
    <>
      <BlackFridayHero />
      <CmsPageView page={page} products={products.slice(0, 8)} />
      <FeaturesStrip />
    </>
  );
}
