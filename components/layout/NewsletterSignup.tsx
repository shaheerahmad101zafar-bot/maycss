"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Stub — hook up to a real ESP (Mailchimp, Klaviyo, etc.) later.
    setDone(true);
    setEmail("");
    window.setTimeout(() => setDone(false), 3000);
  };

  return (
    <form className="mc-footer__signup" onSubmit={onSubmit}>
      <input
        type="email"
        placeholder={done ? "Thanks for subscribing!" : "Email address"}
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={done}
      />
      <button type="submit" disabled={done}>
        {done ? "Sent" : "Sign Up"}
      </button>
    </form>
  );
}
