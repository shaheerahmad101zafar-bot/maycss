"use client";

import { useActionState } from "react";
import {
  submitContactAction,
  type ContactFormState,
} from "@/app/contact/actions";
import { cx } from "@/lib/utils";

const initial: ContactFormState = { ok: true, message: "" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initial,
  );

  const showError = !state.ok;
  const showSuccess = state.ok && state.message.length > 0;

  return (
    <form action={formAction} className="mc-contact__form">
      {showError && (
        <p className="mc-contact__banner is-error" role="alert">
          {state.error}
        </p>
      )}
      {showSuccess && (
        <p className="mc-contact__banner is-success" role="status">
          {state.message}
        </p>
      )}

      <div className="mc-field">
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          required
        />
      </div>

      <div className="mc-field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="mc-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          placeholder="How can we help you?"
          required
        />
      </div>

      <button
        type="submit"
        className={cx("mc-btn mc-btn--primary mc-contact__submit")}
        disabled={pending}
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
