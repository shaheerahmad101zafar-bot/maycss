import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth-config";
import {
  getPreferredHostname,
  isStoreHost,
} from "@/lib/site-url";

/**
 * Middleware responsibilities:
 *   1. Host canonicalization — www ↔ apex 301 onto the preferred public host
 *      (fixes GSC duplicate / "crawled – not indexed" noise from dual hosts).
 *   2. `/admin/*` (except `/admin/login`) requires the admin cookie.
 *   3. `/account/*` (except `/account/signin`) requires an Auth.js session.
 *
 * Admin gate stays a plain cookie check; account check uses Auth.js session
 * cookies so this can stay on the Edge runtime.
 */

const ADMIN_COOKIE = "mc-admin";

const AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasAuthSession(request: NextRequest): boolean {
  return AUTH_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

function requestHostname(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname;
  return raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
}

/** 301 onto preferred host when request hits the other store host. */
function hostCanonicalRedirect(request: NextRequest): NextResponse | null {
  const host = requestHostname(request);
  if (!host || !isStoreHost(host)) return null;

  const preferred = getPreferredHostname();
  if (host === preferred) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = preferred;
  url.port = "";
  return NextResponse.redirect(url, 301);
}

export function middleware(request: NextRequest) {
  const hostRedirect = hostCanonicalRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;

  // Admin gate
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    if (cookie !== getSessionToken()) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      if (pathname !== "/admin") url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Account gate
  if (pathname.startsWith("/account") && pathname !== "/account/signin") {
    if (!hasAuthSession(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/signin";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all app routes (incl. products/categories) for host redirects,
     * but skip hashed static assets and common file extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|txt|xml|csv|map)$).*)",
  ],
};
