"use client";

import { useState } from "react";
import { deleteProductAction } from "@/app/admin/actions";

interface Props {
  id: string | number;
  name: string;
}

export default function DeleteProductButton({ id, name }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className="mc-admin__link mc-admin__link--danger"
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }

  return (
    <form action={deleteProductAction} className="mc-admin__confirm">
      <input type="hidden" name="id" value={String(id)} />
      <span className="mc-admin__confirm-text">
        Delete &ldquo;{name}&rdquo;?
      </span>
      <button
        type="submit"
        className="mc-admin__link mc-admin__link--danger"
      >
        Yes, delete
      </button>
      <button
        type="button"
        className="mc-admin__link"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </form>
  );
}
