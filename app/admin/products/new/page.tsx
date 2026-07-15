import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/data";
import { getBlockTemplates } from "@/lib/blocks/templates";

export const metadata = { title: "New Product · Admin · myacss" };

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
            Paste a product URL in <strong>Auto-scrape</strong> to fill name,
            price, description, sizes, and colors — or enter details manually.
            Use <strong>Dynamic content</strong> below for rich PDP blocks.
          </p>
        </div>
      </header>
      <ProductForm categories={categories} templates={templates} />
    </section>
  );
}
