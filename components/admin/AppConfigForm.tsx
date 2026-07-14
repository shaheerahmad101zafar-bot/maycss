"use client";

import { useActionState, useState } from "react";
import { updateAppConfigAction, type SettingsFormState } from "@/app/admin/actions";
import type { AppConfig } from "@/lib/app-config";
import { cx } from "@/lib/utils";
import HybridImagePicker from "./HybridImagePicker";

const initial: SettingsFormState = { ok: true };

export default function AppConfigForm({ initial: cfg }: { initial: AppConfig }) {
  const [state, formAction, pending] = useActionState(updateAppConfigAction, initial);
  const [logoUrl, setLogoUrl] = useState<string>(cfg.logoUrl ?? "");

  const banner = state.ok
    ? state.message
      ? { tone: "ok" as const, text: state.message }
      : null
    : { tone: "error" as const, text: state.error };

  return (
    <form action={formAction} className="mc-admin__form">
      {banner && (
        <p className={cx("mc-admin__banner", banner.tone === "error" && "is-error")}>
          {banner.text}
        </p>
      )}

      <fieldset className="mc-fieldset">
        <legend>Brand identity</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="siteName">Site name</label>
            <input id="siteName" name="siteName" defaultValue={cfg.siteName} required />
          </div>
          <div className="mc-field mc-field--full">
            <label htmlFor="tagline">Tagline</label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={cfg.tagline ?? ""}
              placeholder="Curated luxury fashion"
            />
            <p className="mc-field__hint">Shown under the text logo in the header.</p>
          </div>
          <div className="mc-field mc-field--check">
            <label>
              <input type="hidden" name="useTextLogo" value="off" />
              <input
                type="checkbox"
                name="useTextLogo"
                value="on"
                defaultChecked={cfg.useTextLogo !== false}
              />{" "}
              Use text logo in header
            </label>
            <p className="mc-field__hint">
              When enabled, displays the site name as a serif wordmark instead of the uploaded image.
            </p>
          </div>
          <div className="mc-field mc-field--full">
            <label>Logo</label>
            <input type="hidden" name="logoUrl" value={logoUrl} readOnly />
            <HybridImagePicker value={logoUrl} onChange={setLogoUrl} subdir="logos" label="" />
          </div>
          <div className="mc-field">
            <label htmlFor="logoHeight">Logo height (px)</label>
            <input
              id="logoHeight"
              name="logoHeight"
              type="number"
              min={1}
              defaultValue={cfg.logoHeight ?? 64}
            />
          </div>
          <div className="mc-field">
            <label htmlFor="logoWidth">Logo width (px)</label>
            <input
              id="logoWidth"
              name="logoWidth"
              type="number"
              min={0}
              defaultValue={cfg.logoWidth ?? 0}
            />
            <p className="mc-field__hint">Leave at 0 to preserve aspect ratio.</p>
          </div>
          <div className="mc-field">
            <label htmlFor="logoBgColor">Logo background color</label>
            <input
              id="logoBgColor"
              name="logoBgColor"
              type="color"
              defaultValue={cfg.logoBgColor ?? "#ffffff"}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="mc-fieldset">
        <legend>Navigation</legend>
        <div className="mc-admin__form-grid">
          <div className="mc-field">
            <label htmlFor="menuAlignment">Menu alignment</label>
            <select
              id="menuAlignment"
              name="menuAlignment"
              defaultValue={cfg.menuAlignment ?? "justify-center"}
            >
              <option value="justify-start">Left</option>
              <option value="justify-center">Center</option>
              <option value="justify-end">Right</option>
            </select>
            <p className="mc-field__hint">
              Controls how header links align in the row below the logo on desktop.
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
              Show active link underline
            </label>
          </div>
          <div className="mc-field">
            <label htmlFor="activeColor">Active link accent color</label>
            <input
              id="activeColor"
              name="activeColor"
              type="color"
              defaultValue={cfg.activeLinkStyle?.activeColor ?? "#b8956b"}
            />
          </div>
        </div>
      </fieldset>

      <div className="mc-admin__form-actions">
        <button type="submit" className="mc-btn mc-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
