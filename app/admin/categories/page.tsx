import { Fragment } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";

export const metadata = { title: "Categories · Admin · MayCSS" };

type Props = {
  searchParams: Promise<{ deleted?: string; error?: string }>;
};

export default async function AdminCategoriesPage({ searchParams }: Props) {
  noStore();
  const { deleted, error } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories({ fresh: true }),
    getProducts({ fresh: true }),
  ]);

  const roots = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const childrenOf = (parentId: string) =>
    categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const productCount = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId).length;

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Categories</h1>
          <p>
            {categories.length} categories &middot; {roots.length} top-level.
          </p>
        </div>
        <Link href="/admin/categories/new" className="mc-btn mc-btn--primary">
          + New Category
        </Link>
      </header>

      {deleted && (
        <p className="mc-admin__banner" role="status">
          Category deleted.
        </p>
      )}
      {error === "delete-failed" && (
        <p className="mc-admin__banner is-error" role="alert">
          Delete failed — check Vercel Blob storage, then try again.
        </p>
      )}
      {error === "has-children" && (
        <p className="mc-admin__banner is-error" role="alert">
          This category has sub-categories. Choose how to handle them in the
          delete dialog.
        </p>
      )}

      <div className="mc-admin__table-wrap">
        <table className="mc-admin__table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Slug</th>
              <th scope="col">Products</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {roots.map((root) => {
              const rootKids = childrenOf(root.id);
              const rootUsed = productCount(root.id);
              return (
                <Fragment key={root.id}>
                  <tr>
                    <td>
                      <div className="mc-admin__row-product">
                        <div
                          style={{
                            width: 44,
                            height: 54,
                            borderRadius: 4,
                            background: "var(--mc-cream)",
                            backgroundImage: root.image
                              ? `url(${root.image})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        <div>
                          <p className="mc-admin__row-name">{root.name}</p>
                          <p className="mc-admin__row-id">
                            Top-level &middot; ID {root.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>{root.slug}</code>
                    </td>
                    <td>
                      {rootUsed} direct
                      {rootKids.length > 0 && ` · ${rootKids.length} subs`}
                    </td>
                    <td>
                      <div className="mc-admin__actions">
                        <Link
                          href={`/admin/categories/${root.id}/edit`}
                          className="mc-admin__link"
                        >
                          Edit
                        </Link>
                        <DeleteCategoryButton
                          id={root.id}
                          name={root.name}
                          childCount={rootKids.length}
                          productCount={rootUsed}
                        />
                      </div>
                    </td>
                  </tr>
                  {rootKids.map((sub) => {
                    const subUsed = productCount(sub.id);
                    return (
                      <tr key={sub.id}>
                        <td style={{ paddingLeft: 40 }}>
                          <div className="mc-admin__row-product">
                            <div
                              style={{
                                width: 32,
                                height: 40,
                                borderRadius: 4,
                                background: "var(--mc-cream)",
                                backgroundImage: sub.image
                                  ? `url(${sub.image})`
                                  : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                            <div>
                              <p className="mc-admin__row-name">
                                ↳ {sub.name}
                              </p>
                              <p className="mc-admin__row-id">
                                Under {root.name} &middot; ID {sub.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code>{sub.slug}</code>
                        </td>
                        <td>{subUsed} products</td>
                        <td>
                          <div className="mc-admin__actions">
                            <Link
                              href={`/admin/categories/${sub.id}/edit`}
                              className="mc-admin__link"
                            >
                              Edit
                            </Link>
                            <DeleteCategoryButton
                              id={sub.id}
                              name={sub.name}
                              productCount={subUsed}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="mc-admin__empty-cell">
                  No categories yet — create one to organise your catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
