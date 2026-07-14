import CategoryForm from "@/components/admin/CategoryForm";
import { getCategories } from "@/lib/data";

export const metadata = { title: "New Category · Admin · MayCSS" };

export default async function NewCategoryPage() {
  const allCategories = await getCategories();
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>New Category</h1>
          <p>Add a new category or sub-category.</p>
        </div>
      </header>
      <CategoryForm allCategories={allCategories} />
    </section>
  );
}
