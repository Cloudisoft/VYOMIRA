import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "VYOMIRA — Your Universe. Your Story.", template: "%s · VYOMIRA" },
  description: "Transparent Vedic birth charts computed from real astronomy, Vimshottari dasha timelines, and AURA — an AI companion that explains your chart without inventing it.",
  applicationName: "VYOMIRA",
  keywords: ["Vedic astrology", "Kundli", "Janam Kundli", "birth chart", "Nakshatra", "Vimshottari Dasha", "Jyotish", "Navamsa", "AI astrologer"],
  openGraph: { type: "website", siteName: "VYOMIRA", title: "VYOMIRA — Your Universe. Your Story.", description: "Premium cosmic experience. Transparent Vedic calculations. Personal guidance at an accessible price.", images: ["/brand/vyomira-banner.webp"] },
  twitter: { card: "summary_large_image", images: ["/brand/vyomira-banner.webp"] },
  robots: { index: true, follow: true },
  icons: { apple: "/brand/vyomira-app-logo.png" },
  // Google Search Console ownership (HTML tag method): set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the content value.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: "#080D20", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-navy antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-navy">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
