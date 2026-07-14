import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Admin Sign In · MayCSS",
  description: "Sign in to the MayCSS admin dashboard.",
};

type Props = { searchParams: Promise<{ from?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { from } = await searchParams;

  return (
    <div className="mc-admin-login">
      <div className="mc-admin-login__card">
        <div className="mc-admin-login__brand">
          <span className="mc-navbar__brand-mark">M</span>
          <div>
            <p className="mc-admin-login__brand-name">MayCSS</p>
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
