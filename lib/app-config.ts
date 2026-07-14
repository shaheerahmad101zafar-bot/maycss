import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { CurrencyCode } from "./currency";

export type MenuAlignment = "justify-start" | "justify-center" | "justify-end";

export type ActiveLinkStyle = {
  showUnderline: boolean;
  activeColor: string;
};

export type AppConfig = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  logoHeight?: number;
  logoWidth?: number;
  logoBgColor?: string;
  /** When true, renders the text logo even if logoUrl is set. */
  useTextLogo?: boolean;
  contactEmail: string;
  supportPhone: string;
  currency: CurrencyCode;
  /** Flex justify rule applied to the desktop menu link row. */
  menuAlignment: MenuAlignment;
  /** Active route indicator styling for header navigation links. */
  activeLinkStyle: ActiveLinkStyle;
  socials: any;
  analytics: any;
};

const DEFAULT: AppConfig = {
  siteName: "MayCSS",
  tagline: "Premium fashion & lifestyle, curated.",
  logoUrl: "",
  logoHeight: 64,
  logoWidth: 0,
  logoBgColor: "#ffffff",
  useTextLogo: true,
  contactEmail: "hello@maycss.example",
  supportPhone: "",
  currency: "usd",
  menuAlignment: "justify-center",
  activeLinkStyle: {
    showUnderline: true,
    activeColor: "#b8956b",
  },
  socials: {},
  analytics: {},
};

const MENU_ALIGNMENTS: MenuAlignment[] = [
  "justify-start",
  "justify-center",
  "justify-end",
];

function normalizeMenuAlignment(value: unknown): MenuAlignment {
  if (
    typeof value === "string" &&
    MENU_ALIGNMENTS.includes(value as MenuAlignment)
  ) {
    return value as MenuAlignment;
  }
  return DEFAULT.menuAlignment;
}

function normalizeActiveLinkStyle(
  raw: Partial<ActiveLinkStyle> | undefined,
): ActiveLinkStyle {
  return {
    showUnderline: raw?.showUnderline !== false,
    activeColor:
      typeof raw?.activeColor === "string" && raw.activeColor.trim()
        ? raw.activeColor.trim()
        : DEFAULT.activeLinkStyle.activeColor,
  };
}

const file = path.join(process.cwd(), "data", "app-config.json");

export async function getAppConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...DEFAULT,
      ...parsed,
      useTextLogo: parsed.useTextLogo !== false,
      menuAlignment: normalizeMenuAlignment(parsed.menuAlignment),
      activeLinkStyle: normalizeActiveLinkStyle(parsed.activeLinkStyle),
    };
  } catch (err) {
    return DEFAULT;
  }
}

export async function saveAppConfig(cfg: AppConfig): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}