"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
  providers: {
    google: boolean;
    facebook: boolean;
    devEmail: boolean;
  };
}

export default function SignInButtons({ callbackUrl = "/account", providers }: Props) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doSocial = async (provider: "google" | "facebook") => {
    setPending(provider);
    setError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError("Sign-in failed. Please try again.");
      setPending(null);
    }
  };

  const doDevEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending("dev-email");
    setError(null);
    const res = await signIn("dev-email", {
      email,
      callbackUrl,
      redirect: false,
    });
    if (res?.error) {
      setError("Could not sign in. " + res.error);
      setPending(null);
    } else if (res?.url) {
      window.location.href = res.url;
    } else {
      window.location.href = callbackUrl;
    }
  };

  const anySocial = providers.google || providers.facebook;

  return (
    <div className="mc-signin__methods">
      {providers.google && (
        <button
          type="button"
          className="mc-signin__provider"
          onClick={() => doSocial("google")}
          disabled={pending !== null}
        >
          <span className="mc-signin__provider-mark" aria-hidden>
            G
          </span>
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
      )}
      {providers.facebook && (
        <button
          type="button"
          className="mc-signin__provider mc-signin__provider--facebook"
          onClick={() => doSocial("facebook")}
          disabled={pending !== null}
        >
          <span className="mc-signin__provider-mark" aria-hidden>
            f
          </span>
          {pending === "facebook" ? "Redirecting…" : "Continue with Facebook"}
        </button>
      )}

      {providers.devEmail && anySocial && (
        <div className="mc-signin__divider">
          <span>or</span>
        </div>
      )}

      {providers.devEmail && (
        <form onSubmit={doDevEmail} className="mc-signin__email">
          <p className="mc-signin__note">
            Dev mode: sign in with just an email (no password).
          </p>
          <div className="mc-field">
            <label htmlFor="signinEmail">Email address</label>
            <input
              id="signinEmail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="mc-btn mc-btn--primary mc-btn--block"
            disabled={pending !== null}
          >
            {pending === "dev-email" ? "Signing in…" : "Continue"}
          </button>
        </form>
      )}

      {error && (
        <p className="mc-signin__error" role="alert">
          {error}
        </p>
      )}

      {!providers.google && !providers.facebook && !providers.devEmail && (
        <p className="mc-signin__empty">
          No sign-in providers are configured. Set{" "}
          <code>AUTH_GOOGLE_ID</code>/<code>AUTH_GOOGLE_SECRET</code> or run in
          development to enable dev email.
        </p>
      )}
    </div>
  );
}
