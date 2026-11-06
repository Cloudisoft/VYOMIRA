"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { SectionHeading } from "@/components/ui/Reveal";

const STEPS = [
  { t: "Share your birth details", d: "Name, date, time and birthplace. Tell us if your time is exact, approximate or unknown — we adjust what we show." },
  { t: "We resolve the moment", d: "Your birthplace's historical timezone converts local time to UTC, and the ephemeris computes the sky for that instant." },
  { t: "Your Kundli is built", d: "Lagna, houses, nakshatras, D9 and D10, yogas defined by documented rules, and your full Vimshottari timeline." },
  { t: "Personal insight, explained", d: "Readings and AURA's answers cite the exact chart factors used, with uncertainty stated plainly." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const len = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="How it works" title="From Birth Details to Personal Insight" />
        <div ref={ref} className="relative mt-16">
          <svg className="absolute top-0 left-[19px] h-full w-2 md:left-0 md:top-[27px] md:h-2 md:w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
            <line x1="1" y1="0" x2="1" y2="100" stroke="rgba(165,139,255,.2)" strokeWidth="2" vectorEffect="non-scaling-stroke" className="md:hidden" />
            <motion.line x1="1" y1="0" x2="1" y2="100" stroke="#D8B477" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength: len }} className="md:hidden" />
            <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(165,139,255,.2)" strokeWidth="2" vectorEffect="non-scaling-stroke" className="hidden md:block" />
            <motion.line x1="0" y1="1" x2="100" y2="1" stroke="#D8B477" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength: len }} className="hidden md:block" />
          </svg>
          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-8">
            {STEPS.map((s, i) => (
              <motion.li key={s.t} className="relative pl-14 md:pl-0" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.12 }}>
                <span className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-navy font-display text-lg text-gold md:relative md:mb-8 md:h-14 md:w-14 md:text-xl">{i + 1}</span>
                <h3 className="text-2xl text-moon">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate">{s.d}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
