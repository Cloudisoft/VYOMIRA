"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Briefcase, Heart, Gem, Coins, Sprout, GraduationCap, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/Reveal";

const CATS = [
  { icon: Briefcase, t: "Career", d: "10th house, its lord, the Dashamsa (D10) and the periods that activate them.", h: "Houses 10 · 6 · 2 · 11" },
  { icon: Heart, t: "Love", d: "Venus, the Moon and the 5th and 7th houses — how you seek closeness.", h: "Houses 5 · 7 · 11" },
  { icon: Gem, t: "Marriage", d: "The 7th house read with the Navamsa (D9), Venus and Jupiter.", h: "D9 · Houses 7 · 2" },
  { icon: Coins, t: "Wealth", d: "Resources and gains through the 2nd, 11th, 5th and 9th houses.", h: "Houses 2 · 11 · 5 · 9" },
  { icon: Sprout, t: "Personal Growth", d: "The Moon, Jupiter and Ketu, with today's transits from your natal Moon.", h: "Houses 1 · 9 · 12" },
  { icon: GraduationCap, t: "Education", d: "Mercury and Jupiter with the 4th, 5th and 9th houses of learning.", h: "Houses 4 · 5 · 9" },
];

export function Readings() {
  return (
    <section id="readings" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Featured readings" title={<>Six lenses on <span className="text-gradient-violet">one sky.</span></>} intro="Each reading names the houses, planets and periods it draws from — so you can see why it says what it says." />
        <ul className="mt-14 divide-y divide-[rgba(165,139,255,.14)] border-y hairline">
          {CATS.map((c, i) => (
            <motion.li key={c.t} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: i * 0.06 }}>
              <Link href="/onboarding" className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 sm:grid-cols-[3rem_14rem_1fr_auto] sm:gap-8 md:py-8">
                <span className="font-display text-xl text-slate/60 max-sm:hidden">0{i + 1}</span>
                <span className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border hairline text-gold transition-colors group-hover:border-gold/50 group-hover:bg-gold/10"><c.icon className="h-5 w-5" /></span>
                  <span className="font-display text-3xl transition-colors group-hover:text-gold md:text-4xl">{c.t}</span>
                </span>
                <span className="hidden text-slate sm:block">{c.d}<span className="mt-1 block text-xs tracking-[0.2em] text-amethyst/80 uppercase">{c.h}</span></span>
                <ArrowUpRight className="h-5 w-5 text-slate transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
