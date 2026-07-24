"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { cardImageUrl } from "@/lib/images/cdn-url";
import { productImageAlt } from "@/lib/seo/image-alt";
import { cx, discountPercent, formatPrice, type Product } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onToggleWishlist?: (product: Product, saved: boolean) => void;
}

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.round(value);
  return (
    <span className="mc-card__stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export default function ProductCard({
  product,
  onToggleWishlist,
}: ProductCardProps) {
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(false);
  const { addToCart, openDrawer } = useCart();

  const onSale =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;

  const badge =
    product.badge ?? (onSale ? `-${discountPercent(product)}%` : undefined);

  const href = `/product/${product.id}`;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    onToggleWishlist?.(product, next);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    openDrawer();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
  };

  return (
    <article className="mc-card" data-product-id={product.id}>
      <Link href={href} className="mc-card__media" aria-label={product.name}>
        {badge && <span className="mc-card__badge">{badge}</span>}
        <button
          type="button"
          className={cx("mc-card__wishlist", saved && "is-active")}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          onClick={toggleWishlist}
        >
          {saved ? "♥" : "♡"}
        </button>
        <OptimizedImage
          className="mc-card__img"
          src={cardImageUrl(product.image)}
          alt={productImageAlt(product)}
          width={400}
          height={500}
          sizes="(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw"
        />
      </Link>

      <div className="mc-card__body">
        {product.brand && (
          <span className="mc-card__brand">{product.brand}</span>
        )}
        <Link href={href} className="mc-card__name-link">
          <h3 className="mc-card__name">{product.name}</h3>
        </Link>

        {typeof product.rating === "number" &&
          typeof product.reviews === "number" &&
          product.reviews > 0 && (
          <div className="mc-card__rating">
            <Stars value={product.rating} />
            <span>({product.reviews})</span>
          </div>
        )}

        <div className="mc-card__price-row">
          <span
            className={cx("mc-card__price", onSale && "mc-card__price--sale")}
          >
            {formatPrice(product.price)}
          </span>
          {onSale && product.originalPrice && (
            <span className="mc-card__price-original">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={cx("mc-card__cta", flash && "is-flash")}
          onClick={handleAdd}
        >
          {flash ? "Added ✓" : "Add to Bag"}
        </button>
      </div>
    </article>
  );
}
