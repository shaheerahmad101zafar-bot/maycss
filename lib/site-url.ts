/**
 * Public storefront origin for sitemaps, canonicals, redirects, etc.
 * Prefer explicit env; always normalize to https + one preferred host.
 *
 * Production primary host is the apex domain (matches live canonicals / GMC).
 * Set NEXT_PUBLIC_SITE_URL to override (www or apex).
 */

/** Registrable production domain (with or without www). */
export const SITE_DOMAIN = "myacssstore.store";

/** Default when env is unset — must match the live preferred host. */
const DEFAULT_ORIGIN = `https://${SITE_DOMAIN}`;

function parseOriginCandidate(raw: string): URL | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

/** True when host is apex or www for our store domain. */
export function isStoreHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === SITE_DOMAIN || host === `www.${SITE_DOMAIN}`;
}

/**
 * Resolve the single preferred public origin (https, no trailing slash).
 * If env points at www or apex of our domain, that host wins; otherwise default apex.
 */
export function getSiteOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();

  if (fromEnv) {
    const parsed = parseOriginCandidate(fromEnv);
    if (parsed) {
      parsed.protocol = "https:";
      parsed.pathname = "";
      parsed.search = "";
      parsed.hash = "";
      // Keep explicit www vs apex from env for our domain.
      if (isStoreHost(parsed.hostname)) {
        return parsed.origin;
      }
      return parsed.origin;
    }
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercel) {
    const parsed = parseOriginCandidate(vercel);
    if (parsed) {
      parsed.protocol = "https:";
      // Preview deployments keep their Vercel host; production custom domain
      // collapses to the preferred store origin when it is our domain.
      if (isStoreHost(parsed.hostname)) {
        return DEFAULT_ORIGIN;
      }
      return parsed.origin;
    }
  }

  return DEFAULT_ORIGIN;
}

/** Hostname only (e.g. `myacssstore.store` or `www.myacssstore.store`). */
export function getPreferredHostname(): string {
  try {
    return new URL(getSiteOrigin()).hostname.toLowerCase();
  } catch {
    return SITE_DOMAIN;
  }
}

/**
 * Force an absolute URL onto the preferred store host when it belongs to us.
 * Leaves external URLs untouched. Strips query/hash for clean canonicals.
 */
export function canonicalizePublicUrl(urlOrPath: string): string {
  const origin = getSiteOrigin();
  if (!urlOrPath || urlOrPath === "/") return `${origin}/`;

  if (/^https?:\/\//i.test(urlOrPath)) {
    try {
      const u = new URL(urlOrPath);
      if (isStoreHost(u.hostname)) {
        const preferred = new URL(origin);
        u.protocol = "https:";
        u.hostname = preferred.hostname;
        u.search = "";
        u.hash = "";
        if (u.pathname !== "/" && u.pathname.endsWith("/")) {
          u.pathname = u.pathname.replace(/\/+$/, "");
        }
        return u.toString();
      }
      return urlOrPath;
    } catch {
      return urlOrPath;
    }
  }

  const path = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  const bare = path.split("?")[0]?.split("#")[0] || "/";
  if (bare === "/") return `${origin}/`;
  return `${origin}${bare}`;
}
