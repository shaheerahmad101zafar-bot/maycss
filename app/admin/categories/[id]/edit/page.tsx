import { notFound } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import { getCategories, getCategoryById } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const category = await getCategoryById(id);
  return {
    title: `Edit ${category?.name ?? "Category"} · Admin · MayCSS`,
  };
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([
    getCategoryById(id),
    getCategories(),
  ]);
  if (!category) notFound();

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Edit Category</h1>
          <p>
            Editing &ldquo;{category.name}&rdquo; &middot; ID {category.id}
          </p>
        </div>
      </header>
      <CategoryForm category={category} allCategories={allCategories} />
    </section>
  );
}
