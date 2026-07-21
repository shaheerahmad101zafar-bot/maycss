import BlockRenderer from "@/components/cms/BlockRenderer";
import ContactDetailsAside from "@/components/cms/ContactDetailsAside";
import type { Page } from "@/lib/pages";
import type { Category, Product } from "@/lib/utils";
import { cx } from "@/lib/utils";

type Props = {
  page: Page;
  products?: Product[];
  categories?: Category[];
  children?: React.ReactNode;
  /** Hide CMS bannerImage when a page already has PagePromoBanner. */
  hideBanner?: boolean;
};

/**
 * Universal CMS page shell — banner, header, blocks.
 * Admin-edited fields (title, hero, banner, SEO) render here on every route.
 */
export default function CmsPageView({
  page,
  products,
  categories,
  children,
  hideBanner = false,
}: Props) {
  const showHeader = Boolean(page.eyebrow || page.hero || page.title);
  const contactAside =
    page.pageKind === "contact" && page.contactDetails ? (
      <ContactDetailsAside details={page.contactDetails} />
    ) : null;

  return (
    <article className={cx("mc-page", page.pageKind && `mc-page--${page.pageKind}`)}>
      {!hideBanner && page.bannerImage && (
        <div
          className="mc-page-banner"
          style={{ backgroundImage: `url(${page.bannerImage})` }}
          role="img"
          aria-label={`${page.title} banner`}
        >
          <div className="mc-page-banner__overlay" />
        </div>
      )}

      {showHeader && (
        <header className="mc-page__header">
          {page.eyebrow && <p className="mc-page__eyebrow">{page.eyebrow}</p>}
          <h1 className="mc-page__title">{page.title}</h1>
          {page.hero && <p className="mc-page__hero">{page.hero}</p>}
          {page.lastUpdated && (
            <p className="mc-page__meta">
              Last updated{" "}
              {new Date(page.lastUpdated).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>
      )}

      <div
        className={cx(
          "mc-container mc-page__body",
          page.pageKind === "contact" && "mc-page__body--contact",
        )}
      >
        <div className="mc-page__blocks">
          <BlockRenderer
            blocks={page.blocks}
            products={products}
            categories={categories}
          />
          {page.pageKind === "contact" && page.mapEmbed && (
            <section className="mc-map-embed" aria-label="Store location map">
              <div
                className="mc-map-embed__frame"
                dangerouslySetInnerHTML={{ __html: page.mapEmbed }}
              />
            </section>
          )}
        </div>
        {contactAside}
        {children}
      </div>
    </article>
  );
}
