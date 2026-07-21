import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/maycss/globals.css";
import "@/styles/maycss/components.css";
import "@/styles/maycss/admin.css";
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
import { getAppConfig } from "@/lib/app-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getAppConfig();
  return {
    title: `${cfg.siteName} — ${cfg.tagline}`,
    description: cfg.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfg = await getAppConfig();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}
    >
      <body className="mc-body">
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
