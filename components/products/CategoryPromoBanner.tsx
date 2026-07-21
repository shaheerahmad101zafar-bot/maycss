import Link from "next/link";

const BANNER_BY_SLUG: Record<
  string,
  { image: string; line: string }
> = {
  "womens-clothing": {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80",
    line: "Dresses, denim, and everyday essentials — Black Friday savings now on.",
  },
  "womens-dresses": {
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2000&q=80",
    line: "Formal, wedding guest, cocktail, casual & work — shop dresses for women.",
  },
  "womens-jeans-denim": {
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=2000&q=80",
    line: "Wide-leg, straight, barrel, flare & skinny — find your denim fit.",
  },
  formal: {
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=2000&q=80",
    line: "Evening gowns and formal looks for every occasion.",
  },
  default: {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80",
    line: "Limited-time Black Friday savings across the MAYCSS edit.",
  },
};

type Props = {
  categoryName: string;
  categorySlug: string;
};

/** Full-bleed Black Friday promo banner for category pages. */
export default function CategoryPromoBanner({
  categoryName,
  categorySlug,
}: Props) {
  const cfg = BANNER_BY_SLUG[categorySlug] ?? BANNER_BY_SLUG.default;

  return (
    <section
      className="mc-cat-promo"
      aria-label={`${categoryName} Black Friday banner`}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28)), url(${cfg.image})`,
      }}
    >
      <div className="mc-container mc-cat-promo__inner">
        <p className="mc-cat-promo__eyebrow">Black Friday Sale</p>
        <h2 className="mc-cat-promo__title">Shop {categoryName}</h2>
        <p className="mc-cat-promo__body">{cfg.line}</p>
        <div className="mc-cat-promo__actions">
          <Link href="/sale" className="mc-btn mc-btn--primary mc-btn--hero">
            Shop Black Friday
          </Link>
          <Link
            href={`/category/${categorySlug}`}
            className="mc-btn mc-btn--ghost mc-btn--hero"
          >
            Browse {categoryName}
          </Link>
        </div>
      </div>
    </section>
  );
}
