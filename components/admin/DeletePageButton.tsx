"use client";

import { useState } from "react";
import { deletePageAction } from "@/app/admin/actions";

interface Props {
  id: string;
  title: string;
}

export default function DeletePageButton({ id, title }: Props) {
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
    <form action={deletePageAction} className="mc-admin__confirm">
      <input type="hidden" name="id" value={id} />
      <span className="mc-admin__confirm-text">Delete &ldquo;{title}&rdquo;?</span>
      <button type="submit" className="mc-admin__link mc-admin__link--danger">
        Yes
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
