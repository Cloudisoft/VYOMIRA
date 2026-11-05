"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";
import type { SampleData } from "./types";
import { cn } from "@/lib/utils";

export function AuraPreview({ sample }: { sample: SampleData }) {
  const [i, setI] = useState(0);
  const a = sample.answers[i];
  return (
    <section id="aura" className="relative scroll-mt-24 overflow-hidden py-28 md:py-36">
      <div className="absolute top-1/3 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-violet/15 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading align="center" eyebrow="AURA · Your Cosmic Companion" title="Meet Your Cosmic Guide" intro="AURA explains your chart in plain language — and shows you exactly which placements, periods and rules it used. It cannot invent a planet, a yoga or a date: every claim is checked against your computed chart before you see it." />
        <Reveal delay={0.1} className="mt-14">
          <div className="glass mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.25fr_1fr]">
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b hairline pb-4">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet to-amethyst"><Sparkles className="h-5 w-5 text-white" /></span>
                <div>
                  <p className="font-display text-xl">AURA</p>
                  <p className="text-xs text-slate">Answering for the sample chart above</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Example questions">
                {sample.answers.map((x, k) => (
                  <button key={k} role="tab" aria-selected={i === k} onClick={() => setI(k)} className={cn("rounded-full border px-3.5 py-1.5 text-left text-xs transition-colors", i === k ? "border-gold/60 bg-gold/10 text-gold" : "hairline text-slate hover:text-moon")}>
                    {x.question}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="mt-6 space-y-4">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-violet/25 px-4 py-3 text-sm">{a.question}</div>
                  <div className="max-w-[95%] rounded-2xl rounded-tl-sm border hairline bg-navy/50 px-4 py-4 text-sm leading-relaxed text-moon/90">
                    {a.reading.summary}
                    <ul className="mt-3 space-y-2 text-slate">
                      {a.reading.factors.slice(0, 2).map((f) => <li key={f.id}>• {f.interpretation}</li>)}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
              <p className="mt-6 text-xs leading-relaxed text-slate/80">Shown here: a real answer from VYOMIRA's rule engine for the sample chart (no language model). Inside your account, AURA adds natural conversation in English, Hindi or Hinglish — fact-checked against these same factors.</p>
              <Link href="/onboarding" className="btn-primary mt-6 self-start">Ask about my chart</Link>
            </div>
            <div className="border-t hairline bg-navy/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
              <p className="eyebrow !text-[0.6rem]">Chart factors behind this answer</p>
              <ul className="mt-5 space-y-4">
                {a.reading.factors.slice(0, 5).map((f) => (
                  <li key={f.id} className="border-l-2 pl-3 text-sm" style={{ borderColor: f.polarity === "supportive" ? "#D8B477" : f.polarity === "challenging" ? "#E07A5F" : "#A58BFF" }}>
                    <p className="text-moon">{f.statement}</p>
                    <p className="mt-1 text-xs tracking-wide text-slate uppercase">{f.polarity}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
