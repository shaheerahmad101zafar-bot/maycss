"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { cx, formatPrice } from "@/lib/utils";

const SHIPPING_THRESHOLD = 75;

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isDrawerOpen,
    closeDrawer,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    clearCart,
    isHydrated,
  } = useCart();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, closeDrawer]);

  // Focus the close button when opening (a11y)
  useEffect(() => {
    if (isDrawerOpen) {
      const t = window.setTimeout(() => closeBtnRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [isDrawerOpen]);

  // Simple focus trap inside the panel
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen]);

  const displayItems = isHydrated ? items : [];
  const displaySubtotal = isHydrated ? subtotal : 0;
  const displayCount = isHydrated ? itemCount : 0;

  const remaining = Math.max(0, SHIPPING_THRESHOLD - displaySubtotal);
  const freeShip = displaySubtotal >= SHIPPING_THRESHOLD;
  const progress = Math.min(100, (displaySubtotal / SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={cx("mc-drawer-root", isDrawerOpen && "is-open")}
      aria-hidden={!isDrawerOpen}
    >
      <div
        className="mc-drawer__backdrop"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className="mc-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <header className="mc-drawer__header">
          <div>
            <h2 className="mc-drawer__title">Your Bag</h2>
            <p className="mc-drawer__count">
              {displayCount} {displayCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="mc-drawer__close"
            aria-label="Close bag"
            onClick={closeDrawer}
          >
            &times;
          </button>
        </header>

        {displayItems.length > 0 && (
          <div className="mc-drawer__shipbar" aria-live="polite">
            {freeShip ? (
              <p className="mc-drawer__shipbar-text is-good">
                🎉 You&apos;ve unlocked free shipping!
              </p>
            ) : (
              <p className="mc-drawer__shipbar-text">
                Add <strong>{formatPrice(remaining)}</strong> more for free
                shipping
              </p>
            )}
            <div className="mc-drawer__shipbar-track">
              <div
                className="mc-drawer__shipbar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mc-drawer__body">
          {displayItems.length === 0 ? (
            <div className="mc-drawer__empty">
              <div className="mc-drawer__empty-icon" aria-hidden>
                🛍️
              </div>
              <h3>Your bag is empty</h3>
              <p>Start adding curated pieces to see them here.</p>
              <button
                type="button"
                className="mc-btn mc-btn--primary"
                onClick={closeDrawer}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="mc-drawer__list">
              {displayItems.map((item) => (
                <li key={item.id} className="mc-drawer__item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="mc-drawer__item-img"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                  <div className="mc-drawer__item-info">
                    {item.brand && (
                      <span className="mc-drawer__item-brand">
                        {item.brand}
                      </span>
                    )}
                    <p className="mc-drawer__item-name">{item.name}</p>
                    <p className="mc-drawer__item-price">
                      {formatPrice(item.price)}
                    </p>

                    <div className="mc-drawer__item-controls">
                      <div
                        className="mc-stepper"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          className="mc-stepper__btn"
                          aria-label="Decrease quantity"
                          onClick={() => decrementQuantity(item.id)}
                        >
                          &minus;
                        </button>
                        <span
                          className="mc-stepper__value"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="mc-stepper__btn"
                          aria-label="Increase quantity"
                          onClick={() => incrementQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="mc-drawer__remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from bag`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mc-drawer__item-total" aria-hidden>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {displayItems.length > 0 && (
          <footer className="mc-drawer__footer">
            <div className="mc-drawer__totals">
              <div className="mc-drawer__totals-row">
                <span>Subtotal</span>
                <span>{formatPrice(displaySubtotal)}</span>
              </div>
              <div className="mc-drawer__totals-row is-muted">
                <span>Shipping</span>
                <span>{freeShip ? "FREE" : "Calculated at checkout"}</span>
              </div>
              <div className="mc-drawer__totals-row is-total">
                <span>Estimated total (USD)</span>
                <span>{formatPrice(displaySubtotal)}</span>
              </div>
            </div>
            <p className="mc-drawer__currency-note">
              All prices are in USD ($).
            </p>

            <Link
              href="/checkout"
              className="mc-btn mc-btn--primary mc-btn--block"
              onClick={closeDrawer}
            >
              Checkout &rarr;
            </Link>
            <button
              type="button"
              className="mc-btn mc-btn--ghost mc-btn--block"
              onClick={clearCart}
            >
              Clear Bag
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
