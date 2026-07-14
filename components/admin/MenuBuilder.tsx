"use client";

import { useActionState, useState } from "react";
import type { MenuLink, MenuLocation } from "@/lib/menus";
import { saveMenusAction, type MenusFormState } from "@/app/admin/actions";
import { cx } from "@/lib/utils";

interface Props {
  initial: MenuLink[];
}

const initialState: MenusFormState = { ok: true };

/**
 * MenuBuilder — CRUD + reorder over MenuLink[].
 *
 *   • Add   — appends a new row to the chosen location
 *   • Rename / rehref — edit inline
 *   • Show/hide — toggle without deleting (useful for A/B changes)
 *   • Reorder — Up/Down buttons keep it keyboard-accessible
 *   • Delete — instant remove
 *
 * All changes stay client-side until "Save Menus" is pressed. The server
 * action then rewrites `data/menus.json` and revalidates the storefront.
 */
export default function MenuBuilder({ initial }: Props) {
  const [links, setLinks] = useState<MenuLink[]>(initial);
  const [state, formAction, pending] = useActionState(
    saveMenusAction,
    initialState,
  );

  const rid = () =>
    `menu_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const patch = (id: string, next: Partial<MenuLink>) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...next } : l)));

  const addLink = (location: MenuLocation) => {
    const order =
      Math.max(
        -1,
        ...links.filter((l) => l.location === location).map((l) => l.order),
      ) + 1;
    setLinks((prev) => [
      ...prev,
      {
        id: rid(),
        label: "New link",
        href: "/",
        location,
        order,
        visible: true,
      },
    ]);
  };

  const remove = (id: string) =>
    setLinks((prev) => prev.filter((l) => l.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    setLinks((prev) => {
      const link = prev.find((l) => l.id === id);
      if (!link) return prev;
      const siblings = prev
        .filter((l) => l.location === link.location)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (target < 0 || target >= siblings.length) return prev;
      const swap = siblings[target];
      return prev.map((l) => {
        if (l.id === id) return { ...l, order: swap.order };
        if (l.id === swap.id) return { ...l, order: link.order };
        return l;
      });
    });
  };

  const forLocation = (loc: MenuLocation) =>
    links.filter((l) => l.location === loc).sort((a, b) => a.order - b.order);

  const banner = state.ok
    ? state.message
      ? { tone: "ok" as const, text: state.message }
      : null
    : { tone: "error" as const, text: state.error };

  return (
    <form action={formAction} className="mc-admin__form">
      {banner && (
        <p
          className={cx(
            "mc-admin__banner",
            banner.tone === "error" && "is-error",
          )}
          role={banner.tone === "error" ? "alert" : "status"}
        >
          {banner.text}
        </p>
      )}

      {/* Payload — server action reads this. Keeps a single source of truth. */}
      <input
        type="hidden"
        name="linksJson"
        value={JSON.stringify(links)}
        readOnly
      />

      {(["header", "footer"] as const).map((loc) => {
        const rows = forLocation(loc);
        return (
          <fieldset key={loc} className="mc-fieldset">
            <legend style={{ textTransform: "capitalize" }}>{loc} menu</legend>
            <div style={{ display: "grid", gap: 10 }}>
              {rows.length === 0 ? (
                <p className="mc-admin__hint">
                  No {loc} links yet. Click <em>Add link</em> below.
                </p>
              ) : (
                rows.map((l, i) => (
                  <MenuRow
                    key={l.id}
                    link={l}
                    isFirst={i === 0}
                    isLast={i === rows.length - 1}
                    onPatch={(patchObj) => patch(l.id, patchObj)}
                    onMove={(d) => move(l.id, d)}
                    onDelete={() => remove(l.id)}
                  />
                ))
              )}
              <button
                type="button"
                className="mc-btn mc-btn--ghost"
                onClick={() => addLink(loc)}
                style={{ justifySelf: "start" }}
              >
                + Add {loc} link
              </button>
            </div>
          </fieldset>
        );
      })}

      <div className="mc-admin__form-actions">
        <button
          type="submit"
          className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
          disabled={pending}
        >
          {pending ? "Saving…" : "Save Menus"}
        </button>
      </div>
    </form>
  );
}

function MenuRow({
  link,
  isFirst,
  isLast,
  onPatch,
  onMove,
  onDelete,
}: {
  link: MenuLink;
  isFirst: boolean;
  isLast: boolean;
  onPatch: (p: Partial<MenuLink>) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr auto auto auto",
        gap: 8,
        alignItems: "center",
        border: "1px solid var(--mc-border, #e5e5e5)",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          type="button"
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className="mc-btn mc-btn--icon"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
          className="mc-btn mc-btn--icon"
        >
          ↓
        </button>
      </div>
      <input
        aria-label="Label"
        placeholder="Label"
        value={link.label}
        onChange={(e) => onPatch({ label: e.target.value })}
      />
      <input
        aria-label="URL"
        placeholder="/shop"
        value={link.href}
        onChange={(e) => onPatch({ href: e.target.value })}
      />
      <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={link.visible}
          onChange={(e) => onPatch({ visible: e.target.checked })}
        />
        Show
      </label>
      <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={!!link.external}
          onChange={(e) => onPatch({ external: e.target.checked })}
        />
        External
      </label>
      <button
        type="button"
        onClick={onDelete}
        className="mc-btn mc-btn--danger"
        aria-label="Delete link"
      >
        ✕
      </button>
    </div>
  );
}
