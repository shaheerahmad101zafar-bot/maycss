import Link from "next/link";
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
 * Universal CMS page shell — promo-style hero (mc-cat-promo) when a
 * banner image is set, then CMS blocks. Admin: title, eyebrow, hero,
 * bannerImage, CTAs, showHeroBanner.
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
  const hasPrimaryCta = Boolean(page.heroCtaLabel?.trim() && page.heroCtaHref?.trim());
  const hasSecondaryCta = Boolean(
    page.heroSecondaryCtaLabel?.trim() && page.heroSecondaryCtaHref?.trim(),
  );
  const contactAside =
    page.pageKind === "contact" && page.contactDetails ? (
      <ContactDetailsAside details={page.contactDetails} />
    ) : null;

  return (
    <article className={cx("mc-page", page.pageKind && `mc-page--${page.pageKind}`)}>
      {showHeader && hasHeroBg && (
        <section
          className="mc-cat-promo"
          aria-label={`${page.title} banner`}
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28)), url(${page.bannerImage})`,
          }}
        >
          <div className="mc-container mc-cat-promo__inner">
            {page.eyebrow && (
              <p className="mc-cat-promo__eyebrow">{page.eyebrow}</p>
            )}
            <h1 className="mc-cat-promo__title">{page.title}</h1>
            {page.hero && <p className="mc-cat-promo__body">{page.hero}</p>}
            {(hasPrimaryCta || hasSecondaryCta) && (
              <div className="mc-cat-promo__actions">
                {hasPrimaryCta && (
                  <Link
                    href={page.heroCtaHref!}
                    className="mc-btn mc-btn--primary mc-btn--hero"
                  >
                    {page.heroCtaLabel}
                  </Link>
                )}
                {hasSecondaryCta && (
                  <Link
                    href={page.heroSecondaryCtaHref!}
                    className="mc-btn mc-btn--ghost mc-btn--hero"
                  >
                    {page.heroSecondaryCtaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {showHeader && !hasHeroBg && (
        <header className="mc-page__header">
          <div className="mc-container mc-page__header-inner">
            {page.eyebrow && (
              <p className="mc-page__eyebrow">{page.eyebrow}</p>
            )}
            <h1 className="mc-page__title">{page.title}</h1>
            {page.hero && <p className="mc-page__hero">{page.hero}</p>}
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
