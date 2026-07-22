"use client";

import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Above-the-fold: eager + high priority. */
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
};

const OPTIMIZABLE_HOSTS = [
  "images.unsplash.com",
  "cdn.shopify.com",
  "assets.macys.com",
  "slimages.macysassets.com",
  "images.nordstrom.com",
  "m.media-amazon.com",
];

function canOptimize(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (OPTIMIZABLE_HOSTS.includes(hostname)) return true;
    if (hostname.endsWith(".cloudfront.net")) return true;
    if (hostname.endsWith(".public.blob.vercel-storage.com")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * next/image wrapper with AVIF/WebP via Next optimizer.
 * Falls back to a plain <img> for unknown hosts (CDN URL still WebP when available).
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  style,
}: Props) {
  const [failed, setFailed] = useState(false);
  const useNext = canOptimize(src) && !failed;

  if (!src) return null;

  if (!useNext) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cx(className)}
      sizes={sizes}
      priority={priority}
      quality={72}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
