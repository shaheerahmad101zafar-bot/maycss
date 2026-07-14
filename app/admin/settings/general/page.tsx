import AppConfigForm from "@/components/admin/AppConfigForm";
import { getAppConfig } from "@/lib/app-config";

export const metadata = { title: "General · Admin · MayCSS" };

export default async function AdminGeneralSettingsPage() {
  const cfg = await getAppConfig();
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>General Settings</h1>
          <p>Site name, tagline, contact details and social links. Changes
            reflect across every page (footer, header, meta tags).</p>
        </div>
      </header>
      <AppConfigForm initial={cfg} />
    </section>
  );
}
