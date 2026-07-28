import type { Metadata } from "next";
import { canonicalizePublicUrl, getSiteOrigin } from "@/lib/site-url";

/** Absolute public URL for a storefront path (leading slash optional). */
export function absoluteUrl(path = "/"): string {
  return canonicalizePublicUrl(path || "/");
}

/** Path-only canonical (no query string) — pagination/search stay non-canonical. */
export function canonicalPath(path: string): string {
  if (!path || path === "/") return "/";
  const bare = path.split("?")[0]?.split("#")[0] || "/";
  return bare.startsWith("/") ? bare : `/${bare}`;
}

/**
 * Merge auto-canonical (+ optional OG url) into existing Metadata.
 * Explicit `seo.canonical` / alternates.canonical is kept but host-normalized
 * onto the preferred public origin so www/apex never diverge.
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

  const canonical = existingCanonical
    ? canonicalizePublicUrl(existingCanonical)
    : url;

  return {
    ...meta,
    metadataBase: meta.metadataBase ?? new URL(getSiteOrigin()),
    alternates: {
      ...meta.alternates,
      canonical,
    },
    openGraph: {
      ...((meta.openGraph as Record<string, unknown>) ?? {}),
      url: canonical,
    },
    ...(opts?.noindex
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
