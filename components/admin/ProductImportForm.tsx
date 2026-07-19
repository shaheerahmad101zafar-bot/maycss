"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  importProductFromUrlAction,
  type ImportProductState,
} from "@/app/admin/actions";
import type { Category } from "@/lib/utils";
import { cx } from "@/lib/utils";
import KeywordChipsInput from "./KeywordChipsInput";

const initial: ImportProductState | null = null;

interface Props {
  categories: Category[];
}

/**
 * Paste a URL → the server:
 *   1. Scrapes JSON-LD / OG meta from the source
 *   2. Auto-generates a long-form SEO article integrating the focus keyword
 *   3. Runs the article through the humanizer
 *   4. Creates a Draft product
 *   5. Redirects here — showing "Review draft" CTA
 */
export default function ProductImportForm({ categories }: Props) {
  const [state, formAction, pending] = useActionState(
    importProductFromUrlAction,
    initial,
  );
  const [url, setUrl] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [additionalKeywords, setAdditionalKeywords] = useState<string[]>([]);

  return (
    <div className="mc-import">
      <form action={formAction} className="mc-admin__form">
        <fieldset className="mc-fieldset">
          <legend>Import from URL</legend>
          <div className="mc-admin__form-grid">
            <div className="mc-field mc-field--full">
              <label htmlFor="url">Product URL *</label>
              <input
                id="url"
                name="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.macys.com/shop/product/…"
              />
              <p className="mc-admin__hint">
                Macy&apos;s links use their product API (name, price, sizes,
                colors, images, materials). Other stores work best with
                Schema.org Product JSON-LD (Nordstrom, Shopify, WooCommerce).
              </p>
            </div>

            <div className="mc-field mc-field--full">
              <label htmlFor="focusKeyword">Focus keyword *</label>
              <input
                id="focusKeyword"
                name="focusKeyword"
                required
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder='e.g. "silk wrap dress"'
              />
              <p className="mc-admin__hint">
                The auto-content writer weaves this phrase into every generated section.
              </p>
            </div>

            <KeywordChipsInput
              id="additionalKeywords"
              label="Additional keywords"
              keywords={additionalKeywords}
              onChange={setAdditionalKeywords}
              placeholder="secondary, long-tail, related"
              hint="Type a keyword and press Enter to add. Click × to remove."
            />
            <input
              type="hidden"
              name="additionalKeywords"
              value={additionalKeywords.join(", ")}
            />

            <div className="mc-field">
              <label htmlFor="categoryId">Category (optional)</label>
              <select id="categoryId" name="categoryId" defaultValue="">
                <option value="">— Assign later —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? "↳ " : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {state && !state.ok && (
          <p
            className="mc-admin__banner is-error"
            role="alert"
          >
            {state.error}
          </p>
        )}

        {state && state.ok && (
          <div className="mc-admin__banner">
            Draft created. Review the scraped fields and the auto-generated
            content below the standard PDP, then publish when ready.
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Link
                href={`/admin/products/${state.productId}/edit`}
                className="mc-btn mc-btn--primary"
              >
                Review draft →
              </Link>
              <Link
                href="/admin/products?filter=drafts"
                className="mc-btn mc-btn--ghost"
              >
                See all drafts
              </Link>
            </div>
          </div>
        )}

        <div className="mc-admin__form-actions">
          <button
            type="submit"
            className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
            disabled={pending}
          >
            {pending ? "Scraping & writing…" : "Import + Auto-write SEO"}
          </button>
          <Link href="/admin/products" className="mc-btn mc-btn--ghost">
            Cancel
          </Link>
        </div>
      </form>

      <aside className="mc-import__aside">
        <h3>What happens next</h3>
        <ol>
          <li>
            <strong>Fetch</strong> — we hit the URL server-side and parse
            structured product data.
          </li>
          <li>
            <strong>Auto-write</strong> — a long-form article with H2/H3
            headings is generated and integrated with your focus keyword.
          </li>
          <li>
            <strong>Humanize</strong> — the article is passed through the
            humanizer (contractions, phrase-swaps, AI-tell removal).
          </li>
          <li>
            <strong>Draft</strong> — the product lands in Drafts. Nothing
            appears on the storefront until you flip it to Published.
          </li>
        </ol>
        <p className="mc-admin__hint">
          To ship real LLM-quality content, swap{" "}
          <code>lib/ai/product-content-writer.ts</code>&rsquo;s
          <code> writeSection()</code> for a GPT-4 or Claude API call — every
          caller keeps working.
        </p>
      </aside>
    </div>
  );
}
