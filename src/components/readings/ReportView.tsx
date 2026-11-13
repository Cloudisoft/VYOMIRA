import { renderMarkdown } from "@/lib/markdown";
import type { ReportDoc } from "@/lib/readings/report";
import type { ReactNode } from "react";
import { rs } from "@/lib/readings/strings";
import type { RLang } from "@/lib/readings/lang";

/** Renders any section-based reading report. `extra` slots render above a section id (e.g. the Lo Shu grid). */
export function ReportView({ doc, extra, lang = "en" }: { doc: ReportDoc; extra?: Record<string, ReactNode>; lang?: RLang }) {
  return (
    <article className="space-y-8" lang={lang === "hi" ? "hi" : "en"}>
      <header>
        <h2 className="font-display text-3xl sm:text-4xl">{doc.title}</h2>
        {doc.subtitle && <p className="mt-1 text-sm tracking-wide text-gold">{doc.subtitle}</p>}
      </header>
      {doc.sections.map((s, i) => (
        <section key={s.id} className="reveal-up" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} aria-labelledby={`sec-${s.id}`}>
          <h3 id={`sec-${s.id}`} className="font-display text-2xl text-moon">{s.title}</h3>
          {extra?.[s.id]}
          <div className="prose-aura mt-3 text-[15px] leading-relaxed text-moon/85" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }} />
        </section>
      ))}
      <footer className="space-y-3 border-t hairline pt-6 text-xs text-slate">
        {doc.method.length > 0 && <div><p className="font-semibold tracking-widest text-slate/80 uppercase">{rs(lang).method}</p><ul className="mt-2 list-disc space-y-1 pl-5">{doc.method.map((m) => <li key={m}>{m}</li>)}</ul></div>}
        <p>{doc.disclaimer}</p>
      </footer>
    </article>
  );
}

export function LoShuGrid({ grid, lang = "en" }: { grid: { n: number; count: number }[][]; lang?: RLang }) {
  return (
    <div className="mt-4 inline-grid grid-cols-3 gap-1.5 rounded-2xl border hairline bg-navy/40 p-2" role="table" aria-label="Lo Shu grid">
      {grid.flat().map((c) => (
        <div key={c.n} role="cell" className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border text-lg ${c.count ? "border-gold/40 bg-gold/10 text-gold" : "border-dashed border-slate/25 text-slate/40"}`}>
          <span className="font-display">{c.count ? String(c.n).repeat(c.count) : c.n}</span>
          <span className="text-[9px] tracking-widest">{c.count ? `×${c.count}` : rs(lang).missing}</span>
        </div>
      ))}
    </div>
  );
}
