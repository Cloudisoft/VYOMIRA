import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { StarField } from "@/components/cosmic/StarField";
import { PlanetFallback } from "@/components/cosmic/PlanetFallback";
import { BackHome } from "@/components/layout/BackHome";
import { WhatsAppButton } from "@/components/support/WhatsAppButton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="relative grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden border-r hairline lg:block">
        <StarField className="absolute inset-0 h-full w-full" density={0.8} />
        <PlanetFallback className="absolute -bottom-40 -left-40 w-[640px] opacity-80" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="VYOMIRA home"><Logo showTagline /></Link>
          <blockquote className="max-w-md">
            <p className="font-display text-4xl leading-tight text-moon">“Precise astronomy. Honest interpretation. A companion that shows its work.”</p>
            <p className="mt-4 text-sm text-slate">Your birth details are encrypted, never logged, and never shared with an AI provider without your consent.</p>
          </blockquote>
        </div>
      </aside>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <BackHome className="mb-8" />
          <Link href="/" className="mb-10 block w-fit lg:hidden" aria-label="VYOMIRA home"><Logo /></Link>
          {children}
        </div>
      </div>
      <WhatsAppButton />
    </main>
  );
}
