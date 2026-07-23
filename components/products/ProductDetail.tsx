"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import {
  cx,
  discountPercent,
  formatPrice,
  resolveGallery,
  type Product,
} from "@/lib/utils";
import { productImageAlt } from "@/lib/seo/image-alt";

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const [color, setColor] = useState<string | null>(
    product.colors && product.colors.length > 0 ? product.colors[0].name : null,
  );
  const [size, setSize] = useState<string | null>(
    product.sizes && product.sizes.length === 1 ? product.sizes[0] : null,
  );
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery is a derived value — switch when color changes.
  const gallery = useMemo(
    () => resolveGallery(product, color),
    [product, color],
  );

  // Reset the active image whenever the gallery source changes (color swap).
  useEffect(() => {
    setActiveImage(0);
  }, [gallery]);

  // Zoom lens
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const onLeave = useCallback(() => setZoom(null), []);

  const { addToCart, openDrawer } = useCart();

  const onSale =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  const discount = discountPercent(product);

  const handleAdd = () => {
    if (product.sizes && product.sizes.length > 1 && !size) {
      setError("Please select a size.");
      return;
    }
    setError(null);
    addToCart(product, qty);
    openDrawer();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
  };

  return (
    <section className="mc-pdp mc-container">
      <div className="mc-pdp__grid">
        {/* Gallery — Macy's-style: vertical thumbs + main stage */}
        <div className="mc-pdp__gallery">
          {gallery.length > 1 && (
            <div
              className="mc-pdp__thumbs"
              role="tablist"
              aria-label="Product images"
            >
              {gallery.slice(0, 8).map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  role="tab"
                  aria-label={`${product.name} image ${i + 1}`}
                  aria-selected={i === activeImage}
                  className={cx(
                    "mc-pdp__thumb",
                    i === activeImage && "is-active",
                  )}
                  onClick={() => setActiveImage(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={productImageAlt(product, { view: i + 1 })} />
                </button>
              ))}
            </div>
          )}

          <div
            ref={stageRef}
            className={cx("mc-pdp__stage", zoom && "is-zooming")}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={
              zoom
                ? ({
                    "--zx": `${zoom.x}%`,
                    "--zy": `${zoom.y}%`,
                    backgroundImage: `url(${gallery[activeImage]})`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {product.badge && (
              <span className="mc-pdp__badge">{product.badge}</span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mc-pdp__image"
              src={gallery[activeImage]}
              alt={productImageAlt(product, {
                color: color ?? undefined,
              })}
              key={gallery[activeImage]}
            />
          </div>
        </div>

        {/* Info */}
        <div className="mc-pdp__info">
          {product.brand && <p className="mc-pdp__brand">{product.brand}</p>}
          <h1 className="mc-pdp__name">{product.name}</h1>

          {typeof product.rating === "number" && (
            <div className="mc-pdp__rating">
              <span className="mc-card__stars" aria-hidden>
                {"★".repeat(Math.round(product.rating))}
                {"☆".repeat(5 - Math.round(product.rating))}
              </span>
              <span>{product.rating.toFixed(1)}</span>
              {typeof product.reviews === "number" && (
                <span className="mc-pdp__rating-count">
                  ({product.reviews} reviews)
                </span>
              )}
            </div>
          )}

          <div className="mc-pdp__price-row">
            <span
              className={cx("mc-pdp__price", onSale && "mc-pdp__price--sale")}
            >
              {formatPrice(product.price)}
            </span>
            {onSale && product.originalPrice && (
              <>
                <span className="mc-pdp__price-original">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="mc-pdp__discount">-{discount}%</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mc-pdp__desc">
              {product.description.length > 420
                ? `${product.description.slice(0, 420).replace(/\s+\S*$/, "")}…`
                : product.description}
            </p>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mc-pdp__variant">
              <div className="mc-pdp__variant-head">
                <span className="mc-pdp__variant-label">Color</span>
                <span className="mc-pdp__variant-value">{color}</span>
              </div>
              <div
                className="mc-pdp__swatches"
                role="radiogroup"
                aria-label="Color"
              >
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={c.name === color}
                    aria-label={c.name}
                    title={c.name}
                    className={cx(
                      "mc-pdp__swatch",
                      c.name === color && "is-active",
                      c.image && "mc-pdp__swatch--image",
                    )}
                    style={
                      c.image
                        ? {
                            backgroundImage: `url(${c.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : { backgroundColor: c.hex || "#808080" }
                    }
                    onClick={() => setColor(c.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mc-pdp__variant">
              <div className="mc-pdp__variant-head">
                <span className="mc-pdp__variant-label">Size</span>
                {size && <span className="mc-pdp__variant-value">{size}</span>}
              </div>
              <div
                className="mc-pdp__sizes"
                role="radiogroup"
                aria-label="Size"
              >
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={s === size}
                    className={cx("mc-pdp__size", s === size && "is-active")}
                    onClick={() => {
                      setSize(s);
                      setError(null);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mc-pdp__actions">
            <div className="mc-stepper" role="group" aria-label="Quantity">
              <button
                type="button"
                className="mc-stepper__btn"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                &minus;
              </button>
              <span className="mc-stepper__value" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="mc-stepper__btn"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={cx(
                "mc-btn mc-btn--primary mc-btn--block mc-pdp__cta",
                flash && "is-flash",
              )}
              onClick={handleAdd}
            >
              {flash ? "Added to Bag ✓" : "Add to Bag"}
            </button>
          </div>

          {error && (
            <p className="mc-pdp__error" role="alert">
              {error}
            </p>
          )}

          {product.specs && product.specs.length > 0 && (
            <div className="mc-pdp__specs">
              <h2 className="mc-pdp__specs-title">Details</h2>
              <dl className="mc-pdp__specs-list">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="mc-pdp__specs-row">
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
