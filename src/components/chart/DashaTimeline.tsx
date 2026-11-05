"use client";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { subPeriods, type DashaPeriod } from "@/lib/astro/dasha";
import { SIGNIFICATIONS } from "@/lib/interpret/catalog";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const COLORS: Record<string, string> = { Sun: "#E8B86A", Moon: "#E9E3F5", Mars: "#E07A5F", Mercury: "#7FD1AE", Jupiter: "#F1DCAE", Venus: "#F2A7C3", Saturn: "#8C9EFF", Rahu: "#A58BFF", Ketu: "#B39DDB" };

export function DashaTimeline({ mahadashas, birthIso, reliable, compact = false }: { mahadashas: DashaPeriod[]; birthIso: string; reliable: boolean; compact?: boolean }) {
  const [now] = useState(() => Date.now());
  const current = mahadashas.find((m) => Date.parse(m.start) <= now && now < Date.parse(m.end));
  const [open, setOpen] = useState<string | null>(current?.start ?? null);
  const [openAd, setOpenAd] = useState<string | null>(null);
  const span = useMemo(() => {
    const s = Math.max(Date.parse(mahadashas[0].start), Date.parse(birthIso));
    return { s, e: Date.parse(mahadashas[mahadashas.length - 1].end) };
  }, [mahadashas, birthIso]);
  const pct = (t: number) => Number((((Math.min(Math.max(t, span.s), span.e) - span.s) / (span.e - span.s)) * 100).toFixed(1));

  return (
    <div>
      {!reliable && (
        <p className="mb-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">Indicative only — dasha dates depend on the Moon's exact position at birth, and your birth time precision means these dates may shift.</p>
      )}
      <div className="relative mb-8 h-10" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 flex h-3 -translate-y-1/2 overflow-hidden rounded-full">
          {mahadashas.map((m) => (
            <div key={m.start} style={{ width: `${pct(Date.parse(m.end)) - pct(Date.parse(m.start))}%`, background: COLORS[m.lord], opacity: m === current ? 1 : 0.35 }} title={m.lord} />
          ))}
        </div>
        <div className="absolute top-0 bottom-0 w-px bg-gold shadow-[0_0_12px_#D8B477]" style={{ left: `${pct(now)}%` }}>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] tracking-widest text-gold">TODAY</span>
        </div>
      </div>
      <ol className="space-y-2">
        {mahadashas.map((m) => {
          const isCur = m === current;
          const isOpen = open === m.start;
          const past = Date.parse(m.end) < now;
          if (compact && past && !isCur) return null;
          return (
            <li key={m.start} className={cn("rounded-2xl border transition-colors", isCur ? "border-gold/40 bg-gold/[.04]" : "hairline bg-surface/40")}>
              <button className="flex w-full items-center gap-4 px-4 py-3.5 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.start)}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[m.lord], boxShadow: isCur ? `0 0 12px ${COLORS[m.lord]}` : undefined }} />
                <span className="w-28 font-display text-xl">{m.lord}</span>
                <span className={cn("flex-1 text-sm", past ? "text-slate/60" : "text-slate")}>{fmt(m.start)} — {fmt(m.end)}</span>
                {isCur && <span className="hidden rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] tracking-widest text-gold sm:inline">CURRENT</span>}
                <span className="hidden text-xs text-slate md:inline">{m.years} yrs</span>
                <ChevronDown className={cn("h-4 w-4 text-slate transition-transform", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <p className="mb-3 text-sm leading-relaxed text-slate">Traditionally, a {m.lord} Mahadasha brings {SIGNIFICATIONS[m.lord].tone}; themes of {SIGNIFICATIONS[m.lord].core.slice(0, 3).join(", ")} come forward, coloured by where {m.lord} sits in your chart.</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {(m.children ?? []).map((a) => {
                          const cur = Date.parse(a.start) <= now && now < Date.parse(a.end);
                          const k = a.start;
                          return (
                            <li key={k} className={cn("rounded-xl border px-3 py-2 text-sm", cur ? "border-amethyst/50 bg-violet/10" : "hairline")}>
                              <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpenAd(openAd === k ? null : k)} aria-expanded={openAd === k}>
                                <span><span className="text-moon">{m.lord}–{a.lord}</span>{cur && <span className="ml-2 text-[10px] tracking-widest text-amethyst">NOW</span>}</span>
                                <span className="text-xs text-slate">{fmt(a.start)}</span>
                              </button>
                              {openAd === k && (
                                <ul className="mt-2 space-y-0.5 border-t hairline pt-2 text-xs text-slate">
                                  {subPeriods(a.lord, Date.parse(a.start), a.years, 3).map((p) => (
                                    <li key={p.start} className={cn("flex justify-between", Date.parse(p.start) <= now && now < Date.parse(p.end) && "text-gold")}>
                                      <span>{p.lord}</span>
                                      <span>{fmt(p.start)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
