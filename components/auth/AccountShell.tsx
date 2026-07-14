"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { cx } from "@/lib/utils";

type NavLink = { href: string; label: string; exact?: boolean };
const LINKS: NavLink[] = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
];

/**
 * The `/account/signin` route also lives under this segment; render it
 * bare (no sidebar) so the sign-in card can breathe.
 */
export default function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/account/signin") return <>{children}</>;

  const isActive = (l: NavLink) =>
    l.exact
      ? pathname === l.href
      : pathname === l.href || pathname.startsWith(l.href + "/");

  return (
    <div className="mc-account">
      <aside className="mc-account__nav" aria-label="Account navigation">
        <div className="mc-account__brand">
          <span className="mc-navbar__brand-mark">M</span>
          <div>
            <p className="mc-account__brand-name">Your Account</p>
            <p className="mc-account__brand-sub">MayCSS</p>
          </div>
        </div>

        <nav className="mc-account__nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(isActive(l) && "is-active")}
              aria-current={isActive(l) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mc-account__nav-footer">
          <button
            type="button"
            className="mc-account__logout"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
          <Link href="/" className="mc-account__back">
            &larr; Back to store
          </Link>
        </div>
      </aside>
      <div className="mc-account__main">{children}</div>
    </div>
  );
}
