import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getAppConfig } from "@/lib/app-config";
import { PaymentProviderRegistry } from "@/lib/payments/registry";
import { PageFactory } from "@/lib/pages";
import { CURRENCIES } from "@/lib/currency";

export const metadata = { title: "Settings · Admin · MayCSS" };

/**
 * Admin Settings — binds AppConfig + PaymentSettings + CMS content blocks
 * into a single at-a-glance dashboard. Each row shows a summary of live
 * config plus a CTA to the deep-edit page. Pattern: dashboards are for
 * scanning; forms live one click deeper.
 */
export default async function AdminSettingsHome() {
  const [settings, cfg, pages] = await Promise.all([
    getSettings(),
    getAppConfig(),
    PageFactory.list(),
  ]);

  const providerId = settings.payments.provider ?? "stripe";
  const strategy = PaymentProviderRegistry.get(providerId);
  const providerLabel = strategy?.label ?? providerId;
  const activeManual = settings.payments.manualMethods.filter((m) => m.enabled)
    .length;
  const cardEnabled = settings.payments.enabled;
  const currency = CURRENCIES[cfg.currency]?.label ?? "US Dollar";
  const analyticsOn =
    !!cfg.analytics.googleAnalyticsId ||
    !!cfg.analytics.metaPixelId ||
    !!cfg.analytics.plausibleDomain;

  const rows = [
    {
      href: "/admin/settings/general",
      title: "General",
      status: cfg.siteName ? "Configured" : "Not set",
      body: `Site: ${cfg.siteName || "—"} · Logo: ${cfg.logoUrl ? "set" : "text fallback"} · Currency: ${currency} · Analytics: ${
        analyticsOn ? "on" : "off"
      }`,
      cta: "Edit brand & analytics →",
    },
    {
      href: "/admin/menus",
      title: "Menus",
      status: "Live",
      body: "Add, rename, reorder, or hide any Header / Footer link.",
      cta: "Open Menu Builder →",
    },
    {
      href: "/admin/settings/payments",
      title: "Payments",
      status: cardEnabled ? `${providerLabel} — live` : "Card gateway disabled",
      body: cardEnabled
        ? `Charging in ${(settings.payments.currency ?? "usd").toUpperCase()} · ${
            settings.payments.environment
          } mode · ${activeManual} manual method${activeManual === 1 ? "" : "s"} enabled`
        : `${activeManual} manual method${activeManual === 1 ? "" : "s"} enabled`,
      cta: "Manage providers →",
    },
    {
      href: "/admin/pages",
      title: "Content (CMS)",
      status: `${pages.length} page${pages.length === 1 ? "" : "s"}`,
      body: `${pages.filter((p) => p.published).length} published · 10 block types with SEO auditor + AI Suggest`,
      cta: "Open CMS →",
    },
    {
      href: "/admin/chat",
      title: "Support Chat",
      status: "Polling transport",
      body: "SupportEngine is transport-agnostic — swap for Socket.io by calling configureSupport()",
      cta: "Open inbox →",
    },
  ];

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Settings</h1>
          <p>
            Configure how your store operates. Every card below is bound to
            live config on <code>data/*.json</code>; changes propagate on save.
          </p>
        </div>
      </header>

      <div className="mc-admin__stats">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="mc-admin__stat">
            <p className="mc-admin__stat-label">{r.title}</p>
            <p
              className="mc-admin__stat-value"
              style={{ fontSize: "1.05rem", lineHeight: 1.35 }}
            >
              {r.status}
            </p>
            <p className="mc-admin__hint" style={{ marginTop: 6 }}>
              {r.body}
            </p>
            <span className="mc-admin__stat-cta">{r.cta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
