import { notFound } from "next/navigation";
import CmsPageView from "@/components/cms/CmsPageView";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import { PageFactory } from "@/lib/pages";
import { getAppConfig } from "@/lib/app-config";
import { getProducts } from "@/lib/data";
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
  const [page, cfg, products] = await Promise.all([
    PageFactory.getBySlug("contact"),
    getAppConfig(),
    getProducts(),
  ]);

  if (!page) notFound();

  const email = cfg.contactEmail || "hello@maycss.example";
  const phone = cfg.supportPhone || "+1 (800) 555-0199";

  return (
    <>
      <CmsPageView page={page} products={products}>
        <aside className="mc-contact__details mc-contact__details--cms">
          <h2>Visit &amp; Connect</h2>
          <p className="mc-contact__details-lead">
            Experience {cfg.siteName} in person or reach us through any of the
            channels below.
          </p>
          <dl className="mc-contact__list">
            <div>
              <dt>Flagship Boutique</dt>
              <dd>
                450 Madison Avenue
                <br />
                New York, NY 10022
              </dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>
                Mon – Sat: 10am – 8pm
                <br />
                Sun: 11am – 6pm
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
              </dd>
            </div>
          </dl>
        </aside>
      </CmsPageView>
      <FeaturesStrip />
    </>
  );
}
