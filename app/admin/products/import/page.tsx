import ProductImportForm from "@/components/admin/ProductImportForm";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Import Product · Admin · MayCSS" };

export default async function ImportProductPage() {
  const categories = await getCategories();
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Import product from URL</h1>
          <p>
            Paste any product URL. We&apos;ll scrape name, price, images, colors
            and sizes — then auto-write a long-form SEO article and save it as
            a <strong>Draft</strong> for you to review.
          </p>
        </div>
      </header>
      <ProductImportForm categories={categories} />
    </section>
  );
}
