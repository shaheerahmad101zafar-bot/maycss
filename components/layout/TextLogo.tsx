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
  const isMyacss = siteName.trim().toLowerCase() === "myacss";

  return (
    <Link
      href="/"
      className={`mc-text-logo mc-text-logo--${variant}${isMyacss ? " mc-text-logo--myacss" : ""}`}
      aria-label={`${siteName} home`}
    >
      <span className="mc-text-logo__name">
        {isMyacss ? (
          <>
            <span className="mc-text-logo__my">my</span>
            <span className="mc-text-logo__acss">acss</span>
          </>
        ) : (
          siteName
        )}
      </span>
      {variant === "navbar" && (
        <span className="mc-text-logo__tagline mc-navbar__brand-text">
          {fallbackTagline}
        </span>
      )}
      <span className="mc-text-logo__rule" aria-hidden />
    </Link>
  );
}
