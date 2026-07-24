"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { cx, estimateTax, formatPrice } from "@/lib/utils";
import { placeOrderAction } from "@/app/checkout/actions";
import { STORE_SHIPPING } from "@/lib/commerce/shipping";

const SHIPPING_THRESHOLD = STORE_SHIPPING.freeThresholdUsd;
const SHIPPING_COST = STORE_SHIPPING.standardRateUsd;

/** Sanitised manual method — no admin-only fields. */
export type PublicManualMethod = {
  id: string;
  name: string;
  qrCode: string;
  discountPercent: number;
  instructions: string;
};

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
};

const emptyForm: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
};

type PaymentChoice = { kind: "card" } | { kind: "manual"; id: string };

interface Props {
  manualMethods: PublicManualMethod[];
  cardEnabled: boolean;
  gatewayName?: string;
}

export default function CheckoutView({
  manualMethods,
  cardEnabled,
  gatewayName = "secure payment",
}: Props) {
  const searchParams = useSearchParams();
  const { items, subtotal, isHydrated, clearCart } = useCart();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    orderId: string;
    email: string;
    isManual: boolean;
    methodName?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(() => {
    if (searchParams.get("cancelled") === "1") {
      return "Payment was cancelled. Your order is on hold — you can try again below.";
    }
    return null;
  });

  const initialChoice: PaymentChoice = cardEnabled
    ? { kind: "card" }
    : manualMethods.length > 0
    ? { kind: "manual", id: manualMethods[0].id }
    : { kind: "card" };
  const [choice, setChoice] = useState<PaymentChoice>(initialChoice);

  const displayItems = isHydrated ? items : [];
  const displaySubtotal = isHydrated ? subtotal : 0;
  const shipping =
    displayItems.length === 0
      ? 0
      : displaySubtotal >= SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_COST;
  const tax = estimateTax(displaySubtotal);
  const rawTotal = displaySubtotal + shipping + tax;

  const activeManual = useMemo(
    () =>
      choice.kind === "manual"
        ? manualMethods.find((m) => m.id === choice.id)
        : undefined,
    [choice, manualMethods],
  );

  const discountAmount = activeManual
    ? Math.round(((rawTotal * activeManual.discountPercent) / 100) * 100) / 100
    : 0;
  const total = Math.max(0, Math.round((rawTotal - discountAmount) * 100) / 100);

  const update =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    if (form.phone.trim() && !/^[\d\s+()-]{7,}$/.test(form.phone.trim()))
      errs.phone = "That phone number looks invalid.";
    if (!form.address1.trim()) errs.address1 = "Street address is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State is required.";
    if (!form.zip.trim()) errs.zip = "ZIP is required.";
    else if (!/^\d{4,10}$/.test(form.zip.trim())) errs.zip = "ZIP looks invalid.";
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (displayItems.length === 0) {
      setBanner("Your bag is empty.");
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTermsError(
        agreedToTerms
          ? null
          : "Please agree to the Terms of Service, Privacy Policy, and Refund Policy to continue.",
      );
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    if (!agreedToTerms) {
      setErrors({});
      setTermsError(
        "Please agree to the Terms of Service, Privacy Policy, and Refund Policy to continue.",
      );
      document.getElementById("checkout-agree-terms")?.focus();
      return;
    }
    setErrors({});
    setTermsError(null);
    setSubmitting(true);
    try {
      const result = await placeOrderAction({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        address1: form.address1.trim(),
        address2: form.address2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        items: displayItems.map((i) => ({
          id: i.id,
          name: i.name,
          brand: i.brand,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        })),
        payment:
          choice.kind === "manual"
            ? { method: "manual", methodId: choice.id }
            : { method: "card" },
      });
      if (result.ok) {
        if (result.redirectUrl) {
          // Hosted gateway (Ziina / Stripe / PayPal) — leave this site.
          clearCart();
          window.location.assign(result.redirectUrl);
          return;
        }
        setConfirmed({
          orderId: result.orderId,
          email: form.email,
          isManual: choice.kind === "manual",
          methodName: activeManual?.name,
        });
        clearCart();
      } else {
        setBanner(result.error);
      }
    } catch (err) {
      console.error(err);
      setBanner(
        err instanceof Error
          ? err.message
          : "Something went wrong starting payment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <section className="mc-checkout mc-container">
        <div className="mc-checkout__confirm">
          <div className="mc-checkout__confirm-mark" aria-hidden>
            ✓
          </div>
          <h1>Thank you</h1>
          {confirmed.isManual ? (
            <p>
              Thank you, {confirmed.email.split("@")[0]}. Order{" "}
              <strong>{confirmed.orderId}</strong> is reserved while we confirm
              your <strong>{confirmed.methodName}</strong> transfer. We&apos;ll
              email you as soon as it&apos;s verified.
            </p>
          ) : (
            <p>
              Thank you for shopping with MAYCSS. Your order{" "}
              <strong>{confirmed.orderId}</strong> is confirmed — a receipt is on
              its way to <strong>{confirmed.email}</strong>. We can&apos;t wait
              for you to wear it.
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href={`/track/${confirmed.orderId}?email=${encodeURIComponent(
                confirmed.email,
              )}`}
              className="mc-btn mc-btn--primary"
            >
              Track your order
            </Link>
            <Link href="/" className="mc-btn mc-btn--ghost">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const err = (key: keyof FormState) =>
    errors[key] ? (
      <p className="mc-field__error" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const noMethodsAvailable = !cardEnabled && manualMethods.length === 0;

  return (
    <section className="mc-checkout mc-container">
      <header className="mc-checkout__header">
        <h1>Checkout</h1>
        <p>
          <Link href="/">Continue shopping</Link> or edit your bag from the
          drawer. All prices are in <strong>USD ($)</strong>.
        </p>
      </header>

      {banner && (
        <div className="mc-checkout__banner" role="alert">
          {banner}
        </div>
      )}

      {noMethodsAvailable && (
        <div className="mc-checkout__banner" role="alert">
          No payment methods are enabled yet. Ask the admin to enable a card
          gateway or manual method under Settings → Payments.
        </div>
      )}

      <form className="mc-checkout__grid" onSubmit={handleSubmit} noValidate>
        <div className="mc-checkout__form">
          <fieldset className="mc-fieldset">
            <legend>Contact</legend>
            <div className="mc-field-row">
              <div className="mc-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update("email")}
                />
                {err("email")}
              </div>
              <div className="mc-field">
                <label htmlFor="phone">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+1 555 000 0000"
                />
                {err("phone")}
              </div>
            </div>
          </fieldset>

          <fieldset className="mc-fieldset">
            <legend>Shipping address</legend>
            <div className="mc-field-row">
              <div className="mc-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={update("firstName")}
                />
                {err("firstName")}
              </div>
              <div className="mc-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={update("lastName")}
                />
                {err("lastName")}
              </div>
            </div>
            <div className="mc-field">
              <label htmlFor="address1">Street address</label>
              <input
                id="address1"
                autoComplete="address-line1"
                value={form.address1}
                onChange={update("address1")}
              />
              {err("address1")}
            </div>
            <div className="mc-field">
              <label htmlFor="address2">Apt, suite, etc. (optional)</label>
              <input
                id="address2"
                autoComplete="address-line2"
                value={form.address2}
                onChange={update("address2")}
              />
            </div>
            <div className="mc-field-row">
              <div className="mc-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={update("city")}
                />
                {err("city")}
              </div>
              <div className="mc-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={update("state")}
                />
                {err("state")}
              </div>
              <div className="mc-field">
                <label htmlFor="zip">ZIP</label>
                <input
                  id="zip"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={form.zip}
                  onChange={update("zip")}
                />
                {err("zip")}
              </div>
            </div>
          </fieldset>

          <fieldset className="mc-fieldset">
            <legend>Payment method</legend>

            {cardEnabled && (
              <label
                className={cx(
                  "mc-payment-option",
                  choice.kind === "card" && "is-active",
                )}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={choice.kind === "card"}
                  onChange={() => setChoice({ kind: "card" })}
                />
                <div className="mc-payment-option__body">
                  <p className="mc-payment-option__name">CARD PAYMENTS</p>
                  <p className="mc-payment-option__sub">
                    Pay securely by card.
                  </p>
                </div>
              </label>
            )}

            {manualMethods.map((m) => (
              <label
                key={m.id}
                className={cx(
                  "mc-payment-option",
                  choice.kind === "manual" && choice.id === m.id && "is-active",
                )}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={choice.kind === "manual" && choice.id === m.id}
                  onChange={() => setChoice({ kind: "manual", id: m.id })}
                />
                <div className="mc-payment-option__body">
                  <p className="mc-payment-option__name">
                    {m.name}
                    {m.discountPercent > 0 && (
                      <span className="mc-payment-option__badge">
                        Save {m.discountPercent}%
                      </span>
                    )}
                  </p>
                  <p className="mc-payment-option__sub">
                    Pay with {m.name} — see the QR code below.
                  </p>
                </div>
              </label>
            ))}

            {choice.kind === "manual" && activeManual && (
              <div className="mc-payment-detail mc-payment-detail--manual">
                <div className="mc-manual-pay">
                  <div className="mc-manual-pay__qr">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeManual.qrCode}
                      alt={`${activeManual.name} QR code`}
                    />
                  </div>
                  <div className="mc-manual-pay__info">
                    <h3>Pay with {activeManual.name}</h3>
                    {activeManual.instructions && (
                      <p className="mc-manual-pay__instructions">
                        {activeManual.instructions}
                      </p>
                    )}
                    <p className="mc-manual-pay__amount">
                      Amount to send:{" "}
                      <strong>{formatPrice(total)}</strong>
                      {activeManual.discountPercent > 0 && (
                        <span className="mc-manual-pay__discount">
                          &nbsp;({activeManual.discountPercent}% off applied)
                        </span>
                      )}
                    </p>
                    <p className="mc-checkout__note" style={{ marginTop: 12 }}>
                      After sending, click below. Your order is placed
                      immediately but marked <em>Needs Review</em> until we
                      confirm your transfer arrived.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          <div className="mc-checkout__terms">
            <label
              htmlFor="checkout-agree-terms"
              className={cx(
                "mc-checkout__terms-label",
                termsError && "is-invalid",
              )}
            >
              <input
                id="checkout-agree-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setTermsError(null);
                }}
                aria-invalid={termsError ? true : undefined}
                aria-describedby={termsError ? "checkout-agree-terms-error" : undefined}
                required
              />
              <span>
                I agree to the{" "}
                <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/refund-policy" target="_blank" rel="noopener noreferrer">
                  Refund Policy
                </Link>
              </span>
            </label>
            {termsError ? (
              <p
                id="checkout-agree-terms-error"
                className="mc-field__error"
                role="alert"
              >
                {termsError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className={cx(
              "mc-btn mc-btn--primary mc-btn--block mc-checkout__submit",
              submitting && "is-loading",
            )}
            disabled={submitting || displayItems.length === 0 || noMethodsAvailable}
          >
            {submitting
              ? choice.kind === "card"
                ? "Connecting to payment…"
                : "Processing…"
              : displayItems.length === 0
              ? "Your bag is empty"
              : choice.kind === "manual"
              ? `I've sent ${formatPrice(total)} — place order`
              : `Pay ${formatPrice(total)} securely`}
          </button>
        </div>

        <aside className="mc-checkout__summary" aria-label="Order summary">
          <h2 className="mc-checkout__summary-title">Order summary</h2>
          <p className="mc-checkout__currency-note">
            All prices are in USD ($).
          </p>

          {displayItems.length === 0 ? (
            <p className="mc-checkout__empty">
              You don&apos;t have anything in your bag yet.{" "}
              <Link href="/">Continue shopping</Link>.
            </p>
          ) : (
            <ul className="mc-checkout__items">
              {displayItems.map((i) => (
                <li key={String(i.id)} className="mc-checkout__item">
                  <div className="mc-checkout__item-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} />
                    <span className="mc-checkout__item-qty">{i.quantity}</span>
                  </div>
                  <div className="mc-checkout__item-info">
                    {i.brand && (
                      <span className="mc-checkout__item-brand">{i.brand}</span>
                    )}
                    <p className="mc-checkout__item-name">{i.name}</p>
                  </div>
                  <div className="mc-checkout__item-price">
                    {formatPrice(i.price * i.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <dl className="mc-checkout__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(displaySubtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>
                {shipping === 0 && displayItems.length > 0
                  ? "FREE"
                  : formatPrice(shipping)}
              </dd>
            </div>
            <div>
              <dt>Tax (est.)</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="is-discount">
                <dt>
                  {activeManual?.name} discount ({activeManual?.discountPercent}%)
                </dt>
                <dd>-{formatPrice(discountAmount)}</dd>
              </div>
            )}
            <div className="is-total">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </aside>
      </form>
    </section>
  );
}
