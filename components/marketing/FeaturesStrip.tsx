import type { FeatureItem } from "@/lib/blocks/types";
import { MAYCSS_BUSINESS } from "@/lib/business";

export const DEFAULT_FEATURES: FeatureItem[] = [
  {
    title: "Complimentary Shipping",
    body: "On all orders over $75, delivered with care.",
  },
  {
    title: "Authenticity Guaranteed",
    body: "Every piece sourced from verified partners.",
  },
  {
    title: "Personal Styling",
    body: "Book a complimentary consultation with our team.",
  },
  {
    title: "Easy Returns",
    body: `${MAYCSS_BUSINESS.returnWindowDays}-day returns on unworn items, hassle-free.`,
  },
];

type Props = {
  items?: FeatureItem[];
};

export default function FeaturesStrip({ items = DEFAULT_FEATURES }: Props) {
  const visible = items.filter((f) => f.title.trim() || f.body.trim());
  if (visible.length === 0) return null;

  return (
    <section className="mc-features" aria-label="Store benefits">
      <div className="mc-container mc-features__grid">
        {visible.map((f, i) => (
          <article key={`${f.title}-${i}`} className="mc-features__item">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
