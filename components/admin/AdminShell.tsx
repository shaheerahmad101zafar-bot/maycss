"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminNav from "./AdminNav";

/**
 * Wraps admin pages with the sidebar layout, but bows out on `/admin/login`
 * so the login page can render its own full-bleed layout.
 */
export default function AdminShell({
  children,
  siteName = "myacss",
}: {
  children: ReactNode;
  siteName?: string;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <div className="mc-admin">
      <AdminNav siteName={siteName} />
      <div className="mc-admin__main">{children}</div>
    </div>
  );
}
