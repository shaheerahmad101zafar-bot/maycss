import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories, getProductById } from "@/lib/data";
import { getBlockTemplates } from "@/lib/blocks/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  noStore();
  const { id } = await params;
  const product = await getProductById(id);
  return {
    title: `Edit ${product?.name ?? "Product"} · Admin · MayCSS`,
  };
}

export default async function EditProductPage({ params }: Props) {
  // Always read fresh Blob records after import — never serve a cached miss.
  noStore();
  const { id } = await params;
  const [product, categories, templates] = await Promise.all([
    getProductById(id),
    getCategories(),
    getBlockTemplates(),
  ]);
  if (!product) notFound();

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Edit Product</h1>
          <p>
            Editing &ldquo;{product.name}&rdquo; &middot; ID {product.id}
          </p>
        </div>
      </header>
      <ProductForm
        product={product}
        categories={categories}
        templates={templates}
      />
    </section>
  );
}
