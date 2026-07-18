"use client";

import type { ContentBlock } from "@/lib/blocks/types";
import {
  countWords,
  extractPageBodyText,
  listPageBodySources,
  type BodySource,
} from "@/lib/seo/body-content";

interface PageProps {
  mode: "page";
  blocks: ContentBlock[];
  hero: string;
}

interface EntityProps {
  mode: "product" | "category" | "generic";
  sources: BodySource[];
  totalWords: number;
}

type Props = PageProps | EntityProps;

export default function SeoBodyGuide(props: Props) {
  if (props.mode === "page") {
    const sources = listPageBodySources(props.blocks, props.hero);
    const totalWords = countWords(
      extractPageBodyText(props.blocks, props.hero),
    );
    return (
      <BodyGuideBox
        totalWords={totalWords}
        sources={sources}
        intro="These fields count toward Primary keyword in body and Body content ≥ 150 words. Meta title and description alone do not count."
      />
    );
  }

  const fieldHint =
    props.mode === "product" || props.mode === "generic"
      ? "Product name, Description, Specs, and any Content blocks below."
      : "Category name and Description.";

  return (
    <BodyGuideBox
      totalWords={props.totalWords}
      sources={props.sources}
      intro={`Body content for SEO checks comes from: ${fieldHint}`}
    />
  );
}

function BodyGuideBox({
  totalWords,
  sources,
  intro,
}: {
  totalWords: number;
  sources: BodySource[];
  intro: string;
}) {
  return (
    <div className="mc-seo-panel__body-guide">
      <p className="mc-seo-panel__body-guide-title">What counts as body content?</p>
      <p className="mc-admin__hint">{intro}</p>
      {sources.length === 0 ? (
        <p className="mc-seo-panel__body-guide-empty">
          No body text yet — add a <strong>Rich text</strong>,{" "}
          <strong>Editorial split</strong>, or <strong>Split promo</strong> block in
          Content blocks and write at least 150 words (include your primary keyword).
        </p>
      ) : (
        <ul className="mc-seo-panel__body-guide-list">
          {sources.map((s) => (
            <li key={s.id}>
              <span className="mc-seo-panel__body-guide-label">{s.label}</span>
              <span className="mc-seo-panel__body-guide-words">{s.words} words</span>
              <span className="mc-seo-panel__body-guide-preview">{s.preview}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mc-seo-panel__body-guide-total">
        Total counted: <strong>{totalWords}</strong> words
        {totalWords < 150 && " — need at least 150 for the green check"}
      </p>
    </div>
  );
}
