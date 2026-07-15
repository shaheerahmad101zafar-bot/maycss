import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth-config";

/**
 * Two guards in one middleware:
 *   - `/admin/*` (except `/admin/login`) requires the admin cookie.
 *   - `/account/*` (except `/account/signin`) requires an Auth.js session.
 *
 * We deliberately keep the admin gate as a plain cookie check (matches the
 * lightweight admin password model) and delegate the account check to the
 * session-token cookie that Auth.js sets. This keeps the middleware in the
 * Edge runtime without pulling in the full NextAuth handler.
 */

const ADMIN_COOKIE = "mc-admin";

// Auth.js session-cookie names (secure prefix used in production).
const AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasAuthSession(request: NextRequest): boolean {
  return AUTH_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function middleware(request: NextRequest) {
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
  matcher: ["/admin/:path*", "/account/:path*"],
};
