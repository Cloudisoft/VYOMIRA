"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { StarField } from "@/components/cosmic/StarField";
import { HeroVisual } from "@/components/cosmic/HeroVisual";
import { Magnetic } from "@/components/motion/Magnetic";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Under reduced motion the parallax collapses to zero (same markup, no movement).
  const m = reduce ? 0 : 1;
  const planetY = useTransform(scrollYProgress, [0, 1], ["0%", `${38 * m}%`]);
  const planetScale = useTransform(scrollYProgress, [0, 1], [1, 1 - 0.45 * m]);
  const planetX = useTransform(scrollYProgress, [0, 1], ["0%", `${22 * m}%`]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", `${-18 * m}%`]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const words = "The universe has a story written in your stars.".split(" ");

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(114,86,216,.22),transparent_60%),radial-gradient(ellipse_60%_50%_at_10%_90%,rgba(216,180,119,.08),transparent_60%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="vy-aurora absolute top-[8%] right-[6%] h-[46vw] w-[46vw] rounded-full bg-[radial-gradient(circle,rgba(114,86,216,.28),transparent_65%)] blur-3xl" />
        <div className="vy-aurora-2 absolute bottom-[-10%] left-[-6%] h-[38vw] w-[38vw] rounded-full bg-[radial-gradient(circle,rgba(216,180,119,.12),transparent_65%)] blur-3xl" />
      </div>
      <StarField className="absolute inset-0 -z-10 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-navy" />

      <motion.div style={{ y: planetY, x: planetX, scale: planetScale }} className="absolute top-1/2 right-[-30%] -z-10 aspect-square w-[120vw] -translate-y-1/2 opacity-45 md:right-[-8%] md:w-[62vw] md:opacity-100 lg:w-[56vw]">
        <HeroVisual />
      </motion.div>

      <motion.div style={{ y: textY, opacity: fade }} className="mx-auto w-full max-w-7xl px-6">
        <div className="max-w-2xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="eyebrow">Vedic astrology · computed from the real sky</motion.p>
          <h1 className="mt-6 text-[2.9rem] leading-[0.98] text-moon sm:text-6xl md:text-7xl lg:text-[5.4rem]">
            {words.map((w, i) => (
              <span key={i}>
                <motion.span className="inline-block" initial={{ opacity: 0, y: 28, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1.1, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
                  {w === "stars." ? <em className="text-gold-flow not-italic">{w}</em> : w}
                </motion.span>{i < words.length - 1 ? " " : null}
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 1.2 }} className="mt-7 max-w-xl text-lg leading-relaxed text-slate md:text-xl">
            Explore your Vedic birth chart, understand your planetary cycles, and discover guidance shaped around your unique cosmic blueprint.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.45 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <Link href="/onboarding" className="btn-primary group w-full sm:w-auto">
                Reveal My Cosmic Blueprint <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Link href="#features" className="btn-ghost">Explore the Universe</Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.8 }} className="mt-8 flex items-start gap-2.5 text-sm text-slate/90">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Transparent chart calculations. Personal insights. No expensive consultations required.
          </motion.p>
        </div>
      </motion.div>

      <motion.a href="#features" aria-label="Scroll to features" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.4em] text-slate md:flex">
        SCROLL
        <span className="relative h-10 w-px overflow-hidden bg-moon/15"><span className="absolute inset-x-0 top-0 h-4 bg-gold motion-safe:animate-[scrollcue_2.2s_ease-in-out_infinite]" /></span>
      </motion.a>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(250%)}}`}</style>
    </section>
  );
}
