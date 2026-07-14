import Script from "next/script";
import type { AppConfig } from "@/lib/app-config";

/**
 * Analytics — drop-in tracking loader.
 *
 * Include as high up in the tree as possible (root layout). Individual
 * scripts render only when their id/domain is set in AppConfig →
 * Admin → Settings → General. Uses `next/script strategy="afterInteractive"`
 * so nothing blocks LCP.
 *
 * Supported:
 *   • Google Analytics 4 (measurement id starting with "G-")
 *   • Meta / Facebook Pixel (numeric pixel id)
 *   • Plausible (privacy-friendly, cookieless — pass your domain)
 */
export default function Analytics({ config }: { config: AppConfig["analytics"] }) {
  const ga = config.googleAnalyticsId?.trim();
  const pixel = config.metaPixelId?.trim();
  const plausible = config.plausibleDomain?.trim();

  if (!ga && !pixel && !plausible) return null;

  return (
    <>
      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {pixel ? (
        <>
          <Script id="fb-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixel}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/*
             * Meta Pixel noscript fallback. Must be a raw <img> — next/image
             * doesn't work inside <noscript> because it needs JS to hydrate.
             * eslint-disable-next-line @next/next/no-img-element
             */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {plausible ? (
        <Script
          defer
          data-domain={plausible}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}

/**
 * Public helper — call from anywhere on the client to record a custom event.
 * All three providers get pinged; each no-ops if not initialised.
 */
export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (event: string, name: string, props: Record<string, unknown>) => void;
    fbq?: (event: string, name: string, props: Record<string, unknown>) => void;
    plausible?: (name: string, opts?: { props: Record<string, unknown> }) => void;
  };
  try {
    w.gtag?.("event", name, properties);
    w.fbq?.("trackCustom", name, properties);
    w.plausible?.(name, { props: properties });
  } catch (err) {
    console.warn("[analytics] event failed", err);
  }
}
