"use client";

import { useMemo, useRef, useState } from "react";
import { cx } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  subdir?: string;
  helpText?: string;
}

type Source = "upload" | "url";

/**
 * Hybrid image picker — lets the admin either upload a local file or paste
 * an external URL. The two modes are mutually exclusive: while one is in use,
 * the other is disabled + visually dimmed. Auto-detects the current source
 * from the incoming value (uploaded files live under `/uploads/…`).
 */
export default function HybridImagePicker({
  value,
  onChange,
  label = "Image",
  subdir = "categories",
  helpText,
}: Props) {
  const initialSource: Source =
    value && !value.startsWith("/uploads/") && /^https?:\/\//i.test(value)
      ? "url"
      : value.startsWith("/uploads/")
      ? "upload"
      : "upload";
  const [source, setSource] = useState<Source>(initialSource);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(source === "url" ? value : "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadedPath = useMemo(
    () => (value.startsWith("/uploads/") ? value : ""),
    [value],
  );
  const externalUrl = useMemo(
    () => (source === "url" ? urlDraft || value : ""),
    [source, urlDraft, value],
  );

  const switchTo = (next: Source) => {
    if (next === source) return;
    setSource(next);
    setError(null);
    setUrlError(null);
    // Wipe the value so the user starts fresh in the new mode.
    onChange("");
    if (next === "url") setUrlDraft("");
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("File is larger than 8MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subdir", subdir);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok: boolean;
        url?: string;
        error?: string;
      };
      if (data.ok && data.url) onChange(data.url);
      else setError(data.error || "Upload failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const commitUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      onChange("");
      setUrlError(null);
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setUrlError("URL must start with http(s)://");
      return;
    }
    setUrlError(null);
    onChange(trimmed);
  };

  const clear = () => {
    onChange("");
    setUrlDraft("");
    setError(null);
    setUrlError(null);
  };

  return (
    <div className="mc-hybrid-img">
      <div className="mc-hybrid-img__head">
        <label className="mc-hybrid-img__label">{label}</label>
        <div className="mc-hybrid-img__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={source === "upload"}
            className={cx(
              "mc-hybrid-img__tab",
              source === "upload" && "is-active",
            )}
            onClick={() => switchTo("upload")}
          >
            Upload file
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === "url"}
            className={cx(
              "mc-hybrid-img__tab",
              source === "url" && "is-active",
            )}
            onClick={() => switchTo("url")}
          >
            External URL
          </button>
        </div>
      </div>

      <div className="mc-hybrid-img__body">
        <div
          className={cx(
            "mc-hybrid-img__preview",
            !value && "is-empty",
          )}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" />
          ) : (
            <span>No image</span>
          )}
        </div>

        <div className="mc-hybrid-img__controls">
          {/* Upload pane */}
          <div
            className={cx(
              "mc-hybrid-img__pane",
              source !== "upload" && "is-disabled",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={source !== "upload"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="mc-btn mc-btn--ghost"
              onClick={() => inputRef.current?.click()}
              disabled={source !== "upload" || uploading}
            >
              {uploading
                ? "Uploading…"
                : uploadedPath
                ? "Replace file"
                : "Choose file"}
            </button>
            {uploadedPath && source === "upload" && (
              <p className="mc-admin__hint">
                Uploaded to <code>{uploadedPath}</code>
              </p>
            )}
            {error && source === "upload" && (
              <p className="mc-field__error" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* URL pane */}
          <div
            className={cx(
              "mc-hybrid-img__pane",
              source !== "url" && "is-disabled",
            )}
          >
            <input
              type="url"
              placeholder="https://images.example.com/photo.jpg"
              value={urlDraft || (source === "url" ? value : "")}
              disabled={source !== "url"}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlError(null);
              }}
              onBlur={commitUrl}
            />
            {externalUrl && source === "url" && !urlError && (
              <p className="mc-admin__hint">Using external URL</p>
            )}
            {urlError && source === "url" && (
              <p className="mc-field__error" role="alert">
                {urlError}
              </p>
            )}
          </div>

          {value && (
            <button
              type="button"
              className="mc-admin__link mc-admin__link--danger"
              onClick={clear}
              style={{ alignSelf: "flex-start" }}
            >
              Remove image
            </button>
          )}
          {helpText && (
            <p className="mc-admin__hint" style={{ marginTop: 4 }}>
              {helpText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
