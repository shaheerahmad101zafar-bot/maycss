import { notFound } from "next/navigation";
import Link from "next/link";
import PageForm from "@/components/admin/PageForm";
import { PageFactory } from "@/lib/pages";
import { getBlockTemplates } from "@/lib/blocks/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const page = await PageFactory.getById(id);
  return { title: `Edit ${page?.title ?? "Page"} · Admin · MayCSS` };
}

export default async function EditPageRoute({ params }: Props) {
  const { id } = await params;
  const [page, templates] = await Promise.all([
    PageFactory.getById(id),
    getBlockTemplates(),
  ]);
  if (!page) notFound();
  const isHome = page.slug === "home";
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>{isHome ? "Edit Homepage" : "Edit Page"}</h1>
          <p>
            {isHome
              ? "Change every section on your storefront landing — hero, products, newsletter, and bottom text."
              : `Editing "${page.title}"`}
          </p>
        </div>
        {isHome && (
          <Link href="/" target="_blank" className="mc-btn mc-btn--ghost">
            View live →
          </Link>
        )}
      </header>
      <PageForm page={page} templates={templates} />
    </section>
  );
}
