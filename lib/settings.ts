import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { DynamicPaymentConfig } from "./payments/dynamic";

/**
 * Manual (offline) payment method — Zelle / Venmo / CashApp etc.
 * Admin creates any number of these; each shows on checkout with a QR code
 * and an optional cart-total discount.
 */
export type ManualPaymentMethod = {
  id: string;
  name: string;
  qrCode: string;               // image URL
  discountPercent: number;      // 0–100
  instructions: string;         // "Send to alice@zelle" etc.
  enabled: boolean;
};

export type PaymentSettings = DynamicPaymentConfig & {
  /**
   * Registry provider id ("stripe", "ziina", …). Read at runtime by
   * MerchantAdapter to pick the matching PaymentStrategy. Defaults to
   * "stripe" for stores upgrading from the previous universal-adapter build.
   */
  provider?: string;
  manualMethods: ManualPaymentMethod[];
};

export type Settings = {
  payments: PaymentSettings;
};

const DEFAULT_SETTINGS: Settings = {
  payments: {
    provider: "stripe",
    merchantName: "",
    apiKey: "",
    secretKey: "",
    merchantId: "",
    environment: "sandbox",
    apiBaseUrl: "",
    webhookSecret: "",
    successRedirectPath: "",
    currency: "usd",
    enabled: false,
    manualMethods: [],
  },
};

const settingsFile = path.join(process.cwd(), "data", "settings.json");

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(settingsFile, "utf8");
    const parsed = JSON.parse(raw) as { payments?: Partial<PaymentSettings> };
    const p = parsed.payments ?? {};
    return {
      payments: {
        ...DEFAULT_SETTINGS.payments,
        ...p,
        manualMethods: Array.isArray(p.manualMethods) ? p.manualMethods : [],
      },
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT")
      return DEFAULT_SETTINGS;
    throw err;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await fs.mkdir(path.dirname(settingsFile), { recursive: true });
  await fs.writeFile(
    settingsFile,
    JSON.stringify(settings, null, 2) + "\n",
    "utf8",
  );
}

/** Enabled manual methods, safe to expose to checkout. */
export async function getEnabledManualMethods(): Promise<ManualPaymentMethod[]> {
  const s = await getSettings();
  return s.payments.manualMethods.filter((m) => m.enabled && m.name && m.qrCode);
}

/** Strip secrets before shipping to the browser. */
export function publicPaymentSettings(payments: PaymentSettings) {
  const { secretKey, apiKey, ...rest } = payments;
  return {
    ...rest,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : "",
    secretKeyPreview: secretKey ? "••••••••" : "",
  };
}
