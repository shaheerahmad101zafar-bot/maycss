"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SliderBlock } from "@/lib/blocks/types";
import { bannerImageUrl } from "@/lib/images/cdn-url";
import { bgImageStyle } from "@/lib/images/focus";

/**
 * BlockSlider — client-only rotating hero.
 *
 * Kept dumb on purpose: single interval, one CSS opacity crossfade.
 * If the admin wants a real Swiper, swap the file — the BlockRenderer
 * doesn't care what renders under `type === "slider"`.
 */
export default function BlockSlider({ block }: { block: SliderBlock }) {
  const [i, setI] = useState(0);
  const slides = block.slides.filter((s) => s.image);
  const count = slides.length;
  const autoplay = block.autoplay !== false;
  const interval = Math.max(1500, block.intervalMs ?? 5000);

  useEffect(() => {
    if (!autoplay || count < 2) return;
    const id = window.setInterval(
      () => setI((cur) => (cur + 1) % count),
      interval,
    );
    return () => window.clearInterval(id);
  }, [autoplay, count, interval]);

  if (count === 0) return null;

  return (
    <section className="mc-block mc-block--slider">
      <div className="mc-slider">
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`mc-slider__slide ${idx === i ? "is-active" : ""}`}
            style={bgImageStyle(bannerImageUrl(s.image), s.imageFocus)}
            aria-hidden={idx !== i}
          >
            <div className="mc-slider__overlay" />
            <div className="mc-slider__inner">
              {s.heading && <h2>{s.heading}</h2>}
              {s.body && <p>{s.body}</p>}
              {s.ctaLabel && s.ctaHref && (
                <Link href={s.ctaHref} className="mc-btn mc-btn--primary">
                  {s.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
        {count > 1 && (
          <div className="mc-slider__dots" role="tablist">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === i}
                aria-label={`Slide ${idx + 1}`}
                className={idx === i ? "is-active" : ""}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
