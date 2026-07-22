import Link from "next/link";
import type { Category } from "@/lib/utils";
import { bannerImageUrl, tileImageUrl } from "@/lib/images/cdn-url";

const IMAGE_BY_SLUG: Record<string, string> = {
  "womens-clothing":
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=65&fm=webp",
  "womens-dresses":
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=65&fm=webp",
  "womens-jeans-denim":
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=65&fm=webp",
  formal:
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=65&fm=webp",
  "wedding-guest":
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=65&fm=webp",
  "cocktail-party":
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=65&fm=webp",
  day: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=65&fm=webp",
  casual:
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=65&fm=webp",
  work: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=65&fm=webp",
  "wide-leg-jeans":
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=65&fm=webp",
  "straight-jeans":
    "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=900&q=65&fm=webp",
  "barrel-jeans":
    "https://images.unsplash.com/photo-1475178626620-a4d074967377?auto=format&fit=crop&w=900&q=65&fm=webp",
  "flare-bootcut-jeans":
    "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=900&q=65&fm=webp",
  "skinny-jeans":
    "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=900&q=65&fm=webp",
  default:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=65&fm=webp",
};

function promoBannerImage(cat: Category): string {
  const raw = cat.image || IMAGE_BY_SLUG[cat.slug] || IMAGE_BY_SLUG.default;
  return bannerImageUrl(raw);
}

function subcardImage(cat: Category): string {
  const raw = cat.image || IMAGE_BY_SLUG[cat.slug] || IMAGE_BY_SLUG.default;
  return tileImageUrl(raw);
}

function hrefFor(cat: Category, parents: Map<string, Category>): string {
  if (!cat.parentId) return `/category/${cat.slug}`;
  const parent = parents.get(cat.parentId);
  if (parent) return `/category/${parent.slug}/${cat.slug}`;
  return `/category/${cat.slug}`;
}

type Props = {
  categories: Category[];
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  /** When false, hide large promo strips — style cards only. */
  showPromoBanners?: boolean;
};

/**
 * Home category section: optional promo banners + subcategory card grids.
 * Toggle promo strips from Admin → category grid → “Show promo banners”.
 */
export default function HomeCategoryBanners({
  categories,
  eyebrow = "Browse",
  heading = "Shop by Category",
  subheading = "Every category we carry — open a style below to shop the full edit.",
  showPromoBanners = true,
}: Props) {
  const parents = new Map(categories.map((c) => [c.id, c]));
  const top = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (top.length === 0) return null;

  return (
    <section className="mc-home-cat-banners" aria-label="Shop by category">
      <div className="mc-container mc-home-cat-banners__intro">
        {eyebrow && <p className="mc-section-subtitle">{eyebrow}</p>}
        {heading && <h2 className="mc-section-title">{heading}</h2>}
        {subheading && (
          <p className="mc-section-header__lead">{subheading}</p>
        )}
      </div>

      {top.map((cat) => {
        const subs = categories
          .filter((c) => c.parentId === cat.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const href = hrefFor(cat, parents);
        const cards = subs.length > 0 ? subs : showPromoBanners ? [] : [cat];

        if (!showPromoBanners && cards.length === 0) return null;

        return (
          <div key={cat.id} className="mc-home-cat-banners__group">
            {showPromoBanners && (
              <section
                className="mc-cat-promo"
                aria-label={`${cat.name} Black Friday banner`}
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28)), url(${promoBannerImage(cat)})`,
                }}
              >
                <div className="mc-container mc-cat-promo__inner">
                  <p className="mc-cat-promo__eyebrow">Black Friday Sale</p>
                  <h2 className="mc-cat-promo__title">Shop {cat.name}</h2>
                  <p className="mc-cat-promo__body">
                    {cat.description ||
                      `Explore ${cat.name} with 20% off for Black Friday.`}
                  </p>
                  <div className="mc-cat-promo__actions">
                    <Link
                      href="/sale"
                      className="mc-btn mc-btn--primary mc-btn--hero"
                    >
                      Shop Black Friday
                    </Link>
                    <Link
                      href={href}
                      className="mc-btn mc-btn--ghost mc-btn--hero"
                    >
                      Browse {cat.name}
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {cards.length > 0 && (
              <div className="mc-container mc-home-cat-banners__subs">
                <p className="mc-home-cat-banners__subs-label">
                  Shop {cat.name}
                  {subs.length > 0 ? " by style" : ""}
                </p>
                <div className="mc-home-cat-banners__subgrid">
                  {cards.map((card) => (
                    <Link
                      key={card.id}
                      href={hrefFor(card, parents)}
                      className="mc-home-cat-banners__subcard"
                      aria-label={`Shop ${card.name}`}
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.72)), url(${subcardImage(card)})`,
                      }}
                    >
                      <span className="mc-home-cat-banners__sub-eyebrow">
                        Black Friday
                      </span>
                      <span className="mc-home-cat-banners__sub-title">
                        {card.name}
                      </span>
                      {card.description && (
                        <span className="mc-home-cat-banners__sub-desc">
                          {card.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
