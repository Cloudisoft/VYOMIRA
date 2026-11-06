import type { Metadata } from "next";
import { Pricing } from "@/components/home/Pricing";
import { Faq } from "@/components/home/Faq";

export const metadata: Metadata = { title: "Pricing — Free Kundli, AI astrologer from ₹199", description: "Your Vedic Kundli is free forever. Ask AURA, the AI astrologer, with packs from ₹199 (10 messages) or ₹599 (25 messages + reports), or monthly plans from ₹349. Local-currency pricing, cancel anytime.", alternates: { canonical: "/pricing" }, openGraph: { url: "/pricing", images: [{ url: "/og/pricing.jpg", width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", images: ["/og/pricing.jpg"] } };

export default function PricingPage() {
  return (
    <>
      <section className="px-6 pt-36 text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl sm:text-6xl">Honest prices for an honest practice.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate">Your Kundli is free forever. Talk with AURA through a one-time pack that never expires, or a monthly plan you can cancel anytime.</p>
      </section>
      <Pricing compact />
      <Faq />
    </>
  );
}
