import PageForm from "@/components/admin/PageForm";
import { getBlockTemplates } from "@/lib/blocks/templates";

export const metadata = { title: "New Page · Admin · MayCSS" };

export default async function NewPageRoute() {
  const templates = await getBlockTemplates();
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>New Page</h1>
          <p>Publish a new page at <code>/{`{slug}`}</code>.</p>
        </div>
      </header>
      <PageForm templates={templates} />
    </section>
  );
}
