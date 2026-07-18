"use client";

import { useMemo, useState } from "react";
import type { ContentBlock } from "@/lib/blocks/types";
import { SeoAuditor } from "@/lib/seo/auditor";
import { KeywordChecker } from "@/lib/seo/keywords";
import { cx } from "@/lib/utils";
import SeoBodyGuide from "./SeoBodyGuide";

interface Props {
  title: string;
  slug: string;
  hero: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  keywords: string[];
  blocks: ContentBlock[];
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onOgImageChange: (v: string) => void;
  onKeywordsChange: (kws: string[]) => void;
}

/**
 * SEO panel with:
 *   - meta title / description / OG image fields
 *   - target keywords (comma-separated) with local suggestion helper
 *   - live SEO audit checklist (score + issues + hints)
 *   - keyword density readout
 */
export default function SeoPanel(props: Props) {
  const {
    title,
    slug,
    hero,
    metaTitle,
    metaDescription,
    ogImage,
    keywords,
    blocks,
    onMetaTitleChange,
    onMetaDescriptionChange,
    onOgImageChange,
    onKeywordsChange,
  } = props;

  const [kwInput, setKwInput] = useState(keywords.join(", "));
  const [suggestSeed, setSuggestSeed] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const audit = useMemo(
    () =>
      SeoAuditor.analyze({
        title,
        slug,
        hero,
        seo: { metaTitle, metaDescription, ogImage, keywords },
        blocks,
      }),
    [title, slug, hero, metaTitle, metaDescription, ogImage, keywords, blocks],
  );

  const commitKeywords = (raw: string) => {
    const parsed = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    onKeywordsChange(parsed);
  };

  const runSuggest = () => {
    setSuggestions(KeywordChecker.suggest(suggestSeed));
  };

  const addSuggestion = (kw: string) => {
    if (keywords.includes(kw)) return;
    const next = [...keywords, kw];
    setKwInput(next.join(", "));
    onKeywordsChange(next);
  };

  return (
    <div className="mc-seo-panel">
      {/* hidden inputs so form submit picks up the current values */}
      <input type="hidden" name="metaTitle" value={metaTitle} />
      <input type="hidden" name="metaDescription" value={metaDescription} />
      <input type="hidden" name="ogImage" value={ogImage} />
      <input
        type="hidden"
        name="seoKeywordsJson"
        value={JSON.stringify(keywords)}
      />

      <div className="mc-admin__form-grid">
        <div className="mc-field">
          <label htmlFor="metaTitle">Meta title</label>
          <input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder={`${title} · MayCSS`}
          />
          <p className="mc-admin__hint">
            {metaTitle.length} / 60 characters (Google truncates ~60)
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
            placeholder={hero || "Short description shown in search results"}
          />
          <p className="mc-admin__hint">
            {metaDescription.length} / 160 characters
          </p>
        </div>
        <div className="mc-field mc-field--full">
          <label htmlFor="seoKeywords">Target keywords (comma-separated)</label>
          <input
            id="seoKeywords"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onBlur={(e) => commitKeywords(e.target.value)}
            placeholder="silk wrap dress, evening dresses, formal wear"
          />
        </div>

        <div className="mc-field mc-field--full">
          <label htmlFor="kwSeed">Get keyword suggestions</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="kwSeed"
              value={suggestSeed}
              onChange={(e) => setSuggestSeed(e.target.value)}
              placeholder="Enter a seed keyword, e.g. silk dress"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="mc-btn mc-btn--ghost"
              onClick={runSuggest}
              disabled={!suggestSeed.trim()}
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
            </div>
          )}
        </div>
      </div>

      <SeoBodyGuide mode="page" blocks={blocks} hero={hero} />

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
                  <span>{k.keyword}</span>
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
              Sweet spot: 0.5–2.5% density. 0 hits = missing entirely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
