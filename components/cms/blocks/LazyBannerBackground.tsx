"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { bannerImageUrl } from "@/lib/images/cdn-url";
import {
  bgImageStyle,
  overlayOpacityStyle,
  type ImageFocus,
} from "@/lib/images/focus";

/**
 * Promo banner background — deferred until near viewport so it never
 * competes with the LCP hero image.
 */
export default function LazyBannerBackground({
  image,
  imageFocus,
  overlayStrength,
  children,
  className,
  ariaLabel,
}: {
  image: string;
  imageFocus?: ImageFocus;
  overlayStrength?: number;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [showBg, setShowBg] = useState(false);
  const src = bannerImageUrl(image);
  const overlayStyle = overlayOpacityStyle(overlayStrength);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShowBg(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShowBg(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={className}
      aria-label={ariaLabel}
      style={{
        ...(showBg ? bgImageStyle(src, imageFocus) : undefined),
        backgroundColor: "#1a1210",
        ...overlayStyle,
      }}
    >
      {children}
    </section>
  );
}
