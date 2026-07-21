"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

/** Sliding Black Friday promo strip under the top of every page. */
export default function PromoBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const msg = MESSAGES[index] ?? MESSAGES[0];

  return (
    <div
      className="mc-promo-bar mc-promo-bar--sale"
      role="region"
      aria-label="Black Friday sale"
      aria-live="polite"
    >
      <div className="mc-container mc-promo-bar__inner">
        <p key={index} className="mc-promo-bar__text mc-promo-bar__text--slide">
          <strong>{msg.strong}</strong>
          <span aria-hidden="true"> — </span>
          {msg.rest}
        </p>
        <Link href="/sale" className="mc-promo-bar__cta">
          Shop Sale
        </Link>
      </div>
      <div className="mc-promo-bar__dots" aria-hidden="true">
        {MESSAGES.map((_, i) => (
          <span
            key={i}
            className={
              i === index
                ? "mc-promo-bar__dot is-active"
                : "mc-promo-bar__dot"
            }
          />
        ))}
      </div>
    </div>
  );
}
