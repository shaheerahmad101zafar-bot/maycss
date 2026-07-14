"use client";

import { useState } from "react";
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
 * - No children AND no product refs → simple confirm + delete
 * - Has children/products → dialog offering "Move to top-level" or "Delete all"
 *   (products are always preserved — moved to Uncategorised — even in cascade).
 */
export default function DeleteCategoryButton({
  id,
  name,
  childCount = 0,
  productCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<"orphan" | "cascade">("orphan");

  const hasReferences = childCount > 0 || productCount > 0;

  if (!open) {
    return (
      <button
        type="button"
        className="mc-admin__link mc-admin__link--danger"
        onClick={() => setOpen(true)}
      >
        Delete
      </button>
    );
  }

  // Simple confirm — no references to worry about.
  if (!hasReferences) {
    return (
      <form action={deleteCategoryAction} className="mc-admin__confirm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="strategy" value="refuse" />
        <span className="mc-admin__confirm-text">
          Delete &ldquo;{name}&rdquo;?
        </span>
        <button type="submit" className="mc-admin__link mc-admin__link--danger">
          Yes, delete
        </button>
        <button
          type="button"
          className="mc-admin__link"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </form>
    );
  }

  // Complex confirm — has children or products.
  return (
    <form action={deleteCategoryAction} className="mc-cat-delete">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="strategy" value={strategy} />

      <p className="mc-cat-delete__title">
        Delete &ldquo;{name}&rdquo;?
      </p>
      <p className="mc-cat-delete__summary">
        {childCount > 0 && (
          <>
            <strong>{childCount}</strong> sub-categor
            {childCount === 1 ? "y" : "ies"}
          </>
        )}
        {childCount > 0 && productCount > 0 && <> · </>}
        {productCount > 0 && (
          <>
            <strong>{productCount}</strong>{" "}
            product{productCount === 1 ? "" : "s"} reference this
          </>
        )}
        .
      </p>

      {childCount > 0 && (
        <div className="mc-cat-delete__choices">
          <label
            className={cx(
              "mc-cat-delete__choice",
              strategy === "orphan" && "is-active",
            )}
          >
            <input
              type="radio"
              name="strategyRadio"
              checked={strategy === "orphan"}
              onChange={() => setStrategy("orphan")}
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
              name="strategyRadio"
              checked={strategy === "cascade"}
              onChange={() => setStrategy("cascade")}
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
      )}

      {productCount > 0 && (
        <p className="mc-cat-delete__note">
          Products stay in your catalog. They will be marked{" "}
          <strong>Uncategorised</strong> until you assign them to another
          category.
        </p>
      )}

      <div className="mc-cat-delete__actions">
        <button
          type="submit"
          className="mc-btn mc-btn--primary"
          style={{ background: "var(--mc-red)" }}
        >
          {strategy === "cascade" ? "Cascade delete" : "Delete & move"}
        </button>
        <button
          type="button"
          className="mc-btn mc-btn--ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
