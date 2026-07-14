"use client";

import { useMemo, useRef, useState } from "react";
import type { ManualPaymentMethod } from "@/lib/settings";
import { cx } from "@/lib/utils";

const rid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const empty = (): ManualPaymentMethod => ({
  id: rid(),
  name: "",
  qrCode: "",
  discountPercent: 0,
  instructions: "",
  enabled: true,
});

interface Props {
  initial: ManualPaymentMethod[];
}

export default function ManualMethodsEditor({ initial }: Props) {
  const [methods, setMethods] = useState<ManualPaymentMethod[]>(initial);
  const [uploadStates, setUploadStates] = useState<
    Record<string, { uploading?: boolean; error?: string }>
  >({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const serialized = useMemo(() => JSON.stringify(methods), [methods]);

  const update = (id: string, patch: Partial<ManualPaymentMethod>) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };
  const remove = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };
  const add = () => {
    setMethods((prev) => [...prev, empty()]);
  };

  const uploadFile = async (id: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadStates((s) => ({
        ...s,
        [id]: { error: "Please choose an image file." },
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadStates((s) => ({
        ...s,
        [id]: { error: "File is larger than 5MB." },
      }));
      return;
    }
    setUploadStates((s) => ({ ...s, [id]: { uploading: true } }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subdir", "qr");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok: boolean;
        url?: string;
        error?: string;
      };
      if (data.ok && data.url) {
        update(id, { qrCode: data.url });
        setUploadStates((s) => ({ ...s, [id]: {} }));
      } else {
        setUploadStates((s) => ({
          ...s,
          [id]: { error: data.error || "Upload failed." },
        }));
      }
    } catch (err) {
      setUploadStates((s) => ({
        ...s,
        [id]: {
          error: err instanceof Error ? err.message : "Upload failed.",
        },
      }));
    }
  };

  return (
    <div className="mc-manual-methods">
      <input type="hidden" name="manualMethodsJson" value={serialized} />

      {methods.length === 0 && (
        <p className="mc-admin__muted" style={{ padding: 12 }}>
          No manual methods yet. Add Zelle, Venmo, CashApp — anything that
          takes a QR code.
        </p>
      )}

      {methods.map((m, i) => {
        const state = uploadStates[m.id] ?? {};
        return (
          <div
            key={m.id}
            className={cx("mc-manual-method", !m.enabled && "is-disabled")}
          >
            <div className="mc-manual-method__row">
              <div className="mc-manual-method__preview">
                {m.qrCode ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.qrCode} alt={`${m.name || "QR"} QR code`} />
                ) : (
                  <div className="mc-manual-method__preview-empty">QR</div>
                )}
              </div>
              <div className="mc-manual-method__fields">
                <div className="mc-admin__form-grid">
                  <div className="mc-field">
                    <label htmlFor={`mm-name-${i}`}>Method name *</label>
                    <input
                      id={`mm-name-${i}`}
                      value={m.name}
                      onChange={(e) => update(m.id, { name: e.target.value })}
                      placeholder="Zelle, Venmo, CashApp…"
                    />
                  </div>
                  <div className="mc-field">
                    <label htmlFor={`mm-discount-${i}`}>Discount %</label>
                    <input
                      id={`mm-discount-${i}`}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        Number.isFinite(m.discountPercent)
                          ? m.discountPercent
                          : 0
                      }
                      onChange={(e) =>
                        update(m.id, {
                          discountPercent: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0),
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="mc-field mc-field--full">
                    <label>QR code image *</label>
                    <div className="mc-qr-upload">
                      <input
                        ref={(el) => {
                          fileInputs.current[m.id] = el;
                        }}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadFile(m.id, f);
                          e.target.value = ""; // reset so re-upload of same file works
                        }}
                      />
                      <button
                        type="button"
                        className="mc-btn mc-btn--ghost"
                        onClick={() => fileInputs.current[m.id]?.click()}
                        disabled={state.uploading}
                      >
                        {state.uploading
                          ? "Uploading…"
                          : m.qrCode
                          ? "Replace image"
                          : "Upload image"}
                      </button>
                      {m.qrCode && !state.uploading && (
                        <button
                          type="button"
                          className="mc-admin__link mc-admin__link--danger"
                          onClick={() => update(m.id, { qrCode: "" })}
                          style={{ marginLeft: 12 }}
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                    {state.error && (
                      <p className="mc-field__error" role="alert">
                        {state.error}
                      </p>
                    )}
                    {m.qrCode && !state.error && (
                      <p className="mc-admin__hint">
                        Saved: <code>{m.qrCode}</code>
                      </p>
                    )}
                  </div>

                  <div className="mc-field mc-field--full">
                    <label htmlFor={`mm-instructions-${i}`}>
                      Instructions to customer
                    </label>
                    <input
                      id={`mm-instructions-${i}`}
                      value={m.instructions}
                      onChange={(e) =>
                        update(m.id, { instructions: e.target.value })
                      }
                      placeholder="Send to yourname@zelle.com — include your order number"
                    />
                  </div>
                  <div className="mc-field mc-field--check mc-field--full">
                    <label>
                      <input
                        type="checkbox"
                        checked={m.enabled}
                        onChange={(e) =>
                          update(m.id, { enabled: e.target.checked })
                        }
                      />{" "}
                      Enabled (visible on checkout)
                    </label>
                  </div>
                </div>
                <div className="mc-manual-method__actions">
                  <button
                    type="button"
                    className="mc-admin__link mc-admin__link--danger"
                    onClick={() => remove(m.id)}
                  >
                    Remove this method
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="mc-btn mc-btn--ghost"
        onClick={add}
        style={{ marginTop: 12 }}
      >
        + Add Manual Method
      </button>
    </div>
  );
}
