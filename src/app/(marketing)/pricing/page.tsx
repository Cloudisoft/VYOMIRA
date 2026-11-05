import type { Metadata } from "next";
import { Pricing } from "@/components/home/Pricing";
import { Faq } from "@/components/home/Faq";

export const metadata: Metadata = { title: "Pricing", description: "Free Vedic Kundli. Starter ₹199 for 10 AURA messages. Cosmic Plus ₹599 for 25 messages and every detailed report. Local currency pricing." };

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
