import Link from "next/link";
import { Telescope, ScrollText, Cpu, Lock } from "lucide-react";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";
import { COMPUTATION_VERSION } from "@/lib/astro/chart";

const PILLARS = [
  { icon: Telescope, t: "Astronomy", d: "Planetary positions are computed — not looked up — and regression-tested against an independent Swiss Ephemeris reference across centuries, hemispheres and DST edges. Typical agreement: within a few arcseconds." },
  { icon: ScrollText, t: "Astrology", d: "Interpretations come from a versioned rule catalog rooted in Parashari tradition. They are traditional readings, not scientific predictions, and we say so." },
  { icon: Cpu, t: "AI", d: "The language model only phrases evidence we hand it. A validator rejects any placement, yoga, dasha or date not in your chart, and falls back to the rule engine." },
  { icon: Lock, t: "Privacy", d: "Birth details are encrypted at rest with AES-256-GCM, never written to logs or analytics, and shared with an AI provider only with your explicit consent." },
];

export function Methodology() {
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="method-title">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading eyebrow="Methodology & trust" title={<span id="method-title">Astronomy, astrology and AI — kept honestly apart.</span>} />
            <Reveal delay={0.1}>
              <dl className="mt-10 space-y-3 rounded-3xl border hairline bg-surface/40 p-6 font-mono text-[12px] leading-relaxed text-slate">
                {[["engine", COMPUTATION_VERSION.id], ["zodiac", "sidereal"], ["ayanamsa", "Lahiri (Chitrapaksha)"], ["ephemeris", COMPUTATION_VERSION.ephemeris], ["houses", "whole-sign"], ["nodes", "mean"], ["dasha", `Vimshottari · ${COMPUTATION_VERSION.dashaYear}/yr`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-dashed border-white/5 pb-2 last:border-0"><dt className="text-amethyst">{k}</dt><dd className="text-right text-moon/90">{v}</dd></div>
                ))}
              </dl>
              <Link href="/methodology" className="mt-6 inline-block text-sm text-gold underline-offset-4 hover:underline">Read the full methodology →</Link>
            </Reveal>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.08}>
                <div className="h-full rounded-3xl border hairline bg-gradient-to-b from-surface/70 to-transparent p-7">
                  <p.icon className="h-6 w-6 text-gold" />
                  <h3 className="mt-5 text-2xl">{p.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
