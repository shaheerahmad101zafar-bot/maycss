import MenuBuilder from "@/components/admin/MenuBuilder";
import NavAppearanceForm from "@/components/admin/NavAppearanceForm";
import { getAppConfig } from "@/lib/app-config";
import { MenuFactory } from "@/lib/menus";
import Link from "next/link";

export const metadata = { title: "Menu Builder · Admin · MayCSS" };

export default async function AdminMenusPage() {
  const [links, cfg] = await Promise.all([
    MenuFactory.list(),
    getAppConfig(),
  ]);

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Menus &amp; Navigation</h1>
          <p>
            Manage header links below. Control alignment, active underline, and
            accent color in the appearance panel — changes apply instantly across
            the storefront.
          </p>
        </div>
        <Link href="/admin/settings/general" className="mc-btn mc-btn--ghost">
          Brand settings →
        </Link>
      </header>

      <div className="mc-admin__stat" style={{ marginBottom: 24 }}>
        <p className="mc-admin__stat-label">Navigation appearance</p>
        <NavAppearanceForm cfg={cfg} />
      </div>

      <MenuBuilder initial={links} />
    </section>
  );
}
