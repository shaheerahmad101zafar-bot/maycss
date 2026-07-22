import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/site-url";

/** Absolute public URL for a storefront path (leading slash optional). */
export function absoluteUrl(path = "/"): string {
  const origin = getSiteOrigin();
  if (!path || path === "/") return `${origin}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/** Path-only canonical (no query string) — pagination/search stay non-canonical. */
export function canonicalPath(path: string): string {
  if (!path || path === "/") return "/";
  const bare = path.split("?")[0]?.split("#")[0] || "/";
  return bare.startsWith("/") ? bare : `/${bare}`;
}

/**
 * Merge auto-canonical (+ optional OG url) into existing Metadata.
 * Explicit `seo.canonical` / alternates.canonical wins when already set.
 */
export function withCanonical(
  meta: Metadata,
  path: string,
  opts?: { noindex?: boolean },
): Metadata {
  const pathOnly = canonicalPath(path);
  const url = absoluteUrl(pathOnly);
  const existingCanonical =
    typeof meta.alternates?.canonical === "string"
      ? meta.alternates.canonical
      : undefined;

  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      canonical: existingCanonical || url,
    },
    openGraph: {
      ...((meta.openGraph as Record<string, unknown>) ?? {}),
      url,
    },
    ...(opts?.noindex
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
