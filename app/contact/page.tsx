import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import { getAppConfig } from "@/lib/app-config";
import { MAYCSS_BUSINESS } from "@/lib/business";
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
        "Contact MAYCSS at myacssstore@gmail.com or +1 (501) 436-9308. Business address: 1707 S Lee's Summit Rd, Independence, MO 64050, USA.",
      keywords: ["MAYCSS", "clothing store", "contact", "customer support"],
    },
    "/contact",
  );
}

export default async function ContactPage() {
  const [page, cfg] = await Promise.all([
    PageFactory.getBySlug("contact"),
    getAppConfig(),
  ]);
  if (!page) notFound();

  const email = cfg.contactEmail || MAYCSS_BUSINESS.supportEmail;
  const phone = cfg.supportPhone || MAYCSS_BUSINESS.supportPhone;
  const address = cfg.businessAddress || MAYCSS_BUSINESS.addressMultiline;

  // Always surface GMC-aligned contact details (overrides stale CMS placeholders).
  const pageWithBusiness = {
    ...page,
    contactDetails: {
      heading: "MAYCSS Customer Support",
      lead: "Reach our support team by email or phone. Returns are accepted by mail to our Independence, MO address.",
      rows: [
        {
          id: "cdr_store",
          label: "Store name",
          body: cfg.siteName || MAYCSS_BUSINESS.storeName,
        },
        {
          id: "cdr_address",
          label: "Business address",
          body: address,
        },
        {
          id: "cdr_email",
          label: "Support email",
          body: email,
        },
        {
          id: "cdr_phone",
          label: "Support phone",
          body: phone,
        },
        {
          id: "cdr_returns",
          label: "Mail-in returns",
          body: `Return eligible items within ${MAYCSS_BUSINESS.returnWindowDays} days of delivery to:\n${MAYCSS_BUSINESS.addressMultiline}`,
        },
      ],
    },
  };

  return (
    <>
      <CmsPageView page={pageWithBusiness} products={[]} />
      <FeaturesStrip />
    </>
  );
}
