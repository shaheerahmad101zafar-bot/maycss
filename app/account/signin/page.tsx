import Link from "next/link";
import SignInButtons from "@/components/auth/SignInButtons";

export const metadata = {
  title: "Sign in · MayCSS",
  description:
    "Sign in or create your MayCSS account to view orders and manage details.",
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

// Map Auth.js error codes to friendly messages.
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
  const { callbackUrl, error } = await searchParams;
  const friendly = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  const providers = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
    // Always on — email creates / resumes a storefront account session.
    email: true,
  };

  return (
    <section className="mc-signin">
      <div className="mc-signin__card">
        <div className="mc-signin__brand">
          <span className="mc-navbar__brand-mark">M</span>
          <div>
            <p className="mc-signin__brand-name">MayCSS</p>
            <p className="mc-signin__brand-sub">Your Account</p>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="mc-signin__desc">
          Sign in or create an account to view orders, save favorites, and check
          out faster.
        </p>

        {friendly && (
          <p className="mc-signin__error" role="alert">
            {friendly}
          </p>
        )}

        <SignInButtons
          callbackUrl={callbackUrl || "/account"}
          providers={providers}
        />

        <p className="mc-signin__foot">
          New here? Enter your email above — we&apos;ll create your account
          automatically. <Link href="/">Return home</Link>
        </p>
      </div>
    </section>
  );
}
