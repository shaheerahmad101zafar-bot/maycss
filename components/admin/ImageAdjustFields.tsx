"use client";

import type { ImageFit, ImageFocus } from "@/lib/images/focus";
import { FOCUS_PRESETS, normalizeImageFocus } from "@/lib/images/focus";
import { cx } from "@/lib/utils";

type Props = {
  value?: ImageFocus;
  onChange: (next: ImageFocus) => void;
  /** Show dark overlay strength slider (hero / banner). */
  showOverlay?: boolean;
  overlay?: number;
  onOverlayChange?: (n: number) => void;
  previewUrl?: string;
};

export default function ImageAdjustFields({
  value,
  onChange,
  showOverlay,
  overlay = 55,
  onOverlayChange,
  previewUrl,
}: Props) {
  const focus = normalizeImageFocus(value);

  const patch = (p: Partial<ImageFocus>) => onChange({ ...focus, ...p });

  return (
    <div className="mc-image-adjust">
      {previewUrl && (
        <div
          className="mc-image-adjust__preview"
          style={{
            backgroundImage: `url(${previewUrl})`,
            backgroundSize: focus.fit === "contain" ? "contain" : "cover",
            backgroundPosition: `${focus.x}% ${focus.y}%`,
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />
      )}

      <p className="mc-field__hint" style={{ margin: "0 0 8px" }}>
        Drag sliders or pick a preset to frame the image — faces stay visible on
        mobile crops.
      </p>

      <div className="mc-image-adjust__presets">
        {FOCUS_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cx(
              "mc-btn mc-btn--ghost mc-image-adjust__preset",
              focus.x === p.x && focus.y === p.y && "is-active",
            )}
            onClick={() => patch({ x: p.x, y: p.y })}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mc-admin__form-grid" style={{ marginTop: 12 }}>
        <div className="mc-field">
          <label>Horizontal focus ({focus.x}%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={focus.x}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </div>
        <div className="mc-field">
          <label>Vertical focus ({focus.y}%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={focus.y}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </div>
        <div className="mc-field">
          <label>Image fit</label>
          <select
            value={focus.fit}
            onChange={(e) => patch({ fit: e.target.value as ImageFit })}
          >
            <option value="cover">Cover (fill area, may crop)</option>
            <option value="contain">Contain (show full image)</option>
          </select>
        </div>
        {showOverlay && onOverlayChange && (
          <div className="mc-field">
            <label>Overlay darkness ({overlay}%)</label>
            <input
              type="range"
              min={0}
              max={90}
              value={overlay}
              onChange={(e) => onOverlayChange(Number(e.target.value))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
