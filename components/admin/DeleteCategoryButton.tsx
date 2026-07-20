"use client";

import { useState, useTransition } from "react";
import { deleteCategoryAction } from "@/app/admin/actions";
import { cx } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  /** How many direct sub-categories this category has. */
  childCount?: number;
  /** How many products currently reference this category. */
  productCount?: number;
}

/**
 * Smart delete button.
 * - No children → force delete (products become Uncategorised)
 * - Has children → dialog: move to top-level OR cascade delete
 */
export default function DeleteCategoryButton({
  id,
  name,
  childCount = 0,
  productCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<"orphan" | "cascade">("orphan");
  const [pending, startTransition] = useTransition();

  const submit = (chosen: "force" | "orphan" | "cascade") => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("strategy", chosen);
    startTransition(() => {
      void deleteCategoryAction(fd);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        className="mc-admin__link mc-admin__link--danger"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Delete
      </button>
    );
  }

  // Simple confirm — no sub-categories.
  if (childCount === 0) {
    return (
      <div className="mc-admin__confirm">
        <span className="mc-admin__confirm-text">
          Delete &ldquo;{name}&rdquo;?
          {productCount > 0
            ? ` ${productCount} product(s) become Uncategorised.`
            : ""}
        </span>
        <button
          type="button"
          className="mc-admin__link mc-admin__link--danger"
          disabled={pending}
          onClick={() => submit("force")}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          className="mc-admin__link"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="mc-cat-delete">
      <p className="mc-cat-delete__title">Delete &ldquo;{name}&rdquo;?</p>
      <p className="mc-cat-delete__summary">
        <strong>{childCount}</strong> sub-categor
        {childCount === 1 ? "y" : "ies"}
        {productCount > 0 && (
          <>
            {" "}
            · <strong>{productCount}</strong> product
            {productCount === 1 ? "" : "s"}
          </>
        )}
        .
      </p>

      <div className="mc-cat-delete__choices">
        <label
          className={cx(
            "mc-cat-delete__choice",
            strategy === "orphan" && "is-active",
          )}
        >
          <input
            type="radio"
            name={`strategy-${id}`}
            checked={strategy === "orphan"}
            onChange={() => setStrategy("orphan")}
            disabled={pending}
          />
          <div>
            <p className="mc-cat-delete__choice-title">
              Move sub-categories to top-level
            </p>
            <p className="mc-cat-delete__choice-sub">
              Each becomes its own parent. Nothing else is lost.
            </p>
          </div>
        </label>

        <label
          className={cx(
            "mc-cat-delete__choice",
            strategy === "cascade" && "is-active",
          )}
        >
          <input
            type="radio"
            name={`strategy-${id}`}
            checked={strategy === "cascade"}
            onChange={() => setStrategy("cascade")}
            disabled={pending}
          />
          <div>
            <p className="mc-cat-delete__choice-title">
              Delete sub-categories too
            </p>
            <p className="mc-cat-delete__choice-sub">
              Removes this category and every descendant.
            </p>
          </div>
        </label>
      </div>

      {productCount > 0 && (
        <p className="mc-cat-delete__note">
          Products stay in your catalog. They will be marked{" "}
          <strong>Uncategorised</strong> until you assign them to another
          category.
        </p>
      )}

      <div className="mc-cat-delete__actions">
        <button
          type="button"
          className="mc-btn mc-btn--primary"
          style={{ background: "var(--mc-red)" }}
          disabled={pending}
          onClick={() => submit(strategy)}
        >
          {pending
            ? "Deleting…"
            : strategy === "cascade"
              ? "Cascade delete"
              : "Delete & move"}
        </button>
        <button
          type="button"
          className="mc-btn mc-btn--ghost"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
