import LoginForm from "@/components/admin/LoginForm";
import { getAppConfig } from "@/lib/app-config";

export async function generateMetadata() {
  const cfg = await getAppConfig();
  return {
    title: `Admin Sign In · ${cfg.siteName}`,
    description: `Sign in to the ${cfg.siteName} admin dashboard.`,
  };
}

type Props = { searchParams: Promise<{ from?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const [{ from }, cfg] = await Promise.all([searchParams, getAppConfig()]);
  const brandMark = cfg.siteName.charAt(0).toLowerCase();

  return (
    <div className="mc-admin-login">
      <div className="mc-admin-login__card">
        <div className="mc-admin-login__brand">
          <span className="mc-navbar__brand-mark">{brandMark}</span>
          <div>
            <p className="mc-admin-login__brand-name">{cfg.siteName}</p>
            <p className="mc-admin-login__brand-sub">Admin Console</p>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="mc-admin-login__desc">
          This area is restricted to store administrators.
        </p>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
