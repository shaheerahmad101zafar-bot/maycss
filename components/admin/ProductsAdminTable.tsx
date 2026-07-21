"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteProductAction,
  deleteProductsBulkAction,
} from "@/app/admin/actions";
import { cx, formatPrice, type Product } from "@/lib/utils";

type Props = {
  products: Product[];
  filter?: string;
  categoryNames?: Record<string, string>;
};

export default function ProductsAdminTable({
  products,
  filter,
  categoryNames = {},
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [confirmBulk, setConfirmBulk] = useState(false);

  const allIds = useMemo(
    () => products.map((p) => String(p.id)),
    [products],
  );
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.includes(id));

  const toggleAll = () => {
    setSelected(allSelected ? [] : allIds);
    setConfirmBulk(false);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setConfirmBulk(false);
  };

  const runBulkDelete = () => {
    if (selected.length === 0) return;
    const fd = new FormData();
    fd.set("ids", selected.join(","));
    startTransition(() => {
      void deleteProductsBulkAction(fd);
    });
  };

  return (
    <div className="mc-admin__table-wrap">
      {selected.length > 0 && (
        <div className="mc-admin__bulkbar" role="region" aria-label="Bulk actions">
          <p>
            <strong>{selected.length}</strong> selected
          </p>
          <div className="mc-admin__bulkbar-actions">
            {!confirmBulk ? (
              <button
                type="button"
                className="mc-btn mc-btn--ghost"
                style={{ color: "var(--mc-red)", borderColor: "var(--mc-red)" }}
                onClick={() => setConfirmBulk(true)}
                disabled={pending}
              >
                Delete selected
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="mc-btn mc-btn--primary"
                  style={{ background: "var(--mc-red)" }}
                  onClick={runBulkDelete}
                  disabled={pending}
                >
                  {pending
                    ? "Deleting…"
                    : `Yes, delete ${selected.length}`}
                </button>
                <button
                  type="button"
                  className="mc-btn mc-btn--ghost"
                  onClick={() => setConfirmBulk(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              className="mc-admin__link"
              onClick={() => {
                setSelected([]);
                setConfirmBulk(false);
              }}
              disabled={pending}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <table className="mc-admin__table">
        <thead>
          <tr>
            <th scope="col" className="mc-admin__th-check">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all products"
                disabled={products.length === 0 || pending}
              />
            </th>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            <th scope="col">Brand</th>
            <th scope="col">Price</th>
            <th scope="col">Badge</th>
            <th scope="col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const id = String(p.id);
            const isChecked = selected.includes(id);
            const categoryLabel = p.categoryId
              ? categoryNames[p.categoryId] || p.category || p.categoryId
              : p.category || "—";
            return (
              <tr key={id} className={cx(isChecked && "is-selected")}>
                <td className="mc-admin__td-check">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(id)}
                    aria-label={`Select ${p.name}`}
                    disabled={pending}
                  />
                </td>
                <td>
                  <div className="mc-admin__row-product">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" />
                    <div>
                      <p className="mc-admin__row-name">{p.name}</p>
                      <p className="mc-admin__row-id">ID {p.id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="mc-admin__pill">{categoryLabel}</span>
                </td>
                <td>
                  {p.status === "draft" ? (
                    <span className="mc-status-pill is-status-hold">Draft</span>
                  ) : (
                    <span className="mc-status-pill is-status-completed">
                      Published
                    </span>
                  )}
                </td>
                <td>{p.brand || "—"}</td>
                <td>
                  <div className="mc-admin__price-cell">
                    <span>{formatPrice(p.price)}</span>
                    {p.originalPrice && <s>{formatPrice(p.originalPrice)}</s>}
                  </div>
                </td>
                <td>
                  {p.badge ? (
                    <span className="mc-admin__pill">{p.badge}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div className="mc-admin__actions">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="mc-admin__link"
                    >
                      Edit
                    </Link>
                    <RowDeleteButton id={id} name={p.name} disabled={pending} />
                  </div>
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="mc-admin__empty-cell">
                {filter === "drafts"
                  ? "No drafts right now."
                  : "No products in this view. Try another category filter, or import from a URL."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RowDeleteButton({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        className="mc-admin__link mc-admin__link--danger"
        onClick={() => setConfirming(true)}
        disabled={disabled || pending}
      >
        Delete
      </button>
    );
  }

  return (
    <span className="mc-admin__confirm">
      <span className="mc-admin__confirm-text">Delete?</span>
      <button
        type="button"
        className="mc-admin__link mc-admin__link--danger"
        disabled={disabled || pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", id);
          startTransition(() => {
            void deleteProductAction(fd);
          });
        }}
      >
        {pending ? "Deleting…" : "Yes"}
      </button>
      <button
        type="button"
        className="mc-admin__link"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
      <span className="mc-admin__confirm-text" hidden>
        {name}
      </span>
    </span>
  );
}
