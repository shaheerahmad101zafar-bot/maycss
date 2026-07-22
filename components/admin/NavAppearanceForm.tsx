"use client";

import { useActionState } from "react";
import { updateAppConfigAction, type SettingsFormState } from "@/app/admin/actions";
import type { AppConfig } from "@/lib/app-config";
import { cx } from "@/lib/utils";

const initial: SettingsFormState = { ok: true };

/** Shared nav appearance controls — used in Settings and Menu Builder. */
export default function NavAppearanceForm({ cfg }: { cfg: AppConfig }) {
  const [state, formAction, pending] = useActionState(updateAppConfigAction, initial);

  const banner = state.ok
    ? state.message
      ? { tone: "ok" as const, text: state.message }
      : null
    : { tone: "error" as const, text: state.error };

  return (
    <form action={formAction} className="mc-admin__form mc-admin__nav-appearance">
      {banner && (
        <p className={cx("mc-admin__banner", banner.tone === "error" && "is-error")}>
          {banner.text}
        </p>
      )}

      {/* Preserve other config fields on save */}
      <input type="hidden" name="siteName" value={cfg.siteName} />
      <input type="hidden" name="tagline" value={cfg.tagline ?? ""} />
      <input type="hidden" name="logoUrl" value={cfg.logoUrl ?? ""} />
      <input type="hidden" name="logoHeight" value={cfg.logoHeight ?? 64} />
      <input type="hidden" name="logoWidth" value={cfg.logoWidth ?? 0} />
      <input type="hidden" name="logoBgColor" value={cfg.logoBgColor ?? "#ffffff"} />
      <input type="hidden" name="contactEmail" value={cfg.contactEmail ?? ""} />
      <input type="hidden" name="supportPhone" value={cfg.supportPhone ?? ""} />
      <input type="hidden" name="businessAddress" value={cfg.businessAddress ?? ""} />
      <input type="hidden" name="currency" value={cfg.currency ?? "usd"} />
      <input type="hidden" name="useTextLogo" value={cfg.useTextLogo !== false ? "on" : "off"} />

      <div className="mc-admin__form-grid">
        <div className="mc-field">
          <label htmlFor="nav-menuAlignment">Menu alignment</label>
          <select
            id="nav-menuAlignment"
            name="menuAlignment"
            defaultValue={cfg.menuAlignment ?? "justify-center"}
          >
            <option value="justify-start">Left</option>
            <option value="justify-center">Center</option>
            <option value="justify-end">Right</option>
          </select>
          <p className="mc-field__hint">
            Desktop nav links sit in a full-width row below the logo.
          </p>
        </div>
        <div className="mc-field mc-field--check">
          <label>
            <input type="hidden" name="activeShowUnderline" value="off" />
            <input
              type="checkbox"
              name="activeShowUnderline"
              value="on"
              defaultChecked={cfg.activeLinkStyle?.showUnderline !== false}
            />{" "}
            Active link underline
          </label>
        </div>
        <div className="mc-field">
          <label htmlFor="nav-activeColor">Active accent color</label>
          <input
            id="nav-activeColor"
            name="activeColor"
            type="color"
            defaultValue={cfg.activeLinkStyle?.activeColor ?? "#b8956b"}
          />
        </div>
      </div>

      <button type="submit" className="mc-btn mc-btn--primary" disabled={pending}>
        {pending ? "Saving…" : "Save navigation style"}
      </button>
    </form>
  );
}
