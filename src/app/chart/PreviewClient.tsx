"use client";
import { useState } from "react";
import { useSessionJSON } from "@/lib/use-session-json";
import Link from "next/link";
import { Info, Send, Sparkles, Loader2 } from "lucide-react";
import { KundliExplorer } from "@/components/chart/KundliExplorer";
import { DashaTimeline } from "@/components/chart/DashaTimeline";
import { PREVIEW_KEY, type PreviewState } from "@/components/onboarding/Wizard";
import { activePeriods } from "@/lib/astro/dasha";
import { dms } from "@/lib/astro/math";
import type { Reading } from "@/lib/interpret/narrative";
import { useSession } from "@/lib/auth-client";

const SUGGESTED = ["What does my current Mahadasha indicate?", "Which relationship patterns appear in my chart?", "What are my career themes?"];

export function PreviewClient() {
  const s = useSessionJSON<PreviewState>(PREVIEW_KEY);
  const { data: session } = useSession();
  if (s === undefined) return <div className="mx-auto max-w-7xl px-6"><div className="h-96 animate-pulse rounded-3xl bg-surface/50" /></div>;
  if (s === null) return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-5xl">No chart yet</h1>
      <p className="mt-4 text-slate">Your preview lives only in this browser tab. Enter your birth details to calculate it.</p>
      <Link href="/onboarding" className="btn-primary mt-8">Enter birth details</Link>
    </div>
  );
  const c = s.chart;
  const md = activePeriods(c.dasha, new Date());
  const saveHref = session ? "/onboarding/save" : `/sign-up?next=${encodeURIComponent("/onboarding/save")}`;
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      <section className="py-10">
        <p className="eyebrow">Kundli · {c.computation.id}</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">{s.birth.fullName.split(" ")[0]}'s cosmic blueprint</h1>
        <p className="mt-3 text-slate">{c.input.local} · {s.placeLabel} · {c.input.timeZone} ({c.input.utcOffset}) · UTC {c.input.utc.replace("T", " ").slice(0, 19)}</p>
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border hairline bg-[rgba(165,139,255,.14)] md:grid-cols-5">
          {[
            ["Lagna", c.lagna ? `${c.lagna.signName}` : "Unknown", c.lagna ? dms(c.lagna.degree) : "needs exact time"],
            ["Moon sign", c.moonSign.signName, c.confidence.moonSignStable ? "Rashi" : "uncertain"],
            ["Nakshatra", c.janmaNakshatra.name, `pada ${c.janmaNakshatra.pada}${c.confidence.nakshatraStable ? "" : " · uncertain"}`],
            ["Sun sign", c.sunSign.signName, "sidereal"],
            ["Mahadasha", md.mahadasha?.lord ?? "—", md.antardasha ? `${md.antardasha.lord} antardasha` : ""],
          ].map(([k, v, sub]) => (
            <div key={k} className="bg-navy p-5"><dt className="text-xs tracking-[0.2em] text-slate uppercase">{k}</dt><dd className="mt-2 font-display text-2xl">{v}</dd><dd className="text-xs text-slate">{sub}</dd></div>
          ))}
        </dl>
        {c.confidence.notes.length > 0 && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-gold/30 bg-gold/[.05] p-4 text-sm text-gold/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <ul className="space-y-1">{c.confidence.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
      </section>
      <KundliExplorer chart={c} />
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass rounded-[1.75rem] p-6 sm:p-8">
          <p className="eyebrow !text-[0.6rem]">First insight · rule engine</p>
          <p className="mt-4 font-display text-2xl leading-snug">{s.insight.summary}</p>
          <ul className="mt-6 space-y-4">
            {s.insight.factors.slice(0, 4).map((f) => (
              <li key={f.id} className="border-l-2 border-amethyst/40 pl-4"><p className="text-sm text-moon">{f.statement}</p><p className="mt-1 text-sm text-slate">{f.interpretation}</p></li>
            ))}
          </ul>
        </div>
        <AskPreview birth={s.birth} />
      </section>
      <section className="glass mt-6 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl">Vimshottari Dasha</h2>
        <p className="mt-1 mb-6 text-sm text-slate">Balance at birth: {c.dasha.balanceAtBirth.lord} {c.dasha.balanceAtBirth.years}y {c.dasha.balanceAtBirth.months}m {c.dasha.balanceAtBirth.days}d</p>
        <DashaTimeline mahadashas={c.dasha.mahadashas} birthIso={c.input.utc} reliable={c.confidence.dashaTimingReliable} compact />
      </section>
      <section className="mt-10 overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[.08] via-surface/60 to-violet/10 p-8 text-center sm:p-12">
        <h2 className="font-display text-4xl sm:text-5xl">Keep your universe close.</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate">Save this chart to your private dashboard — encrypted — and ask AURA your first question free.</p>
        <Link href={saveHref} className="btn-primary mt-8">{session ? "Save to my account" : "Create free account & save"}</Link>
        <p className="mt-4 text-xs text-slate/80">Not ready? This preview disappears when you close the tab. Nothing has been stored.</p>
      </section>
    </div>
  );
}

function AskPreview({ birth }: { birth: PreviewState["birth"] }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [ans, setAns] = useState<{ reading?: Reading; guard?: string; error?: string } | null>(null);
  const ask = async (question: string) => {
    setQ(question); setLoading(true); setAns(null);
    try {
      const r = await fetch("/api/aura/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth, question }) });
      const j = await r.json();
      setAns(r.ok ? j : { error: j.error ?? "Please try again." });
    } catch { setAns({ error: "Network error." }); } finally { setLoading(false); }
  };
  return (
    <div className="glass flex flex-col rounded-[1.75rem] p-6 sm:p-8">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-amethyst"><Sparkles className="h-4 w-4" /></span><p className="font-display text-2xl">Ask AURA</p></div>
      <p className="mt-2 text-xs text-slate">Preview answers come from the rule engine. Sign in for AURA's full conversation.</p>
      <div className="mt-4 flex flex-wrap gap-2">{SUGGESTED.map((x) => <button key={x} onClick={() => ask(x)} className="rounded-full border hairline px-3 py-1.5 text-xs text-slate hover:text-moon">{x}</button>)}</div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) ask(q); }}>
        <label htmlFor="q" className="sr-only">Your question</label>
        <input id="q" className="field" placeholder="Ask about your chart…" value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary !px-4" aria-label="Ask" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
      </form>
      <div className="mt-5 flex-1 text-sm leading-relaxed" aria-live="polite">
        {ans?.guard && <p className="text-moon/90">{ans.guard}</p>}
        {ans?.error && <p className="text-[#F0A08A]">{ans.error}</p>}
        {ans?.reading && (
          <div>
            <p className="text-moon/90">{ans.reading.summary}</p>
            <ul className="mt-3 space-y-2 text-slate">{ans.reading.factors.slice(0, 3).map((f) => <li key={f.id}>• <span className="text-moon/80">{f.statement}.</span> {f.interpretation}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
