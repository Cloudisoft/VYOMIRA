"use client";
import { useState } from "react";
import Link from "next/link";
import { KundliChart, type ChartStyle, type Varga } from "@/components/chart/KundliChart";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";
import { dms } from "@/lib/astro/math";
import type { Planet } from "@/lib/astro/constants";
import type { SampleData } from "./types";
import { cn } from "@/lib/utils";

export function Toggle<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border hairline bg-navy/60 p-1">
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors", value === o.v ? "bg-gold/90 text-navy" : "text-slate hover:text-moon")}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function ChartPreview({ sample }: { sample: SampleData }) {
  const [style, setStyle] = useState<ChartStyle>("north");
  const [varga, setVarga] = useState<Varga>("D1");
  const [sel, setSel] = useState<Planet | null>("Moon");
  const c = sample.chart;
  const p = sel ? c.placements.find((x) => x.planet === sel) : null;
  return (
    <section id="birth-chart" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Interactive Kundli" title={<>Precision you can <span className="text-gradient-gold">inspect.</span></>} intro="Every chart shows its inputs, its UTC instant, its ayanamsa and its calculation version. Switch between North and South Indian styles, or open the Navamsa and Dashamsa." />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <div className="glass rounded-[2rem] p-5 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Toggle label="Chart style" value={style} onChange={setStyle} options={[{ v: "north", l: "North Indian" }, { v: "south", l: "South Indian" }]} />
                <Toggle label="Divisional chart" value={varga} onChange={setVarga} options={[{ v: "D1", l: "D1" }, { v: "D9", l: "D9" }, { v: "D10", l: "D10" }]} />
              </div>
              <KundliChart chart={c} style={style} varga={varga} selected={sel} onSelect={setSel} className="mx-auto max-w-[480px]" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex h-full flex-col gap-5">
              <div className="rounded-[2rem] border border-gold/25 bg-gold/[.03] p-6">
                <p className="eyebrow !text-[0.6rem]">Sample chart — computed live</p>
                <p className="mt-2 text-sm text-slate">{sample.label}</p>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div><dt className="text-slate">Lagna</dt><dd className="mt-0.5 font-display text-2xl">{c.lagna?.signName} <span className="text-base text-slate">{c.lagna && dms(c.lagna.degree)}</span></dd></div>
                  <div><dt className="text-slate">Moon sign</dt><dd className="mt-0.5 font-display text-2xl">{c.moonSign.signName}</dd></div>
                  <div><dt className="text-slate">Janma Nakshatra</dt><dd className="mt-0.5 font-display text-2xl">{c.janmaNakshatra.name} <span className="text-base text-slate">pada {c.janmaNakshatra.pada}</span></dd></div>
                  <div><dt className="text-slate">UTC instant</dt><dd className="mt-0.5 text-moon tabular-nums">{c.input.utc.replace("T", " ").slice(0, 19)}</dd></div>
                </dl>
              </div>
              <div className="glass flex-1 rounded-[2rem] p-6" aria-live="polite">
                {p ? (
                  <>
                    <p className="eyebrow !text-[0.6rem]">Selected graha</p>
                    <h3 className="mt-2 text-3xl">{p.planet} <span className="text-slate">in</span> {p.signName}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-slate">
                      <li><span className="text-moon tabular-nums">{dms(p.degree)}</span> within the sign · sidereal longitude {p.longitude.toFixed(4)}°</li>
                      <li>{p.nakshatra}, pada {p.pada} — nakshatra lord {p.nakshatraLord}</li>
                      <li>House {p.house} from Lagna · <span className="capitalize">{p.dignity}</span>{p.retrograde ? " · retrograde" : ""}{p.combust ? " · combust" : ""}</li>
                      <li>Navamsa sign {["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][p.navamsaSign]}</li>
                    </ul>
                  </>
                ) : (
                  <p className="text-slate">Select a planet in the chart.</p>
                )}
                <Link href="/onboarding" className="btn-primary mt-6 w-full sm:w-auto">Calculate my own chart</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
