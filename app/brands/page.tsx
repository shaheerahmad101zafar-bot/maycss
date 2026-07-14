import Link from "next/link";
import { getBrands } from "@/lib/data";

export const metadata = {
  title: "Brands · MayCSS",
  description: "The designers and makers behind MayCSS.",
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <section className="mc-section mc-category">
      <div className="mc-container">
        <header className="mc-category__header">
          <p className="mc-category__eyebrow">The Makers</p>
          <h1 className="mc-category__title">Brands We Love</h1>
          <p className="mc-category__subtitle">
            Independent designers and heritage houses, all in one place.
          </p>
        </header>

        <div className="mc-brand-grid">
          {brands.map(({ brand, sample, count }) => (
            <Link
              key={brand}
              href={`/brands/${encodeURIComponent(brand)}`}
              className="mc-brand-card"
            >
              <div className="mc-brand-card__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sample.image} alt={brand} loading="lazy" />
              </div>
              <div className="mc-brand-card__body">
                <h2 className="mc-brand-card__name">{brand}</h2>
                <p className="mc-brand-card__count">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
