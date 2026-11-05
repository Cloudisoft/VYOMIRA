import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import type { ReportContent } from "@/server/reports";
import { PageHeader, Panel } from "@/components/dashboard/ui";

export const metadata = { title: "Report" };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ReportView({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const row = await db.report.findFirst({ where: { id, userId: user.id } });
  if (!row) notFound();
  const r = row.content as unknown as ReportContent;
  return (
    <article className="space-y-6">
      <PageHeader eyebrow={`Report · ${fmt(r.generatedAt)}`} title={r.title} intro={`Prepared for ${r.preparedFor}`} action={<div className="flex flex-wrap gap-2"><a href={`/api/reports/${row.id}/pdf`} className="btn-primary"><Download className="h-4 w-4" /> PDF (English)</a><a href={`/api/reports/${row.id}/pdf?lang=hi`} className="btn-ghost"><Download className="h-4 w-4" /> PDF (हिन्दी)</a></div>} />
      <dl className="grid gap-px overflow-hidden rounded-[1.5rem] border hairline bg-[rgba(165,139,255,.14)] sm:grid-cols-2 lg:grid-cols-4">
        {r.chartSummary.map((s) => <div key={s.label} className="bg-navy p-4"><dt className="text-xs text-slate">{s.label}</dt><dd className="mt-1 text-moon">{s.value}</dd></div>)}
      </dl>
      <Panel title="Summary"><p className="font-display text-2xl leading-snug">{r.reading.summary}</p></Panel>
      <Panel title="Chart factors & traditional interpretation">
        <ul className="space-y-5">
          {r.reading.factors.map((f) => (
            <li key={f.id} className="border-l-2 pl-4" style={{ borderColor: f.polarity === "supportive" ? "#D8B477" : f.polarity === "challenging" ? "#E07A5F" : "#A58BFF" }}>
              <p className="text-moon">{f.statement}</p>
              <p className="mt-1 text-sm text-slate">{f.interpretation}</p>
              <p className="mt-1 text-[10px] tracking-widest text-slate/60 uppercase">{f.polarity} · factor {f.id}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Supportive indications">{r.reading.supportive.length ? <ul className="space-y-2 text-sm text-slate">{r.reading.supportive.map((s) => <li key={s}>+ {s}</li>)}</ul> : <p className="text-sm text-slate">No strongly supportive factors in this lens.</p>}</Panel>
        <Panel title="Conflicting or challenging indications">{r.reading.challenging.length ? <ul className="space-y-2 text-sm text-slate">{r.reading.challenging.map((s) => <li key={s}>– {s}</li>)}</ul> : <p className="text-sm text-slate">No challenging factors flagged by the rules for this lens.</p>}</Panel>
      </div>
      {r.reading.timing.length > 0 && (
        <Panel title="Possible timing windows">
          <ul className="space-y-2 text-sm">{r.reading.timing.map((t) => <li key={t.label + t.start} className="flex flex-col justify-between gap-1 rounded-xl border hairline px-4 py-3 sm:flex-row"><span className="text-moon">{t.label}</span><span className="text-slate">{fmt(t.start)}{t.end !== t.start ? ` → ${fmt(t.end)}` : ""}</span></li>)}</ul>
          <p className="mt-3 text-xs text-slate/70">Windows are periods traditionally associated with this theme — not predictions of events.</p>
        </Panel>
      )}
      {r.dashaTable && (
        <Panel title="Vimshottari timeline">
          <ul className="space-y-3 text-sm">{r.dashaTable.map((m) => <li key={m.start}><p className="text-moon">{m.lord} Mahadasha · {m.start} → {m.end}</p><p className="text-xs text-slate">{m.antardashas.map((a) => `${a.lord} ${a.start}`).join(" · ")}</p></li>)}</ul>
        </Panel>
      )}
      <Panel title="Reflection prompts"><ul className="space-y-2 font-display text-xl">{r.reading.reflections.map((q) => <li key={q}>{q}</li>)}</ul></Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Methodology"><ul className="space-y-2 text-xs text-slate">{r.methodology.map((m) => <li key={m}>{m}</li>)}</ul></Panel>
        <Panel title="Disclaimer & uncertainty"><ul className="space-y-2 text-xs text-slate">{r.disclaimer.map((m) => <li key={m}>{m}</li>)}</ul></Panel>
      </div>
    </article>
  );
}
