import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/maycss/globals.css";
import "@/styles/maycss/components.css";
import "@/styles/maycss/responsive.css";
import "@/styles/maycss/storefront.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import PromoBar from "@/components/layout/PromoBar";
import Footer from "@/components/layout/Footer";
import CartDrawerLoader from "@/components/cart/CartDrawerLoader";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";
import ChatWidgetLoader from "@/components/public/ChatWidgetLoader";
import Analytics from "@/components/Analytics";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import { getAppConfig } from "@/lib/app-config";
import { MAYCSS_PRIMARY_KEYWORDS } from "@/lib/seo/maycss-keywords";
import { getSiteOrigin } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getAppConfig();
  const title = `${cfg.siteName} — ${cfg.tagline}`;
  const description =
    cfg.tagline ||
    "MAYCSS curated luxury fashion online — women clothes, dresses for women, jeans and denim, and fashion products from our clothing store.";
  const origin = getSiteOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: `%s · ${cfg.siteName}`,
    },
    description,
    keywords: [...MAYCSS_PRIMARY_KEYWORDS],
    openGraph: {
      title,
      description,
      siteName: cfg.siteName,
      type: "website",
      url: origin,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfg = await getAppConfig();
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body className="mc-body">
        <SiteJsonLd />
        <ChunkLoadRecovery />
        <SessionProviderWrapper>
          <CartProvider>
            <PromoBar />
            <Navbar />
            <main className="mc-main">{children}</main>
            <Footer />
            <CartDrawerLoader />
            <ChatWidgetLoader />
          </CartProvider>
        </SessionProviderWrapper>
        <Analytics config={cfg.analytics} />
      </body>
    </html>
  );
}
