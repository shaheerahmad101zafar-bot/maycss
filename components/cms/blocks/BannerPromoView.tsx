import Link from "next/link";
import type { BannerBlock } from "@/lib/blocks/types";
import type { Category } from "@/lib/utils";
import { bgImageStyle, overlayOpacityStyle } from "@/lib/images/focus";

/** Curated shop links for homepage promo banners (admin can change). */
export const BANNER_SHOP_LINK_OPTIONS: { id: string; label: string }[] = [
  { id: "cat_womens_clothing", label: "Women's Clothing" },
  { id: "cat_formal", label: "Formal" },
  { id: "cat_wedding_guest", label: "Wedding Guest" },
  { id: "cat_cocktail_party", label: "Cocktail & Party" },
  { id: "cat_casual", label: "Casual" },
  { id: "cat_work", label: "Work" },
  { id: "cat_womens_jeans", label: "Women's Jeans & Denim" },
  { id: "cat_jeans_wide_leg", label: "Wide-Leg Jeans" },
  { id: "cat_jeans_straight", label: "Straight" },
  { id: "cat_jeans_barrel", label: "Barrel" },
  { id: "cat_jeans_skinny", label: "Skinny" },
];

function hrefFor(cat: Category, byId: Map<string, Category>): string {
  if (!cat.parentId) return `/category/${cat.slug}`;
  const parent = byId.get(cat.parentId);
  if (parent) return `/category/${parent.slug}/${cat.slug}`;
  return `/category/${cat.slug}`;
}

export default function BannerPromoView({
  block,
  categories,
}: {
  block: BannerBlock;
  categories?: Category[];
}) {
  if (!block.image) return null;

  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const chips = (block.categoryIds ?? [])
    .map((id) => byId.get(id))
    .filter((c): c is Category => Boolean(c));

  const overlayStyle = overlayOpacityStyle(
    block.overlayStrength ?? (block.overlay === "none" ? 0 : 55),
  );

  return (
    <section
      className="mc-cat-promo mc-block mc-block--banner-promo"
      aria-label={block.heading}
      style={{
        ...bgImageStyle(block.image, block.imageFocus),
        ...overlayStyle,
      }}
    >
      <div className="mc-container mc-cat-promo__inner">
        {block.eyebrow && (
          <p className="mc-cat-promo__eyebrow">{block.eyebrow}</p>
        )}
        <h2 className="mc-cat-promo__title">{block.heading}</h2>
        {block.body && <p className="mc-cat-promo__body">{block.body}</p>}

        {(block.ctaLabel || block.secondaryCtaLabel) && (
          <div className="mc-cat-promo__actions">
            {block.ctaLabel && block.ctaHref && (
              <Link
                href={block.ctaHref}
                className="mc-btn mc-btn--primary mc-btn--hero"
              >
                {block.ctaLabel}
              </Link>
            )}
            {block.secondaryCtaLabel && block.secondaryCtaHref && (
              <Link
                href={block.secondaryCtaHref}
                className="mc-btn mc-btn--ghost mc-btn--hero"
              >
                {block.secondaryCtaLabel}
              </Link>
            )}
          </div>
        )}

        {chips.length > 0 && (
          <nav className="mc-cat-promo__chips" aria-label="Shop by style">
            {chips.map((cat) => (
              <Link
                key={cat.id}
                href={hrefFor(cat, byId)}
                className="mc-cat-promo__chip"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
