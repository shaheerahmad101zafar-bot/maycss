import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";
import TextLogo from "./TextLogo";
import { getAppConfig } from "@/lib/app-config";
import { PageFactory } from "@/lib/pages";

const YEAR = new Date().getFullYear();

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

  const companyPages = pages.filter(
    (p) => p.footerColumn === "company" || !p.footerColumn,
  );
  const legalPages = pages.filter((p) => p.footerColumn === "legal");
  const activeSocials = SOCIAL_LABELS.filter(
    (s) => cfg.socials[s.key] && String(cfg.socials[s.key]).length > 0,
  );

  const tagline =
    cfg.tagline ||
    "Curated Luxury Fashion — women clothes, dresses, and denim online.";

  return (
    <footer className="mc-footer">
      <div className="mc-container mc-footer__inner">
        <div className="mc-footer__col">
          <TextLogo
            siteName={cfg.siteName}
            tagline={tagline}
            variant="footer"
          />
          <p className="mc-footer__tagline">{tagline}</p>
          <p className="mc-footer__tagline">
            Online fashion store for women clothes, dresses for women, jeans and
            denim, and fashion products — clothes on sale and friday sale edits
            shipped nationwide.
          </p>
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

        <nav className="mc-footer__col" aria-label="Company">
          <h3>Company</h3>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
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
          <p>&copy; {YEAR} {cfg.siteName}. All rights reserved.</p>
          <div className="mc-footer__bar-links">
            {legalPages.map((p) => (
              <Link key={p.id} href={`/${p.slug}`}>
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
