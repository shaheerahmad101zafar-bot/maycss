"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import NavAuth from "@/components/auth/NavAuth";
import TextLogo from "@/components/layout/TextLogo";
import type { ActiveLinkStyle, MenuAlignment } from "@/lib/app-config";
import { cx } from "@/lib/utils";

type NavbarLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type NavbarClientProps = {
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
  links: NavbarLink[];
  menuAlignment?: MenuAlignment;
  activeLinkStyle?: ActiveLinkStyle;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavbarClient({
  siteName,
  tagline,
  logoUrl,
  useTextLogo = true,
  links,
  menuAlignment = "justify-center",
  activeLinkStyle = { showUnderline: true, activeColor: "#b8956b" },
}: NavbarClientProps) {
  const pathname = usePathname();
  const { openDrawer, itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const { showUnderline, activeColor } = activeLinkStyle;
  const showTextLogo = useTextLogo || !logoUrl;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navStyle = {
    "--mc-nav-active-color": activeColor,
  } as React.CSSProperties;

  const linkClass = (active: boolean) =>
    cx(active && "is-active", showUnderline && "has-underline");

  const renderLinks = (className: string) =>
    links.map((l) => {
      const active = !l.external && isActive(pathname, l.href);
      if (l.external) {
        return (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {l.label}
          </a>
        );
      }
      return (
        <Link key={l.href} href={l.href} className={cx(className, linkClass(active))}>
          {l.label}
        </Link>
      );
    });

  return (
    <header
      className={cx(
        "mc-navbar mc-navbar--sticky mc-navbar--luxury",
        !showUnderline && "mc-navbar--no-underline",
        `mc-navbar--align-${menuAlignment.replace("justify-", "")}`,
      )}
      style={navStyle}
    >
      <div className="mc-container mc-navbar__shell">
        {/* Top row: hamburger · logo · actions */}
        <div className="mc-navbar__top">
          <div className="mc-navbar__left">
            <button
              type="button"
              className="mc-navbar__hamburger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? "\u2715" : "\u2630"}
            </button>
          </div>

          <div className="mc-navbar__brand">
            {showTextLogo ? (
              <TextLogo siteName={siteName} tagline={tagline} />
            ) : (
              <Link href="/" className="mc-navbar__logo-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="mc-navbar__logo-img"
                  width={120}
                  height={48}
                />
              </Link>
            )}
          </div>

          <div className="mc-navbar__actions">
            <NavAuth />
            <button
              type="button"
              className="mc-navbar__icon"
              aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
              onClick={openDrawer}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6 5 3H2" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {itemCount > 0 && (
                <span className="mc-navbar__badge">{itemCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop nav row — full width, admin-aligned */}
        <nav
          className={cx("mc-navbar__navrow", menuAlignment)}
          aria-label="Primary navigation"
        >
          {renderLinks("mc-navbar__link")}
        </nav>
      </div>

      <div
        className={cx("mc-mnav-backdrop", menuOpen && "is-open")}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <nav
        className={cx("mc-mnav", menuOpen && "is-open")}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        style={navStyle}
      >
        <div className="mc-mnav__header">
          <span className="mc-mnav__brand">{siteName}</span>
          <button
            type="button"
            className="mc-mnav__close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
        </div>
        <ul className="mc-mnav__links">
          {links.map((l) => {
            const active = !l.external && isActive(pathname, l.href);
            return (
              <li key={l.href}>
                {l.external ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} className={cx(active && "is-active")}>
                    {l.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
