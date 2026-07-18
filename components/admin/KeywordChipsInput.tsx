"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { cx } from "@/lib/utils";

interface Props {
  id?: string;
  label?: string;
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  hint?: string;
  /** Visually mark the first keyword as primary (pages SEO). */
  markFirstAsPrimary?: boolean;
  disabled?: boolean;
  className?: string;
}

function normalize(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function alreadyHas(list: string[], kw: string): boolean {
  const lower = kw.toLowerCase();
  return list.some((k) => k.toLowerCase() === lower);
}

/**
 * Tag-style keyword field: type a phrase, press Enter (or comma) to add a chip.
 * Updates parent state immediately — no blur required before Save.
 */
export default function KeywordChipsInput({
  id,
  label = "Target keywords",
  keywords,
  onChange,
  placeholder = "Type a keyword and press Enter",
  hint = "Press Enter after each keyword. First keyword is primary for SEO checks.",
  markFirstAsPrimary = false,
  disabled = false,
  className,
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = useState("");

  const addKeyword = (raw: string) => {
    const kw = normalize(raw);
    if (!kw || alreadyHas(keywords, kw)) {
      setDraft("");
      return;
    }
    onChange([...keywords, kw]);
    setDraft("");
  };

  const removeKeyword = (index: number) => {
    onChange(keywords.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(draft);
      return;
    }
    if (e.key === "Backspace" && !draft && keywords.length > 0) {
      e.preventDefault();
      removeKeyword(keywords.length - 1);
    }
  };

  return (
    <div className={cx("mc-field mc-field--full", className)}>
      <label htmlFor={inputId}>{label}</label>
      <div
        className={cx("mc-kw-chips", disabled && "is-disabled")}
        onClick={() => {
          if (disabled) return;
          document.getElementById(inputId)?.focus();
        }}
      >
        {keywords.map((kw, i) => (
          <span
            key={`${kw}-${i}`}
            className={cx(
              "mc-kw-chips__chip",
              markFirstAsPrimary && i === 0 && "is-primary",
            )}
          >
            {markFirstAsPrimary && i === 0 && (
              <span className="mc-kw-chips__primary-tag">Primary</span>
            )}
            <span className="mc-kw-chips__text">{kw}</span>
            <button
              type="button"
              className="mc-kw-chips__remove"
              onClick={(ev) => {
                ev.stopPropagation();
                removeKeyword(i);
              }}
              aria-label={`Remove keyword ${kw}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className="mc-kw-chips__input"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addKeyword(draft);
          }}
          placeholder={keywords.length === 0 ? placeholder : "Add another…"}
          autoComplete="off"
        />
      </div>
      {hint && <p className="mc-admin__hint">{hint}</p>}
    </div>
  );
}
