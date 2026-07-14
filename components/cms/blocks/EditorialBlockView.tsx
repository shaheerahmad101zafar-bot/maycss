import Link from "next/link";
import type { EditorialBlock } from "@/lib/blocks/types";
import { imgFocusStyle } from "@/lib/images/focus";
import { cx } from "@/lib/utils";

export default function EditorialBlockView({ block }: { block: EditorialBlock }) {
  const isInternal =
    block.ctaHref &&
    !block.ctaHref.startsWith("http") &&
    !block.ctaHref.startsWith("mailto:");

  return (
    <section className="mc-block mc-block--editorial mc-editorial">
      <div className="mc-container mc-editorial__grid">
        <div className="mc-editorial__copy">
          {block.eyebrow && (
            <p className="mc-editorial__eyebrow">{block.eyebrow}</p>
          )}
          <h2 className="mc-editorial__title">{block.heading}</h2>
          {block.body && <p className="mc-editorial__body">{block.body}</p>}
          {block.ctaLabel && block.ctaHref && (
            isInternal ? (
              <Link href={block.ctaHref} className="mc-btn mc-btn--outline">
                {block.ctaLabel}
              </Link>
            ) : (
              <a href={block.ctaHref} className="mc-btn mc-btn--outline">
                {block.ctaLabel}
              </a>
            )
          )}
        </div>
        <div className="mc-editorial__visual">
          {block.image ? (
            <div className="mc-editorial__frame mc-editorial__frame--photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.image}
                alt={block.imageAlt || block.heading}
                loading="lazy"
                style={imgFocusStyle(block.imageFocus)}
              />
            </div>
          ) : (
            <div className="mc-editorial__frame" aria-hidden>
              <span className="mc-editorial__label">Est. 2026</span>
              <p>Premium fashion, thoughtfully sourced.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
