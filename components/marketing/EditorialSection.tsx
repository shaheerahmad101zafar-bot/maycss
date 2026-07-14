import Link from "next/link";

export default function EditorialSection() {
  return (
    <section className="mc-editorial">
      <div className="mc-container mc-editorial__grid">
        <div className="mc-editorial__copy">
          <p className="mc-editorial__eyebrow">The MayCSS Edit</p>
          <h2 className="mc-editorial__title">
            Where Craft Meets Contemporary Style
          </h2>
          <p className="mc-editorial__body">
            We partner with independent ateliers and heritage maisons to bring
            you a considered collection — investment pieces designed to endure
            beyond the season. Each edit is curated for quality, provenance, and
            quiet luxury.
          </p>
          <Link href="/about" className="mc-btn mc-btn--outline">
            Our Story
          </Link>
        </div>
        <div className="mc-editorial__visual" aria-hidden>
          <div className="mc-editorial__frame">
            <span className="mc-editorial__label">Est. 2026</span>
            <p>Premium fashion, thoughtfully sourced.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
