"use client";

import { useMemo, useRef, useState } from "react";
import { cx } from "@/lib/utils";
import {
  isStoredUploadUrl,
  postAdminUpload,
} from "@/lib/uploads/client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  subdir?: string;
  helpText?: string;
}

type Source = "upload" | "url";

export default function HybridImagePicker({
  value,
  onChange,
  label = "Image",
  subdir = "categories",
  helpText,
}: Props) {
  const initialSource: Source =
    value && !isStoredUploadUrl(value) && /^https?:\/\//i.test(value)
      ? "url"
      : isStoredUploadUrl(value) || !value
        ? "upload"
        : "upload";
  const [source, setSource] = useState<Source>(initialSource);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(source === "url" ? value : "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadedPath = useMemo(
    () => (isStoredUploadUrl(value) ? value : ""),
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
    onChange("");
    if (next === "url") setUrlDraft("");
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const result = await postAdminUpload(file, subdir);
    if (result.ok) onChange(result.url);
    else setError(result.error);
    setUploading(false);
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
          className={cx("mc-hybrid-img__preview", !value && "is-empty")}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" />
          ) : (
            <span>No image</span>
          )}
        </div>

        <div className="mc-hybrid-img__controls">
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
              className={cx(
                "mc-btn mc-btn--primary mc-upload-btn",
                uploading && "is-loading",
              )}
              onClick={() => inputRef.current?.click()}
              disabled={source !== "upload" || uploading}
            >
              {uploading
                ? "Uploading…"
                : uploadedPath
                  ? "Replace image"
                  : "Upload image"}
            </button>
            {uploadedPath && source === "upload" && (
              <p className="mc-admin__hint mc-upload-btn__hint">
                Saved to cloud storage
              </p>
            )}
            {error && source === "upload" && (
              <p className="mc-field__error" role="alert">
                {error}
              </p>
            )}
          </div>

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
