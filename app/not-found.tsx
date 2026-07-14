import Link from "next/link";

export const metadata = {
  title: "Page not found · MayCSS",
};

export default function NotFound() {
  return (
    <section className="mc-notfound">
      <div className="mc-notfound__inner">
        <p className="mc-notfound__code" aria-hidden>
          404
        </p>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="mc-notfound__desc">
          The link may have moved, or the piece is no longer part of our
          collection.
        </p>
        <div className="mc-notfound__actions">
          <Link href="/" className="mc-btn mc-btn--primary">
            Back to Home
          </Link>
          <Link href="/shop" className="mc-btn mc-btn--ghost">
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
}
