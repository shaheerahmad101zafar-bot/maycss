"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

function isSaleLink(href: string, label: string) {
  return href.includes("/sale") || /sale|black friday/i.test(label);
}

export default function NavbarClient({
  siteName,
  tagline,
  logoUrl,
  useTextLogo = true,
  links,
  menuAlignment = "justify-center",
  activeLinkStyle = { showUnderline: true, activeColor: "#e21a2c" },
}: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openDrawer, itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  const linkClass = (active: boolean, sale: boolean) =>
    cx(
      active && "is-active",
      showUnderline && "has-underline",
      sale && "is-sale",
    );

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setMenuOpen(false);
  };

  const renderLinks = (className: string) =>
    links.map((l) => {
      const active = !l.external && isActive(pathname, l.href);
      const sale = isSaleLink(l.href, l.label);
      if (l.external) {
        return (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(className, sale && "is-sale")}
          >
            {l.label}
          </a>
        );
      }
      return (
        <Link
          key={l.href}
          href={l.href}
          className={cx(className, linkClass(active, sale))}
        >
          {l.label}
        </Link>
      );
    });

  return (
    <header
      className={cx(
        "mc-navbar mc-navbar--sticky mc-navbar--dept",
        !showUnderline && "mc-navbar--no-underline",
        `mc-navbar--align-${menuAlignment.replace("justify-", "")}`,
      )}
      style={navStyle}
    >
      <div className="mc-container mc-navbar__shell">
        {/* Macy's-style top: logo · search · actions */}
        <div className="mc-navbar__dept-top">
          <div className="mc-navbar__dept-brand">
            <button
              type="button"
              className="mc-navbar__hamburger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? "\u2715" : "\u2630"}
            </button>
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

          <form
            className="mc-navbar__search"
            role="search"
            onSubmit={onSearch}
          >
            <label className="sr-only" htmlFor="mc-nav-search">
              Search
            </label>
            <input
              id="mc-nav-search"
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for today?"
              autoComplete="off"
            />
            <button type="submit" aria-label="Search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>

          <div className="mc-navbar__actions">
            <NavAuth />
            <button
              type="button"
              className="mc-navbar__icon"
              aria-label={`Open bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
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

        <nav
          className={cx("mc-navbar__navrow", "mc-navbar__navrow--dept", menuAlignment)}
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
        <form className="mc-mnav__search" onSubmit={onSearch}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
          />
          <button type="submit">Search</button>
        </form>
        <ul className="mc-mnav__links">
          {links.map((l) => {
            const active = !l.external && isActive(pathname, l.href);
            const sale = isSaleLink(l.href, l.label);
            return (
              <li key={l.href}>
                {l.external ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ) : (
                  <Link
                    href={l.href}
                    className={cx(active && "is-active", sale && "is-sale")}
                  >
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
