import MarketingBanner from "@/components/marketing/MarketingBanner";
import { getBannerSlides } from "@/lib/data";

/** Shared Black Friday hero slider used across campaign pages. */
export default async function BlackFridayHero() {
  const slides = await getBannerSlides();
  if (slides.length === 0) return null;

  return (
    <MarketingBanner
      slides={slides}
      showDelay={0}
      slideInterval={4500}
      countdownTo="2026-12-01T00:00:00.000Z"
    />
  );
}
