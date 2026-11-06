import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { StarField } from "@/components/cosmic/StarField";
import { Wizard } from "@/components/onboarding/Wizard";
import { BackHome } from "@/components/layout/BackHome";
import { WhatsAppButton } from "@/components/support/WhatsAppButton";

export const metadata: Metadata = { title: "Reveal your cosmic blueprint", description: "Enter your birth details to calculate your Vedic birth chart." };

export default function Onboarding() {
  return (
    <main id="main" className="relative min-h-dvh overflow-hidden">
      <StarField className="absolute inset-0 -z-10 h-full w-full" density={0.6} />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(114,86,216,.18),transparent_70%)]" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="VYOMIRA home"><Logo /></Link>
        <Link href="/sign-in" className="text-sm text-slate hover:text-moon"><span className="hidden sm:inline">Already have an account? </span>Sign in</Link>
      </header>
      <div className="mx-auto max-w-5xl px-6"><BackHome /></div>
      <div className="px-6 pt-8 pb-24 sm:pt-12"><Wizard /></div>
      <WhatsAppButton />
    </main>
  );
}
