"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mc-section" style={{ textAlign: "center", padding: "64px 20px" }}>
      <h1 className="mc-section-title">Something went wrong</h1>
      <p className="mc-section-header__lead" style={{ margin: "12px auto 24px", maxWidth: 420 }}>
        Please refresh the page. If this keeps happening, try again in a moment.
      </p>
      <button type="button" className="mc-btn mc-btn--primary" onClick={() => reset()}>
        Try again
      </button>
      {error?.digest ? (
        <p className="mc-admin__muted" style={{ marginTop: 16, fontSize: "0.75rem" }}>
          Ref: {error.digest}
        </p>
      ) : null}
    </section>
  );
}
