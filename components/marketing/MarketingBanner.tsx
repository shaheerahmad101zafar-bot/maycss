"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { heroImageUrl } from "@/lib/images/cdn-url";
import { cx, type BannerSlide } from "@/lib/utils";

const MarketingCountdown = dynamic(() => import("./MarketingCountdown"), {
  ssr: false,
  loading: () => <div className="mc-countdown mc-countdown--skeleton" aria-hidden />,
});

interface MarketingBannerProps {
  slides: BannerSlide[];
  /** Delay before banner appears (ms). Default 5000. */
  showDelay?: number;
  /** Time each slide is visible when auto-rotating (ms). Default 5000. */
  slideInterval?: number;
  /** Countdown target date (ISO). Defaults to 48h from mount. */
  countdownTo?: string;
}

export default function MarketingBanner({
  slides,
  showDelay = 0,
  slideInterval = 5000,
  countdownTo,
}: MarketingBannerProps) {
  // SSR + first paint must show the hero when there is no delay.
  const [visible, setVisible] = useState(() => showDelay <= 0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mountedMedia, setMountedMedia] = useState(() => new Set<number>([0]));
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (showDelay <= 0) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(true), showDelay);
    return () => clearTimeout(t);
  }, [showDelay]);

  // Mount countdown after first paint so it never blocks LCP.
  useEffect(() => {
    if (!visible) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setShowCountdown(true), {
        timeout: 2000,
      });
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (n: number) => void })
          .cancelIdleCallback;
        cancel?.(id);
      };
    }
    const t = setTimeout(() => setShowCountdown(true), 800);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible || paused || slides.length <= 1) return;
    const i = setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      slideInterval,
    );
    return () => clearInterval(i);
  }, [visible, paused, slides.length, slideInterval]);

  useEffect(() => {
    setMountedMedia((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [active]);

  const goTo = useCallback((i: number) => setActive(i), []);
  const next = useCallback(
    () => setActive((prev) => (prev + 1) % slides.length),
    [slides.length],
  );
  const prev = useCallback(
    () => setActive((prev) => (prev - 1 + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, next, prev]);

  if (!visible || slides.length === 0) return null;

  return (
    <section
      className={cx("mc-banner", visible && "is-visible")}
      aria-label="Promotional banner"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mc-banner__slides">
        {slides.map((s, i) => {
          const isActive = i === active;
          const showMedia = Boolean(s.image) && (i === 0 || mountedMedia.has(i));
          const src = showMedia ? heroImageUrl(s.image) : "";
          return (
            <div
              key={s.id}
              className={cx("mc-banner__slide", isActive && "is-active")}
              aria-hidden={!isActive}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              {showMedia && src ? (
                // eslint-disable-next-line @next/next/no-img-element -- LCP hero; CDN-resized URL
                <img
                  className="mc-banner__media"
                  src={src}
                  alt=""
                  width={750}
                  height={420}
                  decoding={i === 0 ? "sync" : "async"}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  draggable={false}
                />
              ) : null}
              <div className="mc-banner__shade" aria-hidden />
              <div className="mc-banner__content">
                <span className="mc-banner__eyebrow">{s.eyebrow}</span>
                <h2 className="mc-banner__title">{s.title}</h2>
                <p className="mc-banner__subtitle">{s.subtitle}</p>

                {showCountdown ? (
                  <MarketingCountdown countdownTo={countdownTo} />
                ) : (
                  <div className="mc-countdown mc-countdown--skeleton" aria-hidden />
                )}

                <a href={s.ctaHref} className="mc-banner__cta">
                  {s.ctaLabel}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="mc-banner__arrow mc-banner__arrow--prev"
            aria-label="Previous slide"
            onClick={prev}
          >
            &#8592;
          </button>
          <button
            type="button"
            className="mc-banner__arrow mc-banner__arrow--next"
            aria-label="Next slide"
            onClick={next}
          >
            &#8594;
          </button>

          <div className="mc-banner__dots" role="tablist">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-label={`Go to slide ${i + 1}`}
                aria-selected={i === active}
                className={cx("mc-banner__dot", i === active && "is-active")}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
