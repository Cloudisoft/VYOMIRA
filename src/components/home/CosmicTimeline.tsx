"use client";
import { motion } from "motion/react";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";
import type { SampleData } from "./types";
import { ORDINAL } from "@/lib/interpret/catalog";

const COLORS: Record<string, string> = { Sun: "#E8B86A", Moon: "#E9E3F5", Mars: "#E07A5F", Mercury: "#7FD1AE", Jupiter: "#F1DCAE", Venus: "#F2A7C3", Saturn: "#8C9EFF", Rahu: "#A58BFF", Ketu: "#B39DDB" };

export function CosmicTimeline({ sample }: { sample: SampleData }) {
  const mds = sample.chart.dasha.mahadashas;
  const start = Date.parse(sample.chart.input.utc);
  const end = Date.parse(mds[mds.length - 1].end);
  const now = Date.parse(sample.transits.at);
  const pct = (t: number) => Number((((Math.max(t, start) - start) / (end - start)) * 100).toFixed(3));
  const slow = sample.transits.placements.filter((p) => ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.planet));
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="timeline-title">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Time, measured in planets" title={<span id="timeline-title">Your life, in planetary periods.</span>} intro="Vimshottari Dasha divides 120 years into nine planetary chapters, each opened by the Moon's nakshatra at your birth. Transits show where the planets are today — relative to your natal Moon." />
        <Reveal className="mt-16">
          <div className="relative">
            <div className="flex h-24 items-end gap-[2px] overflow-hidden rounded-2xl">
              {mds.map((m, i) => {
                const w = pct(Date.parse(m.end)) - pct(Date.parse(m.start));
                const cur = Date.parse(m.start) <= now && now < Date.parse(m.end);
                return (
                  <motion.div key={m.start} className="relative h-full" style={{ width: `${w}%` }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="absolute inset-0 origin-bottom rounded-md" style={{ background: `linear-gradient(180deg, ${COLORS[m.lord]}${cur ? "cc" : "40"}, ${COLORS[m.lord]}10)` }} />
                    {w > 6 && <span className="absolute bottom-2 left-2 text-xs font-medium text-navy mix-blend-normal" style={{ color: cur ? "#080D20" : "#E9E3F5" }}>{m.lord}</span>}
                  </motion.div>
                );
              })}
            </div>
            <div className="absolute -top-6 bottom-0 w-px bg-gold" style={{ left: `${pct(now)}%` }}>
              <span className="absolute -top-1 left-2 text-[10px] tracking-[0.3em] text-gold">NOW</span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate"><span>Birth · {sample.chart.input.utc.slice(0, 4)}</span><span>{new Date(end).getFullYear()}</span></div>
          </div>
        </Reveal>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {slow.map((p, i) => (
            <Reveal key={p.planet} delay={i * 0.08}>
              <div className="glass rounded-2xl p-5">
                <p className="text-xs tracking-[0.25em] text-slate uppercase">Transit today</p>
                <p className="mt-2 font-display text-2xl">{p.planet} <span className="text-slate">in</span> {p.signName}</p>
                <p className="mt-1 text-sm text-slate">{p.degree.toFixed(1)}° · {p.nakshatra}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " · retrograde" : ""}</p>
                <p className="mt-3 text-xs text-gold">{ORDINAL[p.houseFromMoon]} from the sample natal Moon</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
