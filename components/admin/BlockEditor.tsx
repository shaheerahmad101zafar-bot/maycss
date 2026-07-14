"use client";

import { useMemo, useState } from "react";
import type { BlockTemplate, BlockType, ContentBlock } from "@/lib/blocks/types";
import { BlockFactory, normalizeBlock } from "@/lib/blocks/types";
import BlockCard from "./BlockCard";
import BlockRenderer from "@/components/cms/BlockRenderer";

interface Props {
  initial: ContentBlock[];
  templates: BlockTemplate[];
  seoKeywords: string[];
  onBlocksChange?: (blocks: ContentBlock[]) => void;
}

/**
 * Visual, no-code block editor.
 * - Add / edit / delete / reorder / duplicate any block
 * - Apply a template (inserts a preset block combo)
 * - Live side-by-side preview (BlockRenderer with the current state)
 * - Serialises to a hidden JSON input for form submission
 */
export default function BlockEditor({
  initial,
  templates,
  seoKeywords,
  onBlocksChange,
}: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [humanizingId, setHumanizingId] = useState<string | null>(null);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    onBlocksChange?.(next);
  };

  const serialized = useMemo(() => JSON.stringify(blocks), [blocks]);

  const addBlock = (type: BlockType) => {
    const b = BlockFactory.create(type);
    commit([...blocks, b]);
    setAddOpen(false);
  };
  const removeAt = (i: number) => commit(blocks.filter((_, idx) => idx !== i));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    commit(next);
  };
  const moveDown = (i: number) => {
    if (i === blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    commit(next);
  };
  const patchBlock = (id: string, patch: Partial<ContentBlock>) => {
    commit(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)),
    );
  };
  const duplicate = (i: number) => {
    const src = blocks[i];
    const clone = BlockFactory.clone(src);
    const next = [...blocks];
    next.splice(i + 1, 0, clone);
    commit(next);
  };
  const applyTemplate = (t: BlockTemplate) => {
    const clones = t.blocks
      .map((b) => normalizeBlock({ ...b, id: undefined }))
      .filter((b): b is ContentBlock => b !== null)
      .map((b) => ({ ...b, id: BlockFactory.clone(b).id }));
    commit([...blocks, ...clones]);
    setTemplatesOpen(false);
  };

  const humanize = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== "richtext" || !block.body.trim()) return;
    setHumanizingId(blockId);
    try {
      const res = await fetch("/api/admin/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: block.body, keywords: seoKeywords }),
      });
      const data = (await res.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) {
        patchBlock(blockId, { body: data.text } as Partial<ContentBlock>);
      }
    } finally {
      setHumanizingId(null);
    }
  };

  return (
    <div className="mc-blk-editor">
      <input type="hidden" name="blocksJson" value={serialized} />

      <div className="mc-blk-editor__toolbar">
        <div className="mc-blk-editor__toolbar-left">
          <div className="mc-blk-add">
            <button
              type="button"
              className="mc-btn mc-btn--primary"
              onClick={() => setAddOpen((v) => !v)}
            >
              + Add Block
            </button>
            {addOpen && (
              <div className="mc-blk-add__menu" role="menu">
                {BlockFactory.allTypes().map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => addBlock(t.type)}
                    className="mc-blk-add__item"
                  >
                    <span className="mc-blk-add__icon">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {templates.length > 0 && (
            <div className="mc-blk-add">
              <button
                type="button"
                className="mc-btn mc-btn--ghost"
                onClick={() => setTemplatesOpen((v) => !v)}
              >
                ⧉ Templates
              </button>
              {templatesOpen && (
                <div className="mc-blk-add__menu" role="menu">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="mc-blk-add__item mc-blk-add__item--wide"
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{t.name}</p>
                        {t.description && (
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "0.75rem",
                              color: "var(--mc-gray-400)",
                            }}
                          >
                            {t.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mc-admin__hint" style={{ margin: 0 }}>
          {blocks.length} block{blocks.length === 1 ? "" : "s"} · save to publish
        </p>
      </div>

      <div className="mc-blk-editor__grid">
        <div className="mc-blk-editor__list">
          {blocks.length === 0 && (
            <div className="mc-blk-editor__empty">
              <p>
                No blocks yet. Click <strong>Add Block</strong> above, or apply a
                template.
              </p>
            </div>
          )}
          {blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              index={i}
              total={blocks.length}
              onChange={(patch) => patchBlock(b.id, patch)}
              onDelete={() => removeAt(i)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              onDuplicate={() => duplicate(i)}
              onHumanize={b.type === "richtext" ? humanize : undefined}
              humanizing={humanizingId === b.id}
              seoKeyword={seoKeywords[0]}
            />
          ))}
        </div>

        <aside className="mc-blk-editor__preview">
          <p className="mc-blk-editor__preview-title">Live preview</p>
          <div className="mc-blk-editor__preview-scroll">
            {blocks.length === 0 ? (
              <p className="mc-admin__muted" style={{ padding: 40, textAlign: "center" }}>
                Nothing to preview yet.
              </p>
            ) : (
              <BlockRenderer blocks={blocks} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
