/**
 * Multi-currency helpers — client-safe.
 *
 * The store's base currency lives in AppConfig.currency. All prices in
 * products.json are stored in the base currency. When the storefront needs
 * to display in another currency (e.g. AED for a UAE visitor), we run
 * `convertPrice` against the reference rates below.
 *
 * Reference rates are intentionally kept short and updated manually; for
 * production, wire a scheduled task to refresh them from an FX API
 * (openexchangerates.org, exchangerate.host, etc.) into
 * `data/currency-rates.json`.
 */

export type CurrencyCode =
  | "usd"
  | "eur"
  | "gbp"
  | "aed"
  | "aud"
  | "cad"
  | "pkr";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Rate relative to 1 USD. USD itself = 1. */
  rateToUsd: number;
  locale: string;
};

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  usd: { code: "usd", symbol: "$", label: "US Dollar", rateToUsd: 1, locale: "en-US" },
  eur: { code: "eur", symbol: "€", label: "Euro", rateToUsd: 0.92, locale: "en-IE" },
  gbp: { code: "gbp", symbol: "£", label: "British Pound", rateToUsd: 0.79, locale: "en-GB" },
  aed: { code: "aed", symbol: "AED ", label: "UAE Dirham", rateToUsd: 3.67, locale: "en-AE" },
  aud: { code: "aud", symbol: "A$", label: "Australian Dollar", rateToUsd: 1.52, locale: "en-AU" },
  cad: { code: "cad", symbol: "C$", label: "Canadian Dollar", rateToUsd: 1.36, locale: "en-CA" },
  pkr: { code: "pkr", symbol: "Rs ", label: "Pakistani Rupee", rateToUsd: 278, locale: "en-PK" },
};

export function normalizeCurrency(code: string | undefined): CurrencyCode {
  const c = (code ?? "usd").toLowerCase();
  return (c in CURRENCIES ? c : "usd") as CurrencyCode;
}

/** Convert an amount from one currency to another via USD. */
export function convertPrice(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return amount;
  const usd = amount / CURRENCIES[from].rateToUsd;
  const target = usd * CURRENCIES[to].rateToUsd;
  return Math.round(target * 100) / 100;
}

/**
 * Format a price with the correct symbol + locale. Falls back gracefully
 * if Intl.NumberFormat trips (Node with reduced ICU, older Safari, etc.).
 */
export function formatCurrency(
  amount: number,
  code: CurrencyCode = "usd",
): string {
  const c = CURRENCIES[code];
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${c.symbol}${amount.toFixed(2)}`;
  }
}
