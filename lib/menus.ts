import "server-only";

import { readStoreJson, writeStoreJson } from "./storage/json-store";

/**
 * MenuFactory — dynamic navigation.
 *
 * The admin manages every menu link from `/admin/menus` (Menu Builder):
 * add / rename / reorder / show-hide / mark external. Header + Footer
 * both read from here at request time, so no code changes ever ship
 * to change a link.
 */

export type MenuLocation = "header" | "footer";

export type MenuLink = {
  id: string;
  label: string;
  href: string;
  location: MenuLocation;
  order: number;
  visible: boolean;
  external?: boolean;
  /** Optional column key for footer menus. */
  column?: "shop" | "company" | "legal";
};

export type MenuSnapshot = {
  header: MenuLink[];
  footer: MenuLink[];
};

const file = "data/menus.json";

const DEFAULT: MenuLink[] = [
  { id: "hdr_home", label: "Home", href: "/", location: "header", order: 0, visible: false },
  { id: "hdr_shop", label: "Shop", href: "/shop", location: "header", order: 1, visible: true },
  { id: "hdr_new", label: "New", href: "/new", location: "header", order: 2, visible: true },
  { id: "hdr_sale", label: "Sale", href: "/sale", location: "header", order: 3, visible: true },
  { id: "hdr_about", label: "About", href: "/about", location: "header", order: 4, visible: true },
  { id: "hdr_contact", label: "Contact", href: "/contact", location: "header", order: 5, visible: true },
];

const rid = () =>
  `menu_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function readAll(): Promise<MenuLink[]> {
  try {
    const parsed = await readStoreJson<unknown>(file, DEFAULT);
    if (!Array.isArray(parsed)) return DEFAULT;
    return parsed
      .map((l) => normalizeLink(l))
      .filter((l): l is MenuLink => l !== null);
  } catch {
    return DEFAULT;
  }
}

async function writeAll(list: MenuLink[]): Promise<void> {
  await writeStoreJson(file, list);
}

function normalizeLink(raw: unknown): MenuLink | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const label = String(l.label ?? "").trim();
  const href = String(l.href ?? "").trim();
  if (!label || !href) return null;
  return {
    id: typeof l.id === "string" && l.id ? l.id : rid(),
    label,
    href,
    location: l.location === "footer" ? "footer" : "header",
    order: typeof l.order === "number" ? l.order : 0,
    visible: l.visible !== false,
    external: Boolean(l.external),
    column:
      l.column === "shop" || l.column === "company" || l.column === "legal"
        ? l.column
        : undefined,
  };
}

export const MenuFactory = {
  async list(): Promise<MenuLink[]> {
    return readAll();
  },

  /** Snapshot used by Navbar / Footer — visible + sorted. */
  async snapshot(): Promise<MenuSnapshot> {
    const all = await readAll();
    const sort = (a: MenuLink, b: MenuLink) => a.order - b.order;
    return {
      header: all
        .filter((l) => l.location === "header" && l.visible)
        .sort(sort),
      footer: all
        .filter((l) => l.location === "footer" && l.visible)
        .sort(sort),
    };
  },

  async replaceAll(links: MenuLink[]): Promise<void> {
    const clean = links
      .map((l, i) => ({ ...l, id: l.id || rid(), order: i }))
      .filter((l) => l.label && l.href);
    await writeAll(clean);
  },

  async add(input: Omit<MenuLink, "id" | "order">): Promise<MenuLink> {
    const all = await readAll();
    const order = Math.max(
      -1,
      ...all.filter((l) => l.location === input.location).map((l) => l.order),
    );
    const link: MenuLink = { id: rid(), order: order + 1, ...input };
    await writeAll([...all, link]);
    return link;
  },

  async remove(id: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((l) => l.id !== id));
  },
};
