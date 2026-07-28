import type { ReactNode } from "react";
import type { Metadata } from "next";
import AccountShell from "@/components/auth/AccountShell";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Account · MayCSS",
  },
  "/account",
  { noindex: true },
);

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
