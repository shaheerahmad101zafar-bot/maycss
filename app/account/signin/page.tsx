import Link from "next/link";
import type { Metadata } from "next";
import SignInButtons from "@/components/auth/SignInButtons";
import { withCanonical } from "@/lib/seo/canonical";
import { getAppConfig } from "@/lib/app-config";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getAppConfig();
  return withCanonical(
    {
      title: `Sign in · ${cfg.siteName}`,
      description: `Sign in or create your ${cfg.siteName} account to view orders, save favorites, and check out faster.`,
    },
    "/account/signin",
    { noindex: true },
  );
}

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string; mode?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in is temporarily unavailable. Please try again in a moment.",
  AccessDenied: "Access was denied. Please try again.",
  Verification: "That sign-in link has expired. Request a new one.",
  CredentialsSignin: "Those credentials didn't work. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another provider. Sign in with that instead.",
  Default: "Something went wrong signing in. Please try again.",
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error, mode } = await searchParams;
  const cfg = await getAppConfig();
  const friendly = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  const initialMode = mode === "signup" ? "signup" : "signin";

  const providers = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
    email: true,
  };

  return (
    <section className="mc-auth">
      <div className="mc-auth__shell">
        <aside className="mc-auth__panel" aria-hidden="true">
          <div className="mc-auth__panel-inner">
            <p className="mc-auth__eyebrow">MAYCSS Account</p>
            <h2 className="mc-auth__panel-title">
              Curated fashion,
              <br />
              one account.
            </h2>
            <p className="mc-auth__panel-copy">
              Track orders, save favorites, and check out faster — with the same
              quiet luxury edit you shop on {cfg.siteName}.
            </p>
            <ul className="mc-auth__perks">
              <li>Order history &amp; tracking</li>
              <li>Faster checkout next time</li>
              <li>Early looks at private sales</li>
            </ul>
          </div>
        </aside>

        <div className="mc-auth__card">
          <div className="mc-auth__brand">
            <span className="mc-navbar__brand-mark">M</span>
            <div>
              <p className="mc-auth__brand-name">{cfg.siteName}</p>
              <p className="mc-auth__brand-sub">Member Access</p>
            </div>
          </div>

          {friendly && (
            <p className="mc-auth__error" role="alert">
              {friendly}
            </p>
          )}

          <SignInButtons
            callbackUrl={callbackUrl || "/account"}
            providers={providers}
            initialMode={initialMode}
          />

          <p className="mc-auth__foot">
            By continuing you agree to our{" "}
            <Link href="/terms-of-service">Terms</Link> and{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.{" "}
            <Link href="/">Return home</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
