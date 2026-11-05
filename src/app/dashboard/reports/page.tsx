import Link from "next/link";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import { balance } from "@/server/billing/entitlements";
import { REPORT_TYPES } from "@/server/reports";
import { PageHeader } from "@/components/dashboard/ui";
import { ReportButton } from "@/components/dashboard/ReportButton";

export const metadata = { title: "My Reports" };

export default async function ReportsPage() {
  const user = await requireUser();
  const [bal, reports] = await Promise.all([balance(user.id), db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, type: true, createdAt: true } })]);
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Reports" title="My Reports" intro="Each report cites the placements and rules it uses. Regenerating with unchanged chart facts and date context simply reopens your existing report — you're never charged twice." />
      <ul className="grid gap-4 md:grid-cols-2">
        {Object.entries(REPORT_TYPES).map(([type, d]) => {
          const locked = d.premium && !bal.detailedReports;
          return (
            <li key={type} className="glass flex flex-col rounded-[1.5rem] p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-2xl">{d.title}</h2>
                <span className={`rounded-full px-2.5 py-1 text-[10px] tracking-widest ${d.premium ? "bg-gold/15 text-gold" : "bg-amethyst/15 text-amethyst"}`}>{d.premium ? "COSMIC PLUS" : "FREE"}</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate">{d.blurb}</p>
              <div className="mt-5">{locked ? <Link href="/dashboard/billing?plan=cosmic_plus" className="btn-ghost !py-2.5 text-sm">Unlock with Cosmic Plus</Link> : <ReportButton type={type} />}</div>
            </li>
          );
        })}
      </ul>
      {reports.length > 0 && (
        <section>
          <h2 className="font-display text-3xl">Generated</h2>
          <ul className="mt-4 divide-y divide-[rgba(165,139,255,.12)] border-y hairline">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/dashboard/reports/${r.id}`} className="hover:text-gold">{REPORT_TYPES[r.type as keyof typeof REPORT_TYPES]?.title ?? r.type}</Link>
                <span className="flex items-center gap-4 text-slate">{r.createdAt.toLocaleDateString("en-GB")}<a href={`/api/reports/${r.id}/pdf`} className="text-gold hover:underline">PDF</a></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
