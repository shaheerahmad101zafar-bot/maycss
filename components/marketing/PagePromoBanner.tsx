import Link from "next/link";

export type PagePromoKey = "about" | "contact" | "shop" | "sale" | "default";

const PROMO: Record<
  PagePromoKey,
  {
    image: string;
    title: string;
    body: string;
    secondaryHref: string;
    secondaryLabel: string;
  }
> = {
  about: {
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=65",
    title: "About MAYCSS",
    body: "Curated luxury fashion with Black Friday savings — craft, fit, and quiet confidence.",
    secondaryHref: "/shop",
    secondaryLabel: "Browse the collection",
  },
  contact: {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=65",
    title: "Contact Us",
    body: "Styling help, order questions, and personal shopping — our team is ready for you.",
    secondaryHref: "/sale",
    secondaryLabel: "Shop the sale",
  },
  shop: {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=65",
    title: "Shop All",
    body: "Women's clothing, dresses, and denim — every piece with Black Friday 20% off.",
    secondaryHref: "/category/womens-clothing",
    secondaryLabel: "Shop women's clothing",
  },
  sale: {
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=65",
    title: "Black Friday Sale",
    body: "Limited-time markdowns across the MAYCSS edit — dresses, denim, and everyday essentials.",
    secondaryHref: "/shop",
    secondaryLabel: "Browse shop all",
  },
  default: {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=65",
    title: "Black Friday at MAYCSS",
    body: "Limited-time savings across women's clothing, dresses, and denim.",
    secondaryHref: "/shop",
    secondaryLabel: "Shop the collection",
  },
};

type Props = {
  page: PagePromoKey;
};

/**
 * Full-bleed Black Friday page banner — same look as category promo heroes.
 * Static (no slider / countdown) so pages stay clean and load faster.
 */
export default function PagePromoBanner({ page }: Props) {
  const cfg = PROMO[page] ?? PROMO.default;

  return (
    <section
      className="mc-cat-promo"
      aria-label={`${cfg.title} Black Friday banner`}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28)), url(${cfg.image})`,
      }}
    >
      <div className="mc-container mc-cat-promo__inner">
        <p className="mc-cat-promo__eyebrow">Black Friday Sale</p>
        <h1 className="mc-cat-promo__title">{cfg.title}</h1>
        <p className="mc-cat-promo__body">{cfg.body}</p>
        <div className="mc-cat-promo__actions">
          <Link href="/sale" className="mc-btn mc-btn--primary mc-btn--hero">
            Shop Black Friday
          </Link>
          <Link
            href={cfg.secondaryHref}
            className="mc-btn mc-btn--ghost mc-btn--hero"
          >
            {cfg.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
