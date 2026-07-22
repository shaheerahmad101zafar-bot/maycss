/** Clean product/category image alts — descriptive, brand-aware, not keyword-stuffed. */

export function productImageAlt(
  product: { name: string; brand?: string },
  opts?: { color?: string; view?: number },
): string {
  const name = product.name.trim();
  const brand = product.brand?.trim();
  const base = brand && !name.toLowerCase().includes(brand.toLowerCase())
    ? `${brand} ${name}`
    : name;
  const color = opts?.color?.trim();
  const view =
    typeof opts?.view === "number" && opts.view > 0
      ? ` view ${opts.view}`
      : "";
  if (color) return `${base} in ${color}${view} — MAYCSS`;
  return `${base}${view} — MAYCSS fashion`;
}

export function categoryImageAlt(name: string): string {
  const n = name.trim();
  return n ? `${n} collection — MAYCSS` : "MAYCSS fashion collection";
}
