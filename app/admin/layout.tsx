import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAppConfig } from "@/lib/app-config";
import "@/styles/maycss/admin.css";

export async function generateMetadata() {
  const cfg = await getAppConfig();
  return { title: `Admin · ${cfg.siteName}` };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cfg = await getAppConfig();
  return <AdminShell siteName={cfg.siteName}>{children}</AdminShell>;
}
