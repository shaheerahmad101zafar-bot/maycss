"use client";

import type { ContactDetailRow, ContactDetails } from "@/lib/pages";

interface Props {
  value: ContactDetails;
  onChange: (next: ContactDetails) => void;
}

function newRow(): ContactDetailRow {
  return {
    id: `cdr_${Math.random().toString(36).slice(2, 10)}`,
    label: "",
    body: "",
  };
}

/**
 * Sidebar content for Contact pages — heading, lead, and label/body rows.
 * Saved immediately into parent state (hidden JSON on submit).
 */
export default function ContactDetailsEditor({ value, onChange }: Props) {
  const rows = value.rows ?? [];

  const setHeading = (heading: string) => onChange({ ...value, heading });
  const setLead = (lead: string) => onChange({ ...value, lead });

  const updateRow = (id: string, patch: Partial<ContactDetailRow>) => {
    onChange({
      ...value,
      rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRow = (id: string) => {
    onChange({ ...value, rows: rows.filter((r) => r.id !== id) });
  };

  const addRow = () => {
    onChange({ ...value, rows: [...rows, newRow()] });
  };

  return (
    <div className="mc-contact-details-editor">
      <input
        type="hidden"
        name="contactDetailsJson"
        value={JSON.stringify(value)}
      />

      <div className="mc-admin__form-grid">
        <div className="mc-field mc-field--full">
          <label htmlFor="contactDetailsHeading">Sidebar heading</label>
          <input
            id="contactDetailsHeading"
            value={value.heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Visit & Connect"
          />
        </div>
        <div className="mc-field mc-field--full">
          <label htmlFor="contactDetailsLead">Sidebar intro</label>
          <textarea
            id="contactDetailsLead"
            rows={2}
            value={value.lead}
            onChange={(e) => setLead(e.target.value)}
            placeholder="Experience MayCSS in person or reach us through any channel below."
          />
        </div>
      </div>

      <div className="mc-contact-details-editor__rows">
        <p className="mc-admin__hint" style={{ marginBottom: 10 }}>
          Detail rows (address, hours, email, phone, etc.). Add as many as you
          need — each shows as a label + text on the Contact page sidebar.
        </p>
        {rows.map((row, index) => (
          <div key={row.id} className="mc-contact-details-editor__row">
            <div className="mc-contact-details-editor__row-head">
              <span>Row {index + 1}</span>
              <button
                type="button"
                className="mc-btn mc-btn--ghost"
                onClick={() => removeRow(row.id)}
              >
                Remove
              </button>
            </div>
            <div className="mc-admin__form-grid">
              <div className="mc-field">
                <label htmlFor={`cd-label-${row.id}`}>Label</label>
                <input
                  id={`cd-label-${row.id}`}
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  placeholder="Email"
                />
              </div>
              <div className="mc-field mc-field--full">
                <label htmlFor={`cd-body-${row.id}`}>Text</label>
                <textarea
                  id={`cd-body-${row.id}`}
                  rows={2}
                  value={row.body}
                  onChange={(e) => updateRow(row.id, { body: e.target.value })}
                  placeholder={"450 Madison Avenue\nNew York, NY 10022"}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="mc-btn mc-btn--ghost" onClick={addRow}>
          + Add detail row
        </button>
      </div>
    </div>
  );
}
