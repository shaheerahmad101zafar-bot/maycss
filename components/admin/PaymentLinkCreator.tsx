"use client";

import { useActionState, useState } from "react";
import {
  createPaymentLinkAction,
  type PaymentLinkState,
} from "@/app/admin/actions";
import { cx } from "@/lib/utils";

const initial: PaymentLinkState | null = null;

/** Admin tool — create a USD payment link from the saved API key. */
export default function PaymentLinkCreator({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    createPaymentLinkAction,
    initial,
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!state || !state.ok) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mc-admin__form" style={{ marginTop: 24 }}>
      <fieldset className="mc-fieldset">
        <legend>Create USD payment link</legend>
        <p className="mc-admin__hint" style={{ marginBottom: 12 }}>
          Uses the same API key saved above. Creates a hosted payment link in{" "}
          <strong>US dollars</strong> you can copy and send to a customer. The
          customer never sees the processor brand name.
        </p>

        {!enabled && (
          <p className="mc-admin__banner is-error" role="alert">
            Enable the card gateway and save settings before creating links.
          </p>
        )}

        <form action={formAction} className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="pl-amount">Amount (USD) *</label>
            <input
              id="pl-amount"
              name="amount"
              type="number"
              min={0.5}
              step={0.01}
              placeholder="49.00"
              required
              disabled={!enabled || pending}
            />
          </div>
          <div className="mc-field mc-field--full">
            <label htmlFor="pl-note">Note on payment page (optional)</label>
            <input
              id="pl-note"
              name="note"
              type="text"
              maxLength={120}
              placeholder="Invoice #1042 — MAYCSS"
              disabled={!enabled || pending}
            />
          </div>
          <div className="mc-admin__form-actions mc-field--full">
            <button
              type="submit"
              className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
              disabled={!enabled || pending}
            >
              {pending ? "Creating link…" : "Create payment link"}
            </button>
          </div>
        </form>

        {state && !state.ok && (
          <p className="mc-admin__banner is-error" role="alert">
            {state.error}
          </p>
        )}

        {state && state.ok && (
          <div className="mc-admin__banner" role="status" style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 8 }}>{state.message}</p>
            <p style={{ marginBottom: 8 }}>
              <strong>${state.amountUsd.toFixed(2)} USD</strong> · ID{" "}
              <code>{state.transactionId}</code>
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                readOnly
                value={state.link}
                style={{ flex: 1, minWidth: 220 }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button type="button" className="mc-btn mc-btn--ghost" onClick={copy}>
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={state.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mc-btn mc-btn--ghost"
              >
                Open
              </a>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
