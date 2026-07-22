import Link from "next/link";

const MESSAGES = [
  {
    strong: "Black Friday Sale",
    rest: "20% off women's clothing, dresses & denim — limited time",
  },
  {
    strong: "Shop Dresses",
    rest: "Formal, wedding guest, cocktail & party looks on sale",
  },
  {
    strong: "Jeans & Denim",
    rest: "Wide-leg, straight, barrel & skinny — Black Friday prices",
  },
  {
    strong: "Free markdown",
    rest: "Every piece tagged 20% OFF across the MAYCSS edit",
  },
];

/**
 * Server-rendered promo strip — CSS cycles messages (no client JS / intervals).
 */
export default function PromoBar() {
  return (
    <div
      className="mc-promo-bar mc-promo-bar--sale"
      role="region"
      aria-label="Black Friday sale"
    >
      <div className="mc-container mc-promo-bar__inner">
        <div className="mc-promo-bar__rotator" aria-live="polite">
          {MESSAGES.map((msg, i) => (
            <p
              key={i}
              className="mc-promo-bar__text mc-promo-bar__text--css"
              style={{ animationDelay: `${i * 4}s` }}
            >
              <strong>{msg.strong}</strong>
              <span aria-hidden="true"> — </span>
              {msg.rest}
            </p>
          ))}
        </div>
        <Link href="/sale" className="mc-promo-bar__cta">
          Shop Sale
        </Link>
      </div>
    </div>
  );
}
