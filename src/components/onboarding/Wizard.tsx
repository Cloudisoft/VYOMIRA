"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { PlaceAutocomplete, type PlaceOption } from "./PlaceAutocomplete";
import { OrbitLoader } from "./OrbitLoader";
import type { BirthInput } from "@/lib/schemas";
import type { ChartResult } from "@/lib/astro/chart";
import type { Reading } from "@/lib/interpret/narrative";
import { activePeriods } from "@/lib/astro/dasha";
import { cn } from "@/lib/utils";

export interface PreviewState { birth: BirthInput; placeLabel: string; chart: ChartResult; insight: Reading }
export const PREVIEW_KEY = "vy_preview";

const STEPS = ["Name", "Date", "Time", "Place", "Preferences"] as const;

export function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [precision, setPrecision] = useState<"exact" | "approximate" | "unknown">("exact");
  const [uncertainty, setUncertainty] = useState(30);
  const [clock, setClock] = useState<"12" | "24">("12");
  const [h12, setH12] = useState({ h: "10", m: "30", ap: "AM" });
  const [t24, setT24] = useState("10:30");
  const [place, setPlace] = useState<PlaceOption | null>(null);
  const [language, setLanguage] = useState<"en" | "hi" | "hinglish">("en");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "calculating" | "done">("form");
  const [result, setResult] = useState<PreviewState | null>(null);


  const time24 = clock === "24" ? t24 : `${String((Number(h12.h) % 12) + (h12.ap === "PM" ? 12 : 0)).padStart(2, "0")}:${h12.m.padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);

  const valid = [
    name.trim().length > 0,
    /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "1800-01-01" && date <= today,
    precision === "unknown" || /^\d{2}:\d{2}$/.test(time24),
    Boolean(place),
    true,
  ];
  const go = (d: number) => { setError(null); setDir(d); setStep((s) => s + d); };

  async function submit() {
    if (!place) return;
    setPhase("calculating");
    setError(null);
    const birth: BirthInput = { fullName: name.trim(), date, time: precision === "unknown" ? "" : time24, precision, uncertaintyMinutes: precision === "approximate" ? uncertainty : undefined, placeId: place.id, language };
    try {
      const r = await fetch("/api/charts/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(birth) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.issues?.[0]?.message ?? j.error ?? "Calculation failed");
      const state: PreviewState = { birth, placeLabel: place.label, chart: j.chart, insight: j.insight };
      sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
      window.dispatchEvent(new Event("vy-session"));
      setResult(state);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("form");
    }
  }

  if (phase !== "form") return <Calculating result={result} onContinue={() => router.push("/chart")} />;

  return (
    <div className="mx-auto w-full max-w-xl">
      <ol className="mb-10 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-2">
            <span className={cn("h-0.5 rounded-full transition-colors duration-500", i <= step ? "bg-gold" : "bg-moon/10")} />
            <span className={cn("text-[10px] tracking-[0.2em] uppercase", i === step ? "text-gold" : "text-slate/60")} aria-current={i === step ? "step" : undefined}>{s}</span>
          </li>
        ))}
      </ol>
      <form onSubmit={(e) => { e.preventDefault(); if (!valid[step]) return; if (step < STEPS.length - 1) go(1); else submit(); }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: 30 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 * dir }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="min-h-[300px]">
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-4xl leading-tight sm:text-5xl">Every story begins with a name.</legend>
                <p className="mt-3 text-slate">How should we address you? This is only shown to you.</p>
                <label htmlFor="name" className="sr-only">Full name</label>
                <input id="name" autoFocus autoComplete="name" className="field mt-8 !py-4 !text-lg" placeholder="Your name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              </fieldset>
            )}
            {step === 1 && (
              <fieldset>
                <legend className="font-display text-4xl leading-tight sm:text-5xl">When did your story begin?</legend>
                <p className="mt-3 text-slate">Your date of birth, as recorded locally.</p>
                <label htmlFor="dob" className="sr-only">Date of birth</label>
                <input id="dob" type="date" autoFocus min="1800-01-01" max={today} className="field mt-8 !py-4 !text-lg [color-scheme:dark]" value={date} onChange={(e) => setDate(e.target.value)} />
              </fieldset>
            )}
            {step === 2 && (
              <fieldset>
                <legend className="font-display text-4xl leading-tight sm:text-5xl">At what moment?</legend>
                <p className="mt-3 text-slate">Birth time decides your rising sign and houses. Be honest about how sure you are — we'll adapt.</p>
                <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Birth time precision">
                  {([["exact", "Exact", "From a certificate or record"], ["approximate", "Approximate", "Within a window"], ["unknown", "Unknown", "No time available"]] as const).map(([v, l, d]) => (
                    <button type="button" role="radio" aria-checked={precision === v} key={v} onClick={() => setPrecision(v)} className={cn("rounded-2xl border p-3 text-left transition-colors", precision === v ? "border-gold/60 bg-gold/10" : "hairline hover:border-amethyst/40")}>
                      <span className="block text-sm text-moon">{l}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate">{d}</span>
                    </button>
                  ))}
                </div>
                {precision !== "unknown" ? (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm text-slate">Time of birth</span>
                      <div className="inline-flex rounded-full border hairline p-0.5 text-xs" role="radiogroup" aria-label="Clock format">
                        {(["12", "24"] as const).map((c) => <button type="button" key={c} role="radio" aria-checked={clock === c} onClick={() => setClock(c)} className={cn("rounded-full px-3 py-1", clock === c ? "bg-moon/10 text-moon" : "text-slate")}>{c}-hour</button>)}
                      </div>
                    </div>
                    {clock === "24" ? (
                      <input aria-label="Time of birth, 24-hour" type="time" className="field !py-4 !text-lg [color-scheme:dark]" value={t24} onChange={(e) => setT24(e.target.value)} />
                    ) : (
                      <div className="flex gap-2">
                        <select aria-label="Hour" className="field !py-4 !text-lg" value={h12.h} onChange={(e) => setH12({ ...h12, h: e.target.value })}>{Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => <option key={h} className="bg-navy">{h}</option>)}</select>
                        <select aria-label="Minute" className="field !py-4 !text-lg" value={h12.m} onChange={(e) => setH12({ ...h12, m: e.target.value })}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => <option key={m} className="bg-navy">{m}</option>)}</select>
                        <select aria-label="AM or PM" className="field !py-4 !text-lg" value={h12.ap} onChange={(e) => setH12({ ...h12, ap: e.target.value })}><option className="bg-navy">AM</option><option className="bg-navy">PM</option></select>
                      </div>
                    )}
                    {precision === "approximate" && (
                      <label className="mt-4 flex items-center justify-between gap-4 text-sm text-slate">
                        Could be off by up to
                        <select className="field !w-auto" value={uncertainty} onChange={(e) => setUncertainty(Number(e.target.value))}>{[10, 15, 30, 60, 120].map((m) => <option key={m} value={m} className="bg-navy">± {m} minutes</option>)}</select>
                      </label>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm leading-relaxed text-gold/90">Without a birth time we won't show an ascendant or houses from it — they'd be guesses. You'll still get your Moon sign (if it didn't change that day), planetary signs, Navamsa of slow planets, and an indicative dasha sequence.</p>
                )}
              </fieldset>
            )}
            {step === 3 && (
              <fieldset>
                <legend className="font-display text-4xl leading-tight sm:text-5xl">Where were you born?</legend>
                <p className="mt-3 text-slate">We use the place's coordinates and its own timezone history — never a guess from longitude.</p>
                <div className="mt-8"><PlaceAutocomplete inputId="place" value={place} onChange={setPlace} /></div>
              </fieldset>
            )}
            {step === 4 && (
              <fieldset>
                <legend className="font-display text-4xl leading-tight sm:text-5xl">A few preferences.</legend>
                <div className="mt-8 space-y-6">
                  <div>
                    <p className="mb-2 text-sm text-slate">Language for AURA and readings</p>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Language">
                      {([["en", "English"], ["hi", "हिन्दी"], ["hinglish", "Hinglish"]] as const).map(([v, l]) => (
                        <button type="button" role="radio" aria-checked={language === v} key={v} onClick={() => setLanguage(v)} className={cn("rounded-2xl border px-3 py-3 text-sm", language === v ? "border-gold/60 bg-gold/10 text-moon" : "hairline text-slate")}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-slate">Astrology system</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-gold/60 bg-gold/10 px-4 py-3 text-sm">Vedic (sidereal · Lahiri)<span className="block text-xs text-slate">Default</span></div>
                      <div className="rounded-2xl border hairline px-4 py-3 text-sm text-slate">Western (tropical · Placidus)<span className="block text-xs">Included — switch views in your Kundli</span></div>
                    </div>
                  </div>
                  <p className="rounded-2xl border hairline bg-surface/40 p-4 text-xs leading-relaxed text-slate">Calculating a preview stores nothing. If you later save your chart, we'll ask for explicit consent to store your birth details (encrypted) and, separately, whether AURA may send chart-derived context to an AI provider.</p>
                </div>
              </fieldset>
            )}
          </motion.div>
        </AnimatePresence>
        {error && <p role="alert" className="mb-4 rounded-xl border border-[#E07A5F]/40 bg-[#E07A5F]/10 px-4 py-3 text-sm text-[#F0A08A]">{error}</p>}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => go(-1)} disabled={step === 0} className="btn-ghost !px-4 disabled:opacity-0" aria-label="Back"><ArrowLeft className="h-4 w-4" /> Back</button>
          <button type="submit" disabled={!valid[step]} className="btn-primary">
            {step < STEPS.length - 1 ? <>Continue <ArrowRight className="h-4 w-4" /></> : <>Calculate my chart <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Calculating({ result, onContinue }: { result: PreviewState | null; onContinue: () => void }) {
  const c = result?.chart;
  const md = c ? activePeriods(c.dasha, new Date()).mahadasha : null;
  const rows: [string, string | null][] = [
    ["Resolving historical timezone to UTC", c ? `${c.input.utcOffset} → ${c.input.utc.replace("T", " ").slice(0, 16)} UTC` : null],
    ["Calculating planetary positions", c ? `9 grahas · Lahiri ayanamsa ${c.ayanamsa.toFixed(4)}°` : null],
    ["Determining rising sign", c ? (c.lagna ? `${c.lagna.signName} Lagna` : "Withheld — birth time not precise enough") : null],
    ["Determining lunar mansion", c ? `${c.janmaNakshatra.name}, pada ${c.janmaNakshatra.pada}${c.confidence.nakshatraStable ? "" : " (uncertain)"}` : null],
    ["Analyzing planetary periods", c ? (md ? `${md.lord} Mahadasha now` : "Vimshottari sequence ready") : null],
  ];
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
      <OrbitLoader done={Boolean(c)} />
      <h1 className="mt-8 font-display text-4xl">{c ? "Your sky is ready." : "Reading the sky at your birth…"}</h1>
      <ul className="mt-8 w-full space-y-3 text-left" aria-live="polite">
        {rows.map(([label, val], i) => (
          <motion.li key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: c ? i * 0.15 : 0 }} className="flex items-start gap-3 rounded-2xl border hairline bg-surface/40 px-4 py-3">
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", val ? "border-gold bg-gold/15 text-gold" : "border-moon/20")}>{val && <Check className="h-3 w-3" />}</span>
            <span className="flex-1">
              <span className="block text-sm text-moon">{label}</span>
              {val && <span className="block text-xs text-slate">{val}</span>}
            </span>
          </motion.li>
        ))}
      </ul>
      {c && <button onClick={onContinue} className="btn-primary mt-8">View my Kundli <ArrowRight className="h-4 w-4" /></button>}
    </div>
  );
}
