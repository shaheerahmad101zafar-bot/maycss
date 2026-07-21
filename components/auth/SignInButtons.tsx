"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
  providers: {
    google: boolean;
    facebook: boolean;
    email: boolean;
  };
}

export default function SignInButtons({
  callbackUrl = "/account",
  providers,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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

  const doEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending("email");
    setError(null);
    const res = await signIn("email", {
      email,
      name: name.trim() || undefined,
      callbackUrl,
      redirect: false,
    });
    if (res?.error) {
      setError("Could not sign in. Please try again.");
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

      {providers.email && anySocial && (
        <div className="mc-signin__divider">
          <span>or</span>
        </div>
      )}

      {providers.email && (
        <form onSubmit={doEmail} className="mc-signin__email">
          <div className="mc-field">
            <label htmlFor="signinName">Name (optional)</label>
            <input
              id="signinName"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
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
            {pending === "email" ? "Signing in…" : "Sign in / Create account"}
          </button>
        </form>
      )}

      {error && (
        <p className="mc-signin__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
