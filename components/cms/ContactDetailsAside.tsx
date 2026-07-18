import type { ContactDetails } from "@/lib/pages";

function linkifyLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return (
      <a href={`mailto:${trimmed}`}>{trimmed}</a>
    );
  }
  if (/^\+?[\d\s().-]{7,}$/.test(trimmed)) {
    return (
      <a href={`tel:${trimmed.replace(/[^\d+]/g, "")}`}>{trimmed}</a>
    );
  }
  return trimmed;
}

/**
 * Contact page sidebar — fully driven by CMS `page.contactDetails`.
 */
export default function ContactDetailsAside({
  details,
}: {
  details: ContactDetails;
}) {
  const heading = details.heading?.trim();
  const lead = details.lead?.trim();
  const rows = (details.rows ?? []).filter(
    (r) => r.label?.trim() || r.body?.trim(),
  );

  if (!heading && !lead && rows.length === 0) return null;

  return (
    <aside className="mc-contact__details mc-contact__details--cms">
      {heading && <h2>{heading}</h2>}
      {lead && <p className="mc-contact__details-lead">{lead}</p>}
      {rows.length > 0 && (
        <dl className="mc-contact__list">
          {rows.map((row) => {
            const lines = (row.body || "").split("\n");
            return (
              <div key={row.id}>
                {row.label?.trim() && <dt>{row.label.trim()}</dt>}
                <dd>
                  {lines.map((line, i) => {
                    const content = linkifyLine(line);
                    if (content === null) return null;
                    return (
                      <span key={`${row.id}-${i}`}>
                        {i > 0 && <br />}
                        {content}
                      </span>
                    );
                  })}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </aside>
  );
}
