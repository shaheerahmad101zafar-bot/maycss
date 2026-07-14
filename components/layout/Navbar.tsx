import { getAppConfig } from "@/lib/app-config";
import { MenuFactory } from "@/lib/menus";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const [cfg, menus] = await Promise.all([
    getAppConfig(),
    MenuFactory.snapshot(),
  ]);

  const visibleLinks = menus.header
    .filter((l) => l.visible !== false)
    .map((l) => ({
      label: l.label,
      href: l.href,
      external: !!l.external,
    }));

  return (
    <NavbarClient
      siteName={cfg.siteName}
      tagline={cfg.tagline || "Curated luxury fashion"}
      logoUrl={cfg.logoUrl}
      useTextLogo={cfg.useTextLogo ?? true}
      menuAlignment={cfg.menuAlignment}
      activeLinkStyle={cfg.activeLinkStyle}
      links={visibleLinks}
    />
  );
}
