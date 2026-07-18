"use client";

import { useMemo, useState } from "react";
import { SeoAuditor, type EntityForAudit } from "@/lib/seo/auditor";
import { KeywordChecker } from "@/lib/seo/keywords";
import { cx } from "@/lib/utils";
import SeoBodyGuide from "./SeoBodyGuide";
import type { BodySource } from "@/lib/seo/body-content";
import { countWords } from "@/lib/seo/body-content";

interface Props {
  kind: "category" | "product" | "generic";
  title: string;
  slug: string;
  /** All the searchable body text (description + specs + block text …). */
  contentText: string;
  /** Optional breakdown shown in the body-content guide. */
  bodySources?: BodySource[];
  /** Optional block-derived extras. */
  extras?: EntityForAudit["extras"];

  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  additionalKeywords: string[];

  onFocusKeywordChange: (v: string) => void;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onOgImageChange: (v: string) => void;
  onAdditionalKeywordsChange: (kws: string[]) => void;
}

/**
 * Yoast-style SEO panel for Category / Product / any small entity.
 * Renders:
 *   - Focus Keyword (single, primary)
 *   - Meta Title (with char counter 30–60)
 *   - Meta Description (with char counter 120–160)
 *   - OG Image (URL)
 *   - Additional keywords (comma-separated) + local suggest button
 *   - Live audit score + checks + keyword density
 *
 * All fields sync to hidden <input>s (metaTitle, metaDescription, ogImage,
 * seoFocusKeyword, seoKeywordsJson) so the surrounding form action picks them up.
 */
export default function MetaSeoPanel({
  kind,
  title,
  slug,
  contentText,
  bodySources,
  extras,
  focusKeyword,
  metaTitle,
  metaDescription,
  ogImage,
  additionalKeywords,
  onFocusKeywordChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onOgImageChange,
  onAdditionalKeywordsChange,
}: Props) {
  const [addKwInput, setAddKwInput] = useState(additionalKeywords.join(", "));
  const [suggestSeed, setSuggestSeed] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const audit = useMemo(
    () =>
      SeoAuditor.analyzeEntity({
        kind,
        title,
        slug,
        contentText,
        extras,
        seo: {
          metaTitle,
          metaDescription,
          ogImage,
          focusKeyword,
          keywords: additionalKeywords,
        },
      }),
    [
      kind,
      title,
      slug,
      contentText,
      extras,
      metaTitle,
      metaDescription,
      ogImage,
      focusKeyword,
      additionalKeywords,
    ],
  );

  const commitAdditional = (raw: string) => {
    const parsed = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    onAdditionalKeywordsChange(parsed);
  };

  const runSuggest = () => {
    setSuggestions(KeywordChecker.suggest(suggestSeed || focusKeyword));
  };

  const addSuggestion = (kw: string) => {
    if (!focusKeyword) {
      onFocusKeywordChange(kw);
      return;
    }
    if (additionalKeywords.includes(kw) || kw === focusKeyword) return;
    const next = [...additionalKeywords, kw];
    setAddKwInput(next.join(", "));
    onAdditionalKeywordsChange(next);
  };

  return (
    <div className="mc-seo-panel">
      {/* Hidden fields for form submission */}
      <input type="hidden" name="metaTitle" value={metaTitle} />
      <input type="hidden" name="metaDescription" value={metaDescription} />
      <input type="hidden" name="ogImage" value={ogImage} />
      <input type="hidden" name="seoFocusKeyword" value={focusKeyword} />
      <input
        type="hidden"
        name="seoKeywordsJson"
        value={JSON.stringify(additionalKeywords)}
      />

      <div className="mc-admin__form-grid">
        <div className="mc-field mc-field--full">
          <label htmlFor="seoFocusKeyword">Focus keyword *</label>
          <input
            id="seoFocusKeyword"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder='e.g. "silk wrap midi dress"'
          />
          <p className="mc-admin__hint">
            The single most important phrase you want this {kind} to rank for.
            Every check below grades placement of this word.
          </p>
        </div>

        <div className="mc-field">
          <label htmlFor="metaTitle">Meta title</label>
          <input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder={`${title} · MayCSS`}
          />
          <p className="mc-admin__hint">
            {metaTitle.length} / 60 characters
          </p>
        </div>

        <div className="mc-field">
          <label htmlFor="ogImage">OG image URL</label>
          <input
            id="ogImage"
            type="url"
            value={ogImage}
            onChange={(e) => onOgImageChange(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="mc-field mc-field--full">
          <label htmlFor="metaDescription">Meta description</label>
          <textarea
            id="metaDescription"
            rows={2}
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="Short description shown in Google's search snippet"
          />
          <p className="mc-admin__hint">
            {metaDescription.length} / 160 characters
          </p>
        </div>

        <div className="mc-field mc-field--full">
          <label htmlFor="addKeywords">
            Additional keywords (comma-separated)
          </label>
          <input
            id="addKeywords"
            value={addKwInput}
            onChange={(e) => setAddKwInput(e.target.value)}
            onBlur={(e) => commitAdditional(e.target.value)}
            placeholder="related, secondary, long-tail keywords"
          />
        </div>

        <div className="mc-field mc-field--full">
          <label htmlFor="kwSeed">Get keyword suggestions</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="kwSeed"
              value={suggestSeed}
              onChange={(e) => setSuggestSeed(e.target.value)}
              placeholder={
                focusKeyword
                  ? `Leave blank to seed from "${focusKeyword}"`
                  : "Enter a seed keyword"
              }
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="mc-btn mc-btn--ghost"
              onClick={runSuggest}
              disabled={!suggestSeed.trim() && !focusKeyword}
            >
              Suggest
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mc-seo-panel__suggestions">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="mc-seo-panel__suggestion"
                  onClick={() => addSuggestion(s)}
                >
                  + {s}
                </button>
              ))}
              <p className="mc-admin__hint" style={{ width: "100%", margin: "6px 0 0" }}>
                Click a suggestion to add it. If no focus keyword is set, the
                first click becomes the focus.
              </p>
            </div>
          )}
        </div>
      </div>

      <SeoBodyGuide
        mode={kind}
        totalWords={audit.wordCount}
        sources={
          bodySources ??
          (kind === "category"
            ? [
                {
                  id: "category-name",
                  label: "Category name",
                  field: "name",
                  words: countWords(title),
                  preview: title || "(empty)",
                },
                {
                  id: "category-description",
                  label: "Description",
                  field: "description",
                  words: Math.max(0, audit.wordCount - countWords(title)),
                  preview: contentText.slice(0, 72) || "(empty)",
                },
              ]
            : [])
        }
      />

      <div className="mc-seo-panel__audit">
        <div className="mc-seo-panel__audit-head">
          <div>
            <p className="mc-seo-panel__audit-eyebrow">Live SEO Audit</p>
            <p className="mc-seo-panel__audit-meta">
              {audit.wordCount} words · {audit.readingTimeMinutes} min read
            </p>
          </div>
          <div
            className={cx(
              "mc-seo-panel__score",
              audit.score >= 80
                ? "is-good"
                : audit.score >= 60
                ? "is-warn"
                : "is-bad",
            )}
          >
            {audit.score}
          </div>
        </div>

        <ul className="mc-seo-panel__checks">
          {audit.checks.map((c) => (
            <li
              key={c.id}
              className={cx(
                "mc-seo-panel__check",
                c.pass
                  ? "is-ok"
                  : c.severity === "error"
                  ? "is-error"
                  : "is-warn",
              )}
            >
              <span className="mc-seo-panel__check-mark" aria-hidden>
                {c.pass ? "✓" : c.severity === "error" ? "!" : "•"}
              </span>
              <div>
                <p className="mc-seo-panel__check-label">{c.label}</p>
                {c.hint && !c.pass && (
                  <p className="mc-seo-panel__check-hint">{c.hint}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {audit.keywordDensity.length > 0 && (
          <div className="mc-seo-panel__density">
            <p className="mc-seo-panel__density-title">Keyword density</p>
            <ul>
              {audit.keywordDensity.map((k) => (
                <li key={k.keyword}>
                  <span>
                    {k.keyword === focusKeyword && (
                      <strong style={{ marginRight: 6 }}>focus →</strong>
                    )}
                    {k.keyword}
                  </span>
                  <span
                    className={cx(
                      "mc-seo-panel__density-pct",
                      k.density >= 0.5 && k.density <= 2.5
                        ? "is-good"
                        : k.count === 0
                        ? "is-bad"
                        : "is-warn",
                    )}
                  >
                    {k.count}× · {k.density.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mc-admin__hint" style={{ marginTop: 6 }}>
              Sweet spot: 0.5–2.5%. 0 hits = missing entirely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
