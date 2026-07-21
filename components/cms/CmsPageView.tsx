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
};

/**
 * Universal CMS page shell — hero header (optional background image), blocks.
 * Admin fields: title, eyebrow, hero paragraph, bannerImage (hero BG).
 */
export default function CmsPageView({
  page,
  products,
  categories,
  children,
}: Props) {
  const showHeader =
    page.showHeroBanner !== false &&
    Boolean(page.eyebrow || page.hero || page.title);
  const hasHeroBg = Boolean(page.bannerImage?.trim());
  const contactAside =
    page.pageKind === "contact" && page.contactDetails ? (
      <ContactDetailsAside details={page.contactDetails} />
    ) : null;

  return (
    <article className={cx("mc-page", page.pageKind && `mc-page--${page.pageKind}`)}>
      {showHeader && (
        <header
          className={cx(
            "mc-page__header",
            hasHeroBg && "mc-page__header--hero-bg",
          )}
          style={
            hasHeroBg
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.66), rgba(0,0,0,.32)), url(${page.bannerImage})`,
                }
              : undefined
          }
        >
          <div className="mc-container mc-page__header-inner">
            {page.eyebrow && (
              <p className="mc-page__eyebrow">{page.eyebrow}</p>
            )}
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
          </div>
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
