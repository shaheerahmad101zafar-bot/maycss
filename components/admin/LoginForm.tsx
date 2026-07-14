"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initial: LoginState = { ok: true };

export default function LoginForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const error = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="mc-admin-login__form">
      <input type="hidden" name="from" value={from || "/admin"} />
      <div className="mc-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
        />
      </div>
      {error && (
        <p className="mc-admin-login__error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mc-btn mc-btn--primary mc-btn--block"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <p className="mc-admin-login__hint">
        Default dev password: <code>maycss-admin</code>
      </p>
    </form>
  );
}
