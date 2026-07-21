import Link from "next/link";
import dynamic from "next/dynamic";
import ContactForm from "@/components/contact/ContactForm";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import { bgImageStyle, imgFocusStyle, overlayOpacityStyle } from "@/lib/images/focus";
import CategoryGridView from "@/components/cms/blocks/CategoryGridView";
import EditorialBlockView from "@/components/cms/blocks/EditorialBlockView";
import SplitBannerView from "@/components/cms/blocks/SplitBannerView";
import type {
  BannerBlock,
  ContactFormBlock,
  ContentBlock,
  MapBlock,
  ProductGridBlock,
  VideoBlock,
} from "@/lib/blocks/types";
import type { Category, Product } from "@/lib/utils";
import { cx } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";

/**
 * Lazy-loaded heavy sections.
 *
 *   • BlockSlider — client-only JS, ships in its own chunk. Loads only when
 *     a page actually contains a slider block.
 *
 * `next/dynamic` returns a component that Next.js code-splits automatically.
 * SSR stays on so the first paint has content; the JS bundle downloads in
 * parallel and hydrates on arrival.
 */
const BlockSlider = dynamic(() => import("./BlockSlider"), {
  loading: () => (
    <div className="mc-block mc-block--placeholder mc-slider-skeleton" />
  ),
});

const CountdownStrip = dynamic(() => import("./blocks/CountdownStrip"), {
  ssr: true,
});

interface Props {
  blocks: ContentBlock[];
  products?: Product[];
  categories?: Category[];
}

/**
 * BlockRenderer — pure presentation. No server-only imports; safe to use
 * from any component tree. Data-hungry blocks (productgrid) receive their
 * data via props from the calling server component.
 */
export default function BlockRenderer({ blocks, products, categories }: Props) {
  return (
    <div className="mc-blocks">
      {blocks.map((block) => (
        <BlockWrapper
          key={block.id}
          block={block}
          products={products}
          categories={categories}
        />
      ))}
    </div>
  );
}

function BlockWrapper({
  block,
  products,
  categories,
}: {
  block: ContentBlock;
  products?: Product[];
  categories?: Category[];
}) {
  const fullBleed =
    block.type === "hero" ||
    block.type === "banner" ||
    block.type === "slider" ||
    block.type === "features" ||
    block.type === "splitbanner" ||
    block.type === "countdown" ||
    block.type === "editorial";

  const layoutClasses = cx(
    block.layout?.alignment && `is-align-${block.layout.alignment}`,
    block.layout?.width && `is-w-${block.layout.width}`,
    block.layout?.columnCount && `is-cols-${block.layout.columnCount}`,
    block.layout?.padding && `is-pad-${block.layout.padding}`,
    fullBleed && "is-full-bleed",
  );
  return (
    <div className={cx("mc-block-wrap", layoutClasses)}>
      <div className="mc-block-wrap__inner">
        <RenderBlock block={block} products={products} categories={categories} />
      </div>
    </div>
  );
}

function RenderBlock({
  block,
  products,
  categories,
}: {
  block: ContentBlock;
  products?: Product[];
  categories?: Category[];
}) {
  switch (block.type) {
    case "richtext": {
      const HeadingTag =
        block.headingLevel === 4 ? "h4" : block.headingLevel === 3 ? "h3" : "h2";
      return (
        <section
          className={cx(
            "mc-block mc-block--richtext",
            block.alignment && `is-align-${block.alignment}`,
          )}
        >
          {block.heading && <HeadingTag>{block.heading}</HeadingTag>}
          {block.body && <p>{block.body}</p>}
        </section>
      );
    }
    case "image": {
      if (!block.src) return null;
      return (
        <figure
          className={cx(
            "mc-block mc-block--image",
            block.alignment && `is-align-${block.alignment}`,
            block.width && `is-width-${block.width}`,
            block.wrapText && "is-wrap",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt ?? ""}
            loading="lazy"
            style={imgFocusStyle(block.imageFocus)}
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
    case "hero": {
      const bgStyle = block.backgroundImage
        ? bgImageStyle(block.backgroundImage, block.imageFocus)
        : undefined;
      const overlayStyle = overlayOpacityStyle(block.overlayStrength);
      return (
        <section
          className={cx(
            "mc-block mc-block--hero mc-block--hero-premium",
            block.height && `is-h-${block.height}`,
            block.backgroundImage && "has-bg",
            block.overlayStrength !== undefined && "has-custom-overlay",
          )}
          style={{ ...bgStyle, ...overlayStyle }}
        >
          <div className="mc-block--hero__overlay" />
          <div className="mc-block--hero__inner">
            {block.eyebrow && (
              <p className="mc-hero-eyebrow">{block.eyebrow}</p>
            )}
            <h1 className="mc-hero-title">{block.heading}</h1>
            {block.subheading && (
              <p className="mc-hero-subtitle">{block.subheading}</p>
            )}
            {(block.ctaLabel && block.ctaHref) ||
            (block.showCategoryLinks !== false &&
              (categories?.some((c) => !c.parentId) ?? false)) ||
            (block.secondaryCtaLabel && block.secondaryCtaHref) ? (
              <div className="mc-hero-actions">
                {block.ctaLabel && block.ctaHref && (
                  <Link
                    href={block.ctaHref}
                    className="mc-btn mc-btn--primary mc-btn--hero"
                  >
                    {block.ctaLabel}
                  </Link>
                )}
                {block.showCategoryLinks !== false &&
                  (categories ?? [])
                    .filter((c) => !c.parentId)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="mc-btn mc-btn--ghost mc-btn--hero"
                      >
                        {cat.name}
                      </Link>
                    ))}
                {block.showCategoryLinks === false &&
                  block.secondaryCtaLabel &&
                  block.secondaryCtaHref && (
                    <Link
                      href={block.secondaryCtaHref}
                      className="mc-btn mc-btn--ghost mc-btn--hero"
                    >
                      {block.secondaryCtaLabel}
                    </Link>
                  )}
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    case "cta": {
      const isInternal =
        !block.ctaHref.startsWith("http") &&
        !block.ctaHref.startsWith("mailto:");
      return (
        <section
          className={cx(
            "mc-block mc-block--cta",
            block.variant && `is-variant-${block.variant}`,
          )}
        >
          <h2>{block.heading}</h2>
          {block.body && <p>{block.body}</p>}
          {isInternal ? (
            <Link href={block.ctaHref} className="mc-btn mc-btn--primary">
              {block.ctaLabel}
            </Link>
          ) : (
            <a href={block.ctaHref} className="mc-btn mc-btn--primary">
              {block.ctaLabel}
            </a>
          )}
        </section>
      );
    }
    case "faq":
      return (
        <section className="mc-block mc-block--faq">
          <dl>
            {block.items.map((item, i) => (
              <div key={i} className="mc-faq__item">
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "columns":
      return (
        <section
          className={cx("mc-block mc-block--columns", `is-count-${block.count}`)}
        >
          {block.columns.map((c, i) => (
            <div key={i} className="mc-block__col">
              {c.heading && <h3>{c.heading}</h3>}
              <p>{c.body}</p>
            </div>
          ))}
        </section>
      );
    case "banner":
      return <BannerRender block={block} />;
    case "slider":
      return <BlockSlider block={block} />;
    case "video":
      return <VideoRender block={block} />;
    case "productgrid":
      return <ProductGridRender block={block} products={products} />;
    case "map":
      return <MapRender block={block} />;
    case "contactform":
      return <ContactFormRender block={block} />;
    case "features":
      return <FeaturesStrip items={block.items} />;
    case "editorial":
      return <EditorialBlockView block={block} />;
    case "splitbanner":
      return <SplitBannerView block={block} />;
    case "countdown":
      return <CountdownStrip block={block} />;
    case "categorygrid":
      return <CategoryGridView block={block} categories={categories} />;
    default:
      return null;
  }
}

function BannerRender({ block }: { block: BannerBlock }) {
  if (!block.image) return null;
  const overlayStyle = overlayOpacityStyle(block.overlayStrength);
  return (
    <section
      className={cx(
        "mc-block mc-block--banner",
        block.overlay && `is-overlay-${block.overlay}`,
        block.overlayStrength !== undefined && "has-custom-overlay",
      )}
      style={{ ...bgImageStyle(block.image, block.imageFocus), ...overlayStyle }}
    >
      <div className="mc-block--banner__overlay" />
      <div className="mc-block--banner__inner">
        {block.eyebrow && (
          <span className="mc-block--banner__eyebrow">{block.eyebrow}</span>
        )}
        <h2>{block.heading}</h2>
        {block.body && <p>{block.body}</p>}
        {block.ctaLabel && block.ctaHref && (
          <Link href={block.ctaHref} className="mc-btn mc-btn--primary">
            {block.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function VideoRender({ block }: { block: VideoBlock }) {
  const url = block.url.trim();
  if (!url) return null;
  const embed = toEmbedUrl(url);
  return (
    <section className="mc-block mc-block--video">
      {embed ? (
        <div className="mc-video">
          <iframe
            src={embed}
            title={block.caption || "Embedded video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <video
          src={url}
          poster={block.poster || undefined}
          autoPlay={block.autoplay}
          muted={block.muted}
          controls
          playsInline
        />
      )}
      {block.caption && (
        <p className="mc-block--video__caption">{block.caption}</p>
      )}
    </section>
  );
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* not a URL — fall through */
  }
  return null;
}

function ProductGridRender({
  block,
  products,
}: {
  block: ProductGridBlock;
  products?: Product[];
}) {
  // No products injected → we're inside the admin preview (client context).
  // Render a placeholder so the admin sees where the grid will land.
  if (!products) {
    return (
      <section className="mc-block mc-block--productgrid mc-block--placeholder">
        {block.heading && <h2 className="mc-block__heading">{block.heading}</h2>}
        <p className="mc-admin__hint" style={{ textAlign: "center" }}>
          Product grid — <em>{block.filterTag ?? "featured"}</em>, limit{" "}
          {block.limit ?? 8}. Live products appear on the storefront.
        </p>
      </section>
    );
  }

  let list = products;
  if (block.productIds && block.productIds.length > 0) {
    const set = new Set(block.productIds.map(String));
    list = products.filter((p) => set.has(String(p.id)));
  } else if (block.filterTag && block.filterTag !== "all") {
    list = products.filter((p) => {
      if (block.filterTag === "new") return p.isNew;
      if (block.filterTag === "sale") return typeof p.originalPrice === "number";
      if (block.filterTag === "featured") return (p.rating ?? 0) >= 4.5;
      return true;
    });
  }
  const limit = block.limit ?? 8;
  const items = list.slice(0, limit);
  if (items.length === 0) return null;

  const cols = block.layout?.columnCount ?? 4;

  return (
    <section className="mc-block mc-block--productgrid">
      {block.heading && (
        <header className="mc-section-header">
          <h2 className="mc-section-title mc-block__heading">{block.heading}</h2>
        </header>
      )}
      <div className={cx("mc-productgrid", `is-cols-${cols}`)}>
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function MapRender({ block }: { block: MapBlock }) {
  if (!block.embedHtml.trim()) return null;
  return (
    <section className="mc-block mc-block--map">
      {block.caption && <p className="mc-block--map__caption">{block.caption}</p>}
      <div
        className="mc-map-embed__frame"
        dangerouslySetInnerHTML={{ __html: block.embedHtml }}
      />
    </section>
  );
}

function ContactFormRender({ block }: { block: ContactFormBlock }) {
  return (
    <section className="mc-block mc-block--contactform">
      {block.heading && <h2 className="mc-block__heading">{block.heading}</h2>}
      {block.subheading && (
        <p className="mc-block--contactform__lead">{block.subheading}</p>
      )}
      <div className="mc-contact__form-wrap mc-contact__form-wrap--inline">
        <ContactForm />
      </div>
    </section>
  );
}
