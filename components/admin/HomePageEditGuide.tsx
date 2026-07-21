import type { ContentBlock } from "@/lib/blocks/types";

const BLOCK_HINTS: Partial<Record<ContentBlock["type"], string>> = {
  hero: "Full-width hero — image, headline, shop buttons.",
  features: "Four-column trust bar — shipping, authenticity, styling, returns.",
  productgrid: "Product grid — uses your existing catalog.",
  splitbanner: "50/50 promo — image + text (e.g. Simple Is More).",
  countdown: "Red urgency strip with live countdown timer.",
  categorygrid: "Shop by category — pulls from Admin → Categories.",
  editorial: "Split brand story — copy + image side by side.",
  banner: "Full-bleed image banner with overlay + CTA.",
  cta: "Newsletter / dark call-to-action strip.",
  richtext: "Free-form text section.",
  slider: "Promo / image slider — move or delete like any other block.",
};

function blockLabel(block: ContentBlock, index: number): string {
  const hint = BLOCK_HINTS[block.type];
  let title = `Block ${index + 1}: ${block.type}`;

  if (block.type === "hero" && block.heading) title = `Hero — "${block.heading}"`;
  else if (block.type === "splitbanner" && block.heading) title = `Split promo — "${block.heading}"`;
  else if (block.type === "editorial" && block.heading) title = `Editorial — "${block.heading}"`;
  else if (block.type === "countdown" && block.heading) title = `Countdown — "${block.heading}"`;
  else if (block.type === "categorygrid") {
    title =
      block.variant === "banners"
        ? "Category banners — Shop by Category"
        : "Category grid — Shop by Category";
  } else if (block.type === "features") title = "Store benefits bar";
  else if (block.type === "cta" && block.heading) title = `Newsletter CTA — "${block.heading}"`;
  else if (block.type === "productgrid" && block.heading) title = `Products — "${block.heading}"`;
  else if (block.type === "slider") {
    title =
      block.variant === "marketing"
        ? "Marketing promo banner (slider)"
        : "Image slider";
  }

  return hint ? `${title}. ${hint}` : title;
}

export default function HomePageEditGuide({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div
      className="mc-admin__stat"
      style={{
        marginBottom: 20,
        borderLeft: "4px solid var(--mc-gold, #b8956b)",
      }}
    >
      <p className="mc-admin__stat-label">Homepage layout guide</p>
      <p className="mc-admin__hint" style={{ margin: "8px 0 12px" }}>
        Blocks render top to bottom exactly as listed. Use ↑ ↓ to reorder, edit
        fields to change copy, or delete a block to remove it from the live
        site. Then <strong>Save Page</strong>.
      </p>
      <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
        {blocks.map((block, i) => (
          <li key={block.id} style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
            {blockLabel(block, i)}
          </li>
        ))}
      </ol>
    </div>
  );
}
