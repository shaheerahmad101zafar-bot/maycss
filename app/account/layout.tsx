import type { ReactNode } from "react";
import AccountShell from "@/components/auth/AccountShell";

export const metadata = {
  title: "Account · MayCSS",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
