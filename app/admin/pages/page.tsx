import Link from "next/link";
import { PageFactory, type PageKind } from "@/lib/pages";
import DeletePageButton from "@/components/admin/DeletePageButton";
import DuplicatePageButton from "@/components/admin/DuplicatePageButton";
import { createOrEditHomePageAction } from "@/app/admin/actions";

export const metadata = { title: "Pages · Admin · MayCSS" };

const ROUTE_SLUGS: Record<string, string> = {
  home: "/",
  contact: "/contact",
  shop: "/shop",
  sale: "/sale",
};

function kindLabel(kind?: PageKind) {
  switch (kind) {
    case "contact":
      return "Contact";
    case "shop":
      return "Shop";
    case "sale":
      return "Sale";
    default:
      return "Standard";
  }
}

export default async function AdminPagesList() {
  const pages = await PageFactory.list();
  const homePage = pages.find((p) => p.slug === "home");
  const sorted = [...pages].sort((a, b) => {
    const order = ["home", "shop", "sale", "contact", "about"];
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Pages (CMS)</h1>
          <p>
            {pages.length} page{pages.length === 1 ? "" : "s"}. Every storefront
            page — Home, Shop, Sale, Contact, About — is managed here. SEO,
            banners, blocks, and page type all save to the live site instantly.
          </p>
        </div>
        <Link href="/admin/pages/new" className="mc-btn mc-btn--primary">
          + New Page
        </Link>
      </header>

      <div
        className="mc-admin__stat"
        style={{ marginBottom: 24, borderLeft: "4px solid var(--mc-gold, #b8956b)" }}
      >
        <p className="mc-admin__stat-label">Home Page</p>
        <p className="mc-admin__stat-value" style={{ fontSize: "1.1rem" }}>
          {homePage
            ? "Live — CMS blocks drive the storefront landing"
            : "Not customised — built-in fallback landing is showing"}
        </p>
        <form action={createOrEditHomePageAction} style={{ marginTop: 12 }}>
          <button type="submit" className="mc-btn mc-btn--primary">
            {homePage ? "Edit Home Page →" : "Create Home Page"}
          </button>
          {homePage && (
            <Link href="/" target="_blank" className="mc-btn mc-btn--ghost" style={{ marginLeft: 8 }}>
              View live →
            </Link>
          )}
        </form>
      </div>

      <div className="mc-admin__table-wrap">
        <table className="mc-admin__table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Route</th>
              <th scope="col">Type</th>
              <th scope="col">Published</th>
              <th scope="col">Blocks</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const route = ROUTE_SLUGS[p.slug] ?? `/${p.slug}`;
              return (
                <tr key={p.id}>
                  <td>
                    <p className="mc-admin__row-name" style={{ margin: 0 }}>
                      {p.title}
                      {p.pageKind === "contact" ? " (Contact Us)" : ""}
                    </p>
                    <p className="mc-admin__row-id">ID {p.id}</p>
                  </td>
                  <td>
                    <code>{route}</code>
                  </td>
                  <td>
                    <span className="mc-admin__row-id">{kindLabel(p.pageKind)}</span>
                  </td>
                  <td>
                    {p.published ? (
                      <span className="mc-status-pill is-status-completed">Published</span>
                    ) : (
                      <span className="mc-status-pill is-status-hold">Draft</span>
                    )}
                  </td>
                  <td>{p.blocks.length}</td>
                  <td>
                    <div className="mc-admin__actions">
                      <Link href={route} target="_blank" className="mc-admin__link">
                        View
                      </Link>
                      <Link href={`/admin/pages/${p.id}/edit`} className="mc-admin__link">
                        Edit
                      </Link>
                      <DuplicatePageButton id={p.id} title={p.title} />
                      {p.slug !== "home" && (
                        <DeletePageButton id={p.id} title={p.title} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
