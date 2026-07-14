import Link from "next/link";
import type { SplitBannerBlock } from "@/lib/blocks/types";
import { imgFocusStyle } from "@/lib/images/focus";
import { cx } from "@/lib/utils";

export default function SplitBannerView({ block }: { block: SplitBannerBlock }) {
  const isInternal =
    block.ctaHref &&
    !block.ctaHref.startsWith("http") &&
    !block.ctaHref.startsWith("mailto:");

  const imageFirst = block.imagePosition !== "right";

  const imagePanel = block.image ? (
    <div className="mc-split-banner__media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.image}
        alt={block.heading}
        loading="lazy"
        style={imgFocusStyle(block.imageFocus)}
      />
    </div>
  ) : (
    <div className="mc-split-banner__media mc-split-banner__media--placeholder" aria-hidden />
  );

  const copyPanel = (
    <div className="mc-split-banner__copy">
      {block.eyebrow && <p className="mc-split-banner__eyebrow">{block.eyebrow}</p>}
      <h2 className="mc-split-banner__title">{block.heading}</h2>
      {block.body && <p className="mc-split-banner__body">{block.body}</p>}
      {block.ctaLabel && block.ctaHref && (
        isInternal ? (
          <Link href={block.ctaHref} className="mc-btn mc-btn--primary">
            {block.ctaLabel}
          </Link>
        ) : (
          <a href={block.ctaHref} className="mc-btn mc-btn--primary">
            {block.ctaLabel}
          </a>
        )
      )}
    </div>
  );

  return (
    <section
      className={cx(
        "mc-block mc-block--splitbanner mc-split-banner",
        block.variant && `is-variant-${block.variant}`,
        block.imagePosition === "right" && "is-image-right",
      )}
    >
      {imageFirst ? (
        <>
          {imagePanel}
          {copyPanel}
        </>
      ) : (
        <>
          {copyPanel}
          {imagePanel}
        </>
      )}
    </section>
  );
}
