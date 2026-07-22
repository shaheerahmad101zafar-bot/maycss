"use client";

import { useActionState, useState } from "react";
import {
  updatePaymentSettingsAction,
  type SettingsFormState,
} from "@/app/admin/actions";
import type { PaymentSettings } from "@/lib/settings";
import { cx } from "@/lib/utils";
import ManualMethodsEditor from "./ManualMethodsEditor";

const initial: SettingsFormState = { ok: true };

export type StrategyMeta = {
  id: string;
  label: string;
  authType: "api_key" | "api_secret" | "oauth" | "generic_api";
  apiKeyOnly: boolean;
  supportedCurrencies: string[];
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "select" | "url";
    required: boolean;
    placeholder?: string;
    helper?: string;
    options?: Array<{ label: string; value: string }>;
  }>;
};

const AUTH_LABELS: Record<StrategyMeta["authType"], string> = {
  api_key: "API Key only",
  api_secret: "API + Secret",
  oauth: "OAuth 2.0",
  generic_api: "Generic REST (no-code)",
};

interface Props {
  initial: PaymentSettings;
  strategies: StrategyMeta[];
}

/**
 * PaymentSettingsForm — driven by the PaymentProviderRegistry.
 *
 * The admin picks a provider from a dropdown; the credential inputs
 * regenerate live from the selected strategy's `fields[]` declaration.
 * That's how a Ziina-only key form and a Stripe two-key form coexist
 * without any conditional JSX per provider.
 */
export default function PaymentSettingsForm({ initial: values, strategies }: Props) {
  const [state, formAction, pending] = useActionState(
    updatePaymentSettingsAction,
    initial,
  );
  const [providerId, setProviderId] = useState<string>(
    values.provider ?? strategies[0]?.id ?? "stripe",
  );
  const active = strategies.find((s) => s.id === providerId) ?? strategies[0];

  const banner = state.ok
    ? state.message
      ? { tone: "ok" as const, text: state.message }
      : null
    : { tone: "error" as const, text: state.error };

  const currentValues: Record<string, string> = {
    apiKey: values.apiKey ?? "",
    secretKey: values.secretKey ?? "",
    merchantId: values.merchantId ?? "",
    apiBaseUrl: values.apiBaseUrl ?? "",
    webhookSecret: values.webhookSecret ?? "",
    successRedirectPath: values.successRedirectPath ?? "",
  };

  return (
    <form action={formAction} className="mc-admin__form">
      {banner && (
        <p
          className={cx(
            "mc-admin__banner",
            banner.tone === "error" && "is-error",
          )}
          role={banner.tone === "error" ? "alert" : "status"}
        >
          {banner.text}
        </p>
      )}

      <fieldset className="mc-fieldset">
        <legend>Gateway Provider</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field mc-field--check mc-field--full">
            <label>
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={values.enabled}
              />{" "}
              Enable card gateway
            </label>
            <p className="mc-admin__hint">
              When off, only manual methods (below) are offered at checkout.
            </p>
          </div>

          <div className="mc-field">
            <label htmlFor="provider">Payment Provider *</label>
            <select
              id="provider"
              name="provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {AUTH_LABELS[s.authType]}
                </option>
              ))}
            </select>
            <p className="mc-admin__hint">
              Registered in{" "}
              <code>lib/payments/registry.ts</code>. Implement{" "}
              <code>PaymentGatewayInterface</code> to add any world-wide gateway
              — no core changes needed. Auth type shown next to each provider
              tells the form which credential fields to render.
            </p>
          </div>

          <div className="mc-field">
            <label htmlFor="currency">Charge Currency</label>
            <select id="currency" name="currency" defaultValue="usd" disabled>
              <option value="usd">US Dollar (USD) — required</option>
            </select>
            <p className="mc-admin__hint">
              All card charges and payment links are USD end-to-end.
            </p>
          </div>

          <div className="mc-field">
            <label htmlFor="environment">Environment</label>
            <select
              id="environment"
              name="environment"
              defaultValue={values.environment}
            >
              <option value="sandbox">Sandbox (test transactions)</option>
              <option value="live">Live (real charges)</option>
            </select>
          </div>

          <div className="mc-field mc-field--full">
            <label htmlFor="merchantName">Store display name (admin only)</label>
            <input
              id="merchantName"
              name="merchantName"
              defaultValue={values.merchantName}
              placeholder="MAYCSS"
            />
            <p className="mc-admin__hint">
              Internal label only. Customers always see “Card payment” — never
              Ziina / ZainPay / Stripe.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>{active?.label ?? "Provider"} Credentials</legend>
        <div className="mc-admin__form-grid">
          {active?.fields.map((f) => (
            <div
              key={f.key}
              className={cx("mc-field", f.type === "url" && "mc-field--full")}
            >
              <label htmlFor={f.key}>
                {f.label} {f.required ? "*" : ""}
              </label>
              {f.type === "select" && f.options ? (
                <select
                  id={f.key}
                  name={f.key}
                  defaultValue={currentValues[f.key] ?? ""}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.key}
                  name={f.key}
                  type={
                    f.type === "password"
                      ? "password"
                      : f.type === "url"
                      ? "url"
                      : "text"
                  }
                  defaultValue={currentValues[f.key] ?? ""}
                  placeholder={f.placeholder}
                />
              )}
              {f.helper && <p className="mc-admin__hint">{f.helper}</p>}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>Manual Payment Methods (Zelle / Venmo / CashApp)</legend>
        <p className="mc-admin__hint" style={{ marginBottom: 8 }}>
          Add any number of manual methods. Each shows on checkout as an option
          with its QR code and can carry its own discount %. Orders paid this
          way land in <strong>Needs Review</strong> until you verify the transfer.
        </p>
        <ManualMethodsEditor initial={values.manualMethods ?? []} />
      </fieldset>

      <div className="mc-admin__form-actions">
        <button
          type="submit"
          className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
          disabled={pending}
        >
          {pending ? "Validating & saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
