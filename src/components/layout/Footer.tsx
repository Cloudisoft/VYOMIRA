import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLS = [
  { title: "Product", links: [["Birth Chart", "/onboarding"], ["AURA", "/#aura"], ["Reports", "/#readings"], ["Pricing", "/pricing"]] },
  { title: "Understand", links: [["Learn Jyotish", "/learn"], ["Methodology", "/methodology"], ["FAQ", "/#faq"]] },
  { title: "Trust", links: [["Privacy Notice", "/legal/privacy"], ["Terms of Service", "/legal/terms"], ["Refund Policy", "/legal/refunds"], ["Astrology Disclaimer", "/legal/disclaimer"], ["Attributions", "/legal/attributions"]] },
  { title: "Support", links: [["Contact", "/contact"], ["support@vyomira.app", "mailto:support@vyomira.app"]] },
];

export function Footer() {
  return (
    <footer className="relative border-t hairline bg-navy">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo showTagline />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-slate">Planetary positions computed from real astronomy. Interpretations offered as tradition, never as certainty.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow !text-[0.62rem]">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="text-sm text-slate transition-colors hover:text-moon">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t hairline">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-slate/70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} VYOMIRA. Astrology is offered for reflection and entertainment; it is not a substitute for professional advice.</p>
          <p>Place data © GeoNames (CC BY 4.0)</p>
        </div>
      </div>
    </footer>
  );
}
