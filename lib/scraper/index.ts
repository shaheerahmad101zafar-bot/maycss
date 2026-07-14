import "server-only";

import type { ScrapeResult, ScrapedProduct } from "./types";
import { scrapeFromJsonLd } from "./jsonld";
import { scrapeFromOpenGraph } from "./opengraph";
import { buildHumanHeaders, pickUserAgent } from "./headers";

export type { ScrapedProduct, ScrapeResult } from "./types";

/* -------------------------------------------------------------------------- */
/*  Timing helpers                                                            */
/* -------------------------------------------------------------------------- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const humanDelay = (min = 250, max = 900) =>
  sleep(min + Math.floor(Math.random() * (max - min)));

const backoff = (attempt: number) => {
  const base = 1000 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 500);
  return sleep(base + jitter);
};

/* -------------------------------------------------------------------------- */
/*  Proxy support (env-configured)                                            */
/* -------------------------------------------------------------------------- */

type ProxyConfig = { urls: string[]; cursor: number };
let proxyConfig: ProxyConfig | null | undefined;

function getProxyConfig(): ProxyConfig | null {
  if (proxyConfig !== undefined) return proxyConfig;
  const many = process.env.SCRAPER_PROXY_URLS;
  const one = process.env.SCRAPER_PROXY_URL;
  const list = many
    ? many.split(",").map((s) => s.trim()).filter(Boolean)
    : one
    ? [one.trim()]
    : [];
  proxyConfig = list.length > 0 ? { urls: list, cursor: 0 } : null;
  return proxyConfig;
}

function nextProxy(): string | undefined {
  const cfg = getProxyConfig();
  if (!cfg) return undefined;
  const url = cfg.urls[cfg.cursor % cfg.urls.length];
  cfg.cursor += 1;
  return url;
}

async function buildProxyDispatcher(): Promise<unknown | undefined> {
  const proxy = nextProxy();
  if (!proxy) return undefined;
  try {
    // Hide from the Next.js / Turbopack static analyser — `undici` is an
    // optional runtime dependency only used when the admin configures
    // SCRAPER_PROXY_URLS. If the package isn't installed, the try/catch
    // below falls through cleanly and the request goes direct.
    const dynImport = new Function("m", "return import(m)") as (
      m: string,
    ) => Promise<unknown>;
    const mod = (await dynImport("undici")) as {
      ProxyAgent?: new (u: string) => unknown;
      default?: { ProxyAgent?: new (u: string) => unknown };
    };
    const Ctor = mod.ProxyAgent ?? mod.default?.ProxyAgent;
    if (!Ctor) return undefined;
    return new Ctor(proxy);
  } catch {
    return undefined;
  }
}

/* -------------------------------------------------------------------------- */
/*  Direct fetch with human headers + retry + backoff                         */
/* -------------------------------------------------------------------------- */

const RETRIABLE_STATUS = new Set([403, 408, 425, 429, 500, 502, 503, 504]);
const JINA_TRIGGER = new Set([403, 429, 503]);
const MAX_DIRECT_ATTEMPTS = 3;

type FetchOk = { ok: true; html: string; via: "direct" | "jina" };
type FetchFail = { ok: false; error: string; status?: number };

async function fetchDirect(url: string): Promise<FetchOk | FetchFail> {
  let lastError = "Unknown error";
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt < MAX_DIRECT_ATTEMPTS; attempt += 1) {
    await humanDelay(attempt === 0 ? 100 : 300, attempt === 0 ? 400 : 900);
    const ua = pickUserAgent(attempt);
    const headers = buildHumanHeaders(url, ua);
    const dispatcher = await buildProxyDispatcher();

    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers,
        signal: AbortSignal.timeout(12_000),
        ...(dispatcher
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ dispatcher } as any)
          : {}),
      });
      if (res.ok) {
        return { ok: true, html: await res.text(), via: "direct" };
      }
      lastStatus = res.status;
      lastError = `${res.status} ${res.statusText}`;
      if (!RETRIABLE_STATUS.has(res.status)) {
        return { ok: false, error: lastError, status: res.status };
      }
      if (attempt < MAX_DIRECT_ATTEMPTS - 1) {
        console.warn(
          `[scraper] direct ${lastError} on attempt ${attempt + 1}/${MAX_DIRECT_ATTEMPTS} — retrying with fresh UA`,
        );
        await backoff(attempt);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "fetch failed";
      if (attempt < MAX_DIRECT_ATTEMPTS - 1) {
        console.warn(
          `[scraper] direct ${lastError} on attempt ${attempt + 1}/${MAX_DIRECT_ATTEMPTS} — retrying`,
        );
        await backoff(attempt);
      }
    }
  }
  return { ok: false, error: lastError, status: lastStatus };
}

/* -------------------------------------------------------------------------- */
/*  Jina Reader fallback (no signup, real headless browser server-side)       */
/* -------------------------------------------------------------------------- */

/**
 * When direct fetches get 403/429/503 from Akamai / Cloudflare / PerimeterX,
 * we route through https://r.jina.ai/{url}. It's a free public service that
 * renders the page in a real headless browser and returns the rendered HTML —
 * including the full <script type="application/ld+json"> we care about.
 *
 * Rate-limited (a few requests per minute) but works out of the box for
 * Macy's, Amazon, Nordstrom, Nike, and most other bot-hardened stores.
 * Set `JINA_API_KEY` in .env.local for higher rate limits + priority queue.
 */
async function fetchViaJina(url: string): Promise<FetchOk | FetchFail> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers: Record<string, string> = {
    Accept: "text/html",
    "X-Return-Format": "html",
  };
  if (process.env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  }

  try {
    const res = await fetch(jinaUrl, {
      headers,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Jina Reader returned ${res.status} ${res.statusText}`,
        status: res.status,
      };
    }
    const html = await res.text();
    if (!html || html.length < 200) {
      return { ok: false, error: "Jina Reader returned an empty response." };
    }
    return { ok: true, html, via: "jina" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Jina Reader request failed.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Parse merger                                                              */
/* -------------------------------------------------------------------------- */

function merge(
  a: Partial<ScrapedProduct>,
  b: Partial<ScrapedProduct>,
): Partial<ScrapedProduct> {
  const merged: Partial<ScrapedProduct> = { ...a };
  for (const key of Object.keys(b) as Array<keyof ScrapedProduct>) {
    if (key === "sources" || key === "images") continue;
    if (merged[key] == null || merged[key] === "") {
      // @ts-expect-error dynamic assignment
      merged[key] = b[key];
    }
  }
  const imgSet = new Set<string>();
  for (const v of a.images ?? []) imgSet.add(v);
  for (const v of b.images ?? []) imgSet.add(v);
  merged.images = Array.from(imgSet);
  merged.sources = Array.from(
    new Set([...(a.sources ?? []), ...(b.sources ?? [])]),
  ) as ScrapedProduct["sources"];
  return merged;
}

/* -------------------------------------------------------------------------- */
/*  Main entry                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Scrape a product from any public URL.
 *
 * Pipeline:
 *   1. Direct fetch with rotating Chrome UAs + full human header set +
 *      random 250–900ms delays + exponential retry on 403/429/5xx.
 *   2. If direct still returns 403/429/503 → automatic fallback to
 *      Jina Reader (real headless browser served publicly, no API key
 *      required for baseline use).
 *   3. Optional proxy rotation via SCRAPER_PROXY_URLS env var.
 *   4. Parse JSON-LD Product first, fall back to OpenGraph, merge results.
 */
export async function scrapeProductUrl(url: string): Promise<ScrapeResult> {
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, error: "URL must start with http(s)://" };
  }

  // 1) Try direct.
  let fetched: FetchOk | FetchFail = await fetchDirect(url);

  // 2) If direct got blocked, hand off to Jina Reader.
  if (!fetched.ok && fetched.status && JINA_TRIGGER.has(fetched.status)) {
    console.warn(
      `[scraper] direct blocked (${fetched.status}) — falling back to Jina Reader`,
    );
    const viaJina = await fetchViaJina(url);
    if (viaJina.ok) {
      fetched = viaJina;
    } else {
      // Report the more useful of the two errors.
      return {
        ok: false,
        error:
          `Direct fetch was blocked (${fetched.error}). Jina Reader fallback also failed: ${viaJina.error}. ` +
          `Set JINA_API_KEY in .env.local for a higher rate limit, or configure SCRAPER_PROXY_URLS with residential proxies.`,
      };
    }
  }

  if (!fetched.ok) {
    return { ok: false, error: `Could not fetch URL: ${fetched.error}` };
  }

  const { html, via } = fetched;
  const jsonld = scrapeFromJsonLd(html, url);
  const og = scrapeFromOpenGraph(html, url);

  const merged: Partial<ScrapedProduct> = jsonld
    ? og
      ? merge(jsonld, og)
      : jsonld
    : og ?? { sourceUrl: url, sources: [] };

  if (!merged.name) {
    return {
      ok: false,
      error:
        via === "jina"
          ? "Fetched the page via Jina Reader but couldn't find a product name in the markup. The source may not expose Schema.org Product — try a different URL."
          : "Reached the page but couldn't extract a product name. Try a different URL or install a headless-browser scraper.",
    };
  }

  if (via === "jina") {
    console.log(`[scraper] recovered ${merged.name} via Jina Reader fallback`);
  }

  return {
    ok: true,
    product: {
      sourceUrl: url,
      sources: merged.sources ?? [],
      ...merged,
    } as ScrapedProduct,
  };
}
