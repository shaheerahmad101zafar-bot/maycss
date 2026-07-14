import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/data";
import { getBlockTemplates } from "@/lib/blocks/templates";

export const metadata = { title: "New Product · Admin · MayCSS" };

export default async function NewProductPage() {
  const [categories, templates] = await Promise.all([
    getCategories(),
    getBlockTemplates(),
  ]);
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>New Product</h1>
          <p>
            Add a new item to your catalog. Use the <strong>Dynamic content</strong> section
            at the bottom to add rich blocks that render below the standard PDP.
          </p>
        </div>
      </header>
      <ProductForm categories={categories} templates={templates} />
    </section>
  );
}
