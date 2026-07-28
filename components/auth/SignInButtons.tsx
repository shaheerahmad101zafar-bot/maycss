"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

interface Props {
  callbackUrl?: string;
  initialMode?: "signin" | "signup";
  providers: {
    google: boolean;
    facebook: boolean;
    email: boolean;
  };
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.5 2C3.5 20.1 7.4 22.5 12 22.5c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.9 7.1C3.3 8.3 3 9.6 3 11s.3 2.7.9 3.9l3.3-2.6c-.2-.6-.3-1.2-.3-1.3 0-.5.1-1 .3-1.4L3.9 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.5c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.5 14.7 1.5 12 1.5 7.4 1.5 3.5 3.9 1.9 7.1l3.3 2.6C6.9 7.4 9.2 5.5 12 5.5z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.2h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"
      />
    </svg>
  );
}

export default function SignInButtons({
  callbackUrl = "/account",
  providers,
  initialMode = "signin",
}: Props) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

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
    if (isSignup && !name.trim()) {
      setError("Please enter your name to create an account.");
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
      setError(
        isSignup
          ? "Could not create your account. Please try again."
          : "Could not sign in. Please try again.",
      );
      setPending(null);
    } else if (res?.url) {
      window.location.href = res.url;
    } else {
      window.location.href = callbackUrl;
    }
  };

  const anySocial = providers.google || providers.facebook;

  return (
    <div className="mc-auth__methods">
      <div className="mc-auth__tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          role="tab"
          aria-selected={!isSignup}
          className={`mc-auth__tab${!isSignup ? " is-active" : ""}`}
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignup}
          className={`mc-auth__tab${isSignup ? " is-active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          Create account
        </button>
      </div>

      <header className="mc-auth__header">
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p>
          {isSignup
            ? "Join MAYCSS to track orders and unlock faster checkout."
            : "Sign in to view orders, favorites, and your details."}
        </p>
      </header>

      {providers.google && (
        <button
          type="button"
          className="mc-auth__provider"
          onClick={() => doSocial("google")}
          disabled={pending !== null}
        >
          <span className="mc-auth__provider-icon" aria-hidden>
            <GoogleIcon />
          </span>
          {pending === "google"
            ? "Redirecting…"
            : isSignup
              ? "Sign up with Google"
              : "Continue with Google"}
        </button>
      )}
      {providers.facebook && (
        <button
          type="button"
          className="mc-auth__provider"
          onClick={() => doSocial("facebook")}
          disabled={pending !== null}
        >
          <span className="mc-auth__provider-icon" aria-hidden>
            <FacebookIcon />
          </span>
          {pending === "facebook"
            ? "Redirecting…"
            : isSignup
              ? "Sign up with Facebook"
              : "Continue with Facebook"}
        </button>
      )}

      {providers.email && anySocial && (
        <div className="mc-auth__divider">
          <span>or continue with email</span>
        </div>
      )}

      {providers.email && (
        <form onSubmit={doEmail} className="mc-auth__email">
          {isSignup && (
            <div className="mc-field">
              <label htmlFor="signinName">Full name</label>
              <input
                id="signinName"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={isSignup}
              />
            </div>
          )}
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
            className="mc-btn mc-btn--primary mc-btn--block mc-auth__submit"
            disabled={pending !== null}
          >
            {pending === "email"
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
          {!isSignup && (
            <p className="mc-auth__hint">
              New here?{" "}
              <button
                type="button"
                className="mc-auth__text-btn"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </p>
          )}
          {isSignup && (
            <p className="mc-auth__hint">
              Already have an account?{" "}
              <button
                type="button"
                className="mc-auth__text-btn"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      )}

      {error && (
        <p className="mc-auth__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
