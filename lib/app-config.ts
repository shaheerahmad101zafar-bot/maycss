import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { CurrencyCode } from "./currency";
import { readStoreJson, writeStoreJson } from "./storage/json-store";

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
  siteName: "myacss",
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

const file = "data/app-config.json";

async function loadAppConfig(fresh = false): Promise<AppConfig> {
  try {
    const parsed = await readStoreJson<Partial<AppConfig>>(file, DEFAULT, {
      bypassCache: fresh,
    });
    return {
      ...DEFAULT,
      ...parsed,
      useTextLogo: parsed.useTextLogo !== false,
      menuAlignment: normalizeMenuAlignment(parsed.menuAlignment),
      activeLinkStyle: normalizeActiveLinkStyle(parsed.activeLinkStyle),
    };
  } catch {
    return DEFAULT;
  }
}

const getAppConfigCached = unstable_cache(
  () => loadAppConfig(false),
  ["app-config-v1"],
  { revalidate: 60, tags: ["app-config"] },
);

export const getAppConfig = cache(async function getAppConfigInner(): Promise<AppConfig> {
  return getAppConfigCached();
});

export async function saveAppConfig(cfg: AppConfig): Promise<void> {
  await writeStoreJson(file, cfg);
}