import Link from "next/link";

type TextLogoProps = {
  siteName: string;
  tagline?: string;
  variant?: "navbar" | "footer";
};

export default function TextLogo({
  siteName,
  tagline,
  variant = "navbar",
}: TextLogoProps) {
  const fallbackTagline = tagline || "Curated luxury fashion";

  return (
    <Link
      href="/"
      className={`mc-text-logo mc-text-logo--${variant}`}
      aria-label={`${siteName} home`}
    >
      <span className="mc-text-logo__name">{siteName}</span>
      {variant === "navbar" && (
        <span className="mc-text-logo__tagline mc-navbar__brand-text">
          {fallbackTagline}
        </span>
      )}
      <span className="mc-text-logo__rule" aria-hidden />
    </Link>
  );
}
