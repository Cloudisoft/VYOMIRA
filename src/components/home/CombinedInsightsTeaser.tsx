import Link from "next/link";
import { Orbit, Hash, Hand, Layers } from "lucide-react";
import { SectionHeading } from "@/components/ui/Reveal";

const ROWS = [
  { area: "Career", points: [["astrology", "Your current dasha favours steady, visible effort at work."], ["numerology", "Expression 4 — you build through systems and follow-through."], ["palmistry", "A long, clear head line is traditionally read as methodical thinking."]] },
  { area: "Relationships", points: [["astrology", "Venus periods ahead bring warmth to close bonds."], ["numerology", "Soul Urge 2 — reassurance and closeness matter to you."], ["tarot", "Two of Cups (Present) for your question about a partnership."]] },
] as const;
const ICON = { astrology: Orbit, numerology: Hash, palmistry: Hand, tarot: Layers } as const;
const CLS = { astrology: "bg-amethyst/15 text-amethyst", numerology: "bg-gold/15 text-gold", palmistry: "bg-emerald-400/15 text-emerald-300", tarot: "bg-sky-400/15 text-sky-300" } as const;

export function CombinedInsightsTeaser() {
  return (
    <section id="combined" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Combined Insights" title={<>Where the traditions <span className="text-gradient-violet">meet.</span></>} intro="Career, relationships, growth and money — gathered from the readings you actually have, with every point labelled by the system it came from. Where they agree, it's worth noticing. Where they differ, you see both. Interpretive traditions, presented honestly — never as science." />
          <Link href="/dashboard/insights" className="btn-ghost mt-8">See my Combined Insights</Link>
        </div>
        <div className="space-y-4" aria-label="Example of Combined Insights (illustrative)">
          {ROWS.map((r) => (
            <div key={r.area} className="glass rounded-[1.5rem] p-6">
              <p className="font-display text-2xl">{r.area} Insight</p>
              <ul className="mt-4 space-y-3">
                {r.points.map(([sys, text]) => { const I = ICON[sys]; return (
                  <li key={text} className="flex gap-3 text-sm text-moon/85"><span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${CLS[sys]}`}><I className="h-3.5 w-3.5" /></span><span><span className="text-xs tracking-wider text-slate uppercase">{sys}</span><br />{text}</span></li>
                ); })}
              </ul>
            </div>
          ))}
          <p className="text-xs text-slate">Illustrative example.</p>
        </div>
      </div>
    </section>
  );
}
