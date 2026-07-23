import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";
import TextLogo from "./TextLogo";
import { getAppConfig } from "@/lib/app-config";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { PageFactory } from "@/lib/pages";

const YEAR = new Date().getFullYear();

/** Always-visible GMC trust links — independent of CMS edits. */
const TRUST_POLICY_LINKS = [
  { href: "/contact", label: "Contact Us" },
  { href: "/refund-policy", label: "Refund & Return Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
] as const;

const SOCIAL_LABELS: Array<{ key: string; label: string; icon: string }> = [
  { key: "facebook", label: "Facebook", icon: "f" },
  { key: "instagram", label: "Instagram", icon: "IG" },
  { key: "twitter", label: "Twitter / X", icon: "X" },
  { key: "tiktok", label: "TikTok", icon: "TT" },
  { key: "youtube", label: "YouTube", icon: "YT" },
  { key: "linkedin", label: "LinkedIn", icon: "IN" },
];

export default async function Footer() {
  const [cfg, pages] = await Promise.all([
    getAppConfig(),
    PageFactory.listFooterLinks(),
  ]);

  const trustHrefs = new Set<string>(TRUST_POLICY_LINKS.map((l) => l.href));
  const companyPages = pages.filter((p) => {
    if (!(p.footerColumn === "company" || !p.footerColumn)) return false;
    // Avoid duplicating Contact / About already listed or covered by trust links.
    if (p.slug === "contact" || p.slug === "about") return false;
    if (trustHrefs.has(`/${p.slug}`)) return false;
    return true;
  });

  const activeSocials = SOCIAL_LABELS.filter(
    (s) => cfg.socials[s.key] && String(cfg.socials[s.key]).length > 0,
  );

  const tagline =
    cfg.tagline ||
    "Curated Luxury Fashion — women clothes, dresses, and denim online.";

  const email = cfg.contactEmail || MAYCSS_BUSINESS.supportEmail;
  const phone = cfg.supportPhone || MAYCSS_BUSINESS.supportPhone;
  const address =
    cfg.businessAddress || MAYCSS_BUSINESS.addressMultiline;
  const phoneTel = phone.replace(/[^\d+]/g, "") || MAYCSS_BUSINESS.supportPhoneTel;
  const storeName = cfg.siteName || MAYCSS_BUSINESS.storeName;

  return (
    <footer className="mc-footer">
      <div className="mc-container mc-footer__inner">
        <div className="mc-footer__col">
          <TextLogo
            siteName={storeName}
            tagline={tagline}
            variant="footer"
          />
          <p className="mc-footer__tagline">{tagline}</p>
          <address className="mc-footer__contact">
            <strong>Contact Us — {storeName}</strong>
            <br />
            {address.split("\n").map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            <a href={`mailto:${email}`}>{email}</a>
            <br />
            <a href={`tel:${phoneTel}`}>{phone}</a>
          </address>
          {activeSocials.length > 0 && (
            <div className="mc-footer__socials" aria-label="Social media">
              {activeSocials.map((s) => (
                <a
                  key={s.key}
                  href={String(cfg.socials[s.key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        <nav className="mc-footer__col" aria-label="Shop">
          <h3>Shop</h3>
          <ul>
            <li><Link href="/shop">Shop All</Link></li>
            <li><Link href="/category/womens-clothing">Women&apos;s Clothing</Link></li>
            <li><Link href="/category/womens-dresses">Dresses</Link></li>
            <li><Link href="/category/womens-jeans-denim">Jeans &amp; Denim</Link></li>
            <li><Link href="/sale">Sale</Link></li>
            <li><Link href="/new">New Arrivals</Link></li>
          </ul>
        </nav>

        <nav className="mc-footer__col" aria-label="Customer care">
          <h3>Customer care</h3>
          <ul>
            <li><Link href="/about">About</Link></li>
            {TRUST_POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            {companyPages.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mc-footer__col">
          <h3>Stay in the loop</h3>
          <p className="mc-footer__tagline">
            First looks at new arrivals and members-only offers.
          </p>
          <NewsletterSignup />
        </div>
      </div>

      <div className="mc-footer__bar">
        <div className="mc-container mc-footer__bar-inner">
          <p>&copy; {YEAR} {storeName}. All rights reserved.</p>
          <div className="mc-footer__bar-links">
            {TRUST_POLICY_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
