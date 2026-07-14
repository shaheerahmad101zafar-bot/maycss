"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { cx } from "@/lib/utils";

export default function NavAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <button
        type="button"
        className="mc-navbar__icon"
        aria-label="Loading account"
        disabled
      >
        &#8231;
      </button>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/account/signin"
        className="mc-navbar__icon"
        aria-label="Sign in"
        title="Sign in"
      >
        &#128100;
      </Link>
    );
  }

  const initial = (session.user.name || session.user.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="mc-nav-auth" ref={ref}>
      <button
        type="button"
        className="mc-navbar__icon mc-nav-auth__button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={session.user.email || session.user.name || "Account"}
      >
        <span className="mc-nav-auth__avatar">{initial}</span>
      </button>
      {open && (
        <div className="mc-nav-auth__menu" role="menu">
          <div className="mc-nav-auth__id">
            <p>{session.user.name || "You"}</p>
            <p className="mc-nav-auth__email">{session.user.email}</p>
          </div>
          <Link href="/account" className="mc-nav-auth__link" role="menuitem">
            Account
          </Link>
          <Link
            href="/account/orders"
            className="mc-nav-auth__link"
            role="menuitem"
          >
            My orders
          </Link>
          <button
            type="button"
            className={cx("mc-nav-auth__link", "mc-nav-auth__link--danger")}
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
