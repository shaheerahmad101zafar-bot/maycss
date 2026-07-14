/** Shared image framing controls for CMS blocks (focal point + fit). */

export type ImageFit = "cover" | "contain";

export type ImageFocus = {
  /** Horizontal focal point 0–100 (default 50). */
  x?: number;
  /** Vertical focal point 0–100 (default 50). */
  y?: number;
  fit?: ImageFit;
};

export const DEFAULT_IMAGE_FOCUS: Required<ImageFocus> = {
  x: 50,
  y: 50,
  fit: "cover",
};

export function normalizeImageFocus(raw?: ImageFocus | null): Required<ImageFocus> {
  const x = typeof raw?.x === "number" && Number.isFinite(raw.x) ? clamp(raw.x, 0, 100) : 50;
  const y = typeof raw?.y === "number" && Number.isFinite(raw.y) ? clamp(raw.y, 0, 100) : 50;
  const fit = raw?.fit === "contain" ? "contain" : "cover";
  return { x, y, fit };
}

export function objectPositionFromFocus(focus?: ImageFocus): string {
  const { x, y } = normalizeImageFocus(focus);
  return `${x}% ${y}%`;
}

export function imgFocusStyle(focus?: ImageFocus): Record<string, string> {
  const n = normalizeImageFocus(focus);
  return {
    objectFit: n.fit,
    objectPosition: `${n.x}% ${n.y}%`,
  };
}

export function bgImageStyle(
  url: string,
  focus?: ImageFocus,
): Record<string, string> {
  const n = normalizeImageFocus(focus);
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: n.fit === "contain" ? "contain" : "cover",
    backgroundPosition: `${n.x}% ${n.y}%`,
    backgroundRepeat: "no-repeat",
  };
}

export function overlayOpacityStyle(strength?: number): Record<string, string> | undefined {
  if (typeof strength !== "number" || !Number.isFinite(strength)) return undefined;
  const opacity = clamp(strength, 0, 100) / 100;
  return { "--mc-overlay-strength": String(opacity) };
}

export const FOCUS_PRESETS: Array<{
  id: string;
  label: string;
  x: number;
  y: number;
}> = [
  { id: "center", label: "Center", x: 50, y: 50 },
  { id: "top", label: "Top", x: 50, y: 12 },
  { id: "bottom", label: "Bottom", x: 50, y: 88 },
  { id: "left", label: "Left", x: 12, y: 50 },
  { id: "right", label: "Right", x: 88, y: 50 },
  { id: "top-left", label: "Top left", x: 15, y: 15 },
  { id: "top-right", label: "Top right", x: 85, y: 15 },
  { id: "faces", label: "Faces / upper", x: 50, y: 28 },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
