import Link from "next/link";

/** Persistent Black Friday promo strip — department-store sale bar. */
export default function PromoBar() {
  return (
    <div
      className="mc-promo-bar mc-promo-bar--sale"
      role="region"
      aria-label="Black Friday sale"
    >
      <div className="mc-container mc-promo-bar__inner">
        <p className="mc-promo-bar__text">
          <strong>Black Friday Sale</strong>
          <span aria-hidden="true"> — </span>
          Limited-time savings on women&apos;s clothing, dresses &amp; denim
        </p>
        <Link href="/sale" className="mc-promo-bar__cta">
          Shop Sale
        </Link>
      </div>
    </div>
  );
}
