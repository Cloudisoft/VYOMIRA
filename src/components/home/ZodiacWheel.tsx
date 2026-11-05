"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SIGNS } from "@/lib/astro/constants";
import { SectionHeading } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Original abstract star figures (not star-catalog constellations), one per sign, in a 0..40 box. */
const FIGURES: [number, number][][] = [
  [[4, 30], [10, 14], [20, 10], [28, 16], [36, 6]],
  [[6, 6], [14, 20], [20, 30], [26, 20], [34, 6]],
  [[10, 4], [10, 36], [30, 4], [30, 36], [10, 20], [30, 20]],
  [[4, 16], [14, 10], [26, 10], [36, 16], [20, 28]],
  [[6, 30], [14, 18], [22, 10], [32, 12], [36, 24]],
  [[6, 8], [14, 22], [22, 8], [30, 22], [34, 34]],
  [[4, 28], [36, 28], [20, 28], [20, 14], [10, 8], [30, 8]],
  [[4, 10], [12, 18], [20, 24], [28, 26], [36, 18], [34, 8]],
  [[4, 36], [16, 24], [28, 12], [36, 4], [26, 4], [36, 14]],
  [[4, 8], [12, 26], [22, 30], [30, 18], [36, 30]],
  [[4, 14], [14, 8], [24, 14], [34, 8], [8, 28], [30, 28]],
  [[6, 6], [12, 20], [6, 34], [34, 6], [28, 20], [34, 34]],
];

export function ZodiacWheel() {
  const [active, setActive] = useState(0);
  const sign = SIGNS[active];
  const R = 210;
  const f = (n: number) => Number(n.toFixed(2));
  return (
    <section className="relative overflow-hidden py-28 md:py-36" aria-labelledby="zodiac-title">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(114,86,216,.16),transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="The sidereal zodiac" title={<span id="zodiac-title">A Universe Uniquely Yours</span>} intro="Vedic astrology measures the twelve rashis against the fixed stars, not the seasons. Select a sign to see its element, quality and planetary ruler." />
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }} className="glass mt-10 rounded-3xl p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-4xl text-moon">{sign.name}</h3>
                <span className="font-display text-2xl text-gold">{sign.hi}</span>
              </div>
              <p className="mt-1 text-sm tracking-widest text-slate uppercase">{sign.sanskrit} · {active * 30}°–{active * 30 + 30}°</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <div><dt className="text-slate">Element</dt><dd className="mt-1 text-moon">{sign.element}</dd></div>
                <div><dt className="text-slate">Quality</dt><dd className="mt-1 text-moon">{sign.modality}</dd></div>
                <div><dt className="text-slate">Ruler</dt><dd className="mt-1 text-gold">{sign.lord}</dd></div>
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <svg viewBox="-260 -260 520 520" className="h-full w-full" role="group" aria-label="Zodiac wheel">
            <circle r="236" fill="none" stroke="rgba(216,180,119,.25)" />
            <circle r="168" fill="none" stroke="rgba(165,139,255,.18)" strokeDasharray="2 6" />
            <motion.circle r="120" fill="none" stroke="rgba(216,180,119,.15)" animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} strokeDasharray="1 10" />
            {SIGNS.map((s, i) => {
              const a = (i * 30 - 90 + 15) * (Math.PI / 180);
              const x = f(Math.cos(a) * R), y = f(Math.sin(a) * R);
              const la = (i * 30 - 90) * (Math.PI / 180);
              const on = i === active;
              return (
                <g key={s.name}>
                  <line x1={f(Math.cos(la) * 168)} y1={f(Math.sin(la) * 168)} x2={f(Math.cos(la) * 236)} y2={f(Math.sin(la) * 236)} stroke="rgba(165,139,255,.2)" />
                  <g
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    aria-label={`${s.name} (${s.sanskrit})`}
                    transform={`translate(${x - 20} ${y - 20})`}
                    className="cursor-pointer outline-none"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActive(i); }}
                  >
                    <rect x="-6" y="-6" width="52" height="52" rx="14" fill={on ? "rgba(216,180,119,.1)" : "transparent"} />
                    <polyline points={FIGURES[i].map((p) => p.join(",")).join(" ")} fill="none" stroke={on ? "#D8B477" : "rgba(233,227,245,.35)"} strokeWidth={on ? 1.2 : 0.8} />
                    {FIGURES[i].map(([px, py], k) => (
                      <circle key={k} cx={px} cy={py} r={on ? 2.2 : 1.5} fill={on ? "#F1DCAE" : "#E9E3F5"} opacity={on ? 1 : 0.6} />
                    ))}
                  </g>
                  <text x={f(Math.cos(a) * 146)} y={f(Math.sin(a) * 146 + 4)} textAnchor="middle" fontSize="11" letterSpacing="2" className={cn("transition-all")} fill={on ? "#D8B477" : "#9BA3BC"}>{s.sanskrit.toUpperCase()}</text>
                </g>
              );
            })}
            <text y="-6" textAnchor="middle" fontSize="40" fill="#E9E3F5" fontFamily="var(--font-display)">{sign.hi}</text>
            <text y="22" textAnchor="middle" fontSize="10" letterSpacing="4" fill="#9BA3BC">RASHI {active + 1}</text>
          </svg>
        </div>
      </div>
    </section>
  );
}
