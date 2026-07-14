"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
import { logoutAction } from "@/app/admin/actions";

type NavLink = { href: string; label: string; exact?: boolean };

const LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/pages/home/edit", label: "Homepage" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/menus", label: "Menus" },
  { href: "/admin/chat", label: "Support Chat" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav({ siteName = "myacss" }: { siteName?: string }) {
  const pathname = usePathname();
  const brandMark = siteName.charAt(0).toLowerCase();
  const isActive = (l: NavLink) =>
    l.exact
      ? pathname === l.href
      : pathname === l.href || pathname.startsWith(l.href + "/");

  return (
    <aside className="mc-admin__nav" aria-label="Admin navigation">
      <div className="mc-admin__brand">
        <span className="mc-navbar__brand-mark">{brandMark}</span>
        <div>
          <p className="mc-admin__brand-name">{siteName}</p>
          <p className="mc-admin__brand-sub">Admin</p>
        </div>
      </div>

      <nav className="mc-admin__nav-links">
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

      <div className="mc-admin__nav-footer">
        <form action={logoutAction}>
          <button type="submit" className="mc-admin__logout">
            Sign out
          </button>
        </form>
        <Link href="/" className="mc-admin__back">
          &larr; Back to store
        </Link>
      </div>
    </aside>
  );
}
