"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, type BannerSlide } from "@/lib/utils";

interface MarketingBannerProps {
  slides: BannerSlide[];
  /** Delay before banner appears (ms). Default 5000. */
  showDelay?: number;
  /** Time each slide is visible when auto-rotating (ms). Default 5000. */
  slideInterval?: number;
  /** Countdown target date (ISO). Defaults to 48h from mount. */
  countdownTo?: string;
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function MarketingBanner({
  slides,
  showDelay = 0,
  slideInterval = 5000,
  countdownTo,
}: MarketingBannerProps) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const targetTs = useMemo(() => {
    if (countdownTo) {
      const t = new Date(countdownTo).getTime();
      if (!Number.isNaN(t)) return t;
    }
    return Date.now() + 48 * 60 * 60 * 1000;
  }, [countdownTo]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetTs));

  // 5-second reveal delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), showDelay);
    return () => clearTimeout(t);
  }, [showDelay]);

  // Real-time countdown, 1s tick
  useEffect(() => {
    if (!visible) return;
    setTimeLeft(getTimeLeft(targetTs));
    const i = setInterval(() => setTimeLeft(getTimeLeft(targetTs)), 1000);
    return () => clearInterval(i);
  }, [visible, targetTs]);

  // Slider auto-rotate (pauses on hover / focus)
  useEffect(() => {
    if (!visible || paused || slides.length <= 1) return;
    const i = setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      slideInterval,
    );
    return () => clearInterval(i);
  }, [visible, paused, slides.length, slideInterval]);

  const goTo = useCallback((i: number) => setActive(i), []);
  const next = useCallback(
    () => setActive((prev) => (prev + 1) % slides.length),
    [slides.length],
  );
  const prev = useCallback(
    () => setActive((prev) => (prev - 1 + slides.length) % slides.length),
    [slides.length],
  );

  // Keyboard navigation
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
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cx("mc-banner__slide", i === active && "is-active")}
            aria-hidden={i !== active}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            style={
              s.image
                ? {
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.35)), url(${s.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <span className="mc-banner__eyebrow">{s.eyebrow}</span>
            <h2 className="mc-banner__title">{s.title}</h2>
            <p className="mc-banner__subtitle">{s.subtitle}</p>

            <div className="mc-countdown" aria-label="Offer ends in">
              <div className="mc-countdown__unit">
                <span className="mc-countdown__value">{pad(timeLeft.days)}</span>
                <span className="mc-countdown__label">Days</span>
              </div>
              <div className="mc-countdown__unit">
                <span className="mc-countdown__value">{pad(timeLeft.hours)}</span>
                <span className="mc-countdown__label">Hrs</span>
              </div>
              <div className="mc-countdown__unit">
                <span className="mc-countdown__value">{pad(timeLeft.minutes)}</span>
                <span className="mc-countdown__label">Min</span>
              </div>
              <div className="mc-countdown__unit">
                <span className="mc-countdown__value">{pad(timeLeft.seconds)}</span>
                <span className="mc-countdown__label">Sec</span>
              </div>
            </div>

            <a href={s.ctaHref} className="mc-banner__cta">
              {s.ctaLabel}
            </a>
          </div>
        ))}
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
