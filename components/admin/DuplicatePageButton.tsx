"use client";

import { useState } from "react";
import { duplicatePageAction } from "@/app/admin/actions";

interface Props {
  id: string;
  title: string;
}

export default function DuplicatePageButton({ id, title }: Props) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={duplicatePageAction}
      onSubmit={() => setPending(true)}
      className="mc-admin__inline-form"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="mc-admin__link"
        disabled={pending}
        title={`Duplicate ${title}`}
      >
        {pending ? "…" : "Duplicate"}
      </button>
    </form>
  );
}
