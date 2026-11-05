import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { transitsFor } from "@/server/ai/aura";
import { NoChart, PageHeader, Panel } from "@/components/dashboard/ui";
import { DashaTimeline } from "@/components/chart/DashaTimeline";
import { ORDINAL } from "@/lib/interpret/catalog";

export const metadata = { title: "Cosmic Timeline" };

export default async function TimelinePage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart />;
  const c = loaded.chart;
  const t = await transitsFor(loaded.chartId, c);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Vimshottari · Gochara" title="Cosmic Timeline" intro={`Balance at birth: ${c.dasha.balanceAtBirth.lord} ${c.dasha.balanceAtBirth.years}y ${c.dasha.balanceAtBirth.months}m ${c.dasha.balanceAtBirth.days}d. Expand a Mahadasha for its Antardashas, and an Antardasha for Pratyantardashas.`} />
      <Panel><DashaTimeline mahadashas={c.dasha.mahadashas} birthIso={c.input.utc} reliable={c.confidence.dashaTimingReliable} /></Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming sign changes">
          <ul className="space-y-3 text-sm">
            {t.ingresses.map((i) => (
              <li key={i.planet} className="flex items-center justify-between rounded-xl border hairline px-4 py-3"><span>{i.planet}: {i.fromSign} → <span className="text-gold">{i.toSign}</span></span><span className="text-slate">{new Date(i.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate/70">Sidereal ingress moments found by numerical search (±1 minute).</p>
        </Panel>
        <Panel title="All transits today">
          <ul className="divide-y divide-[rgba(165,139,255,.12)] text-sm">
            {t.placements.map((p) => (
              <li key={p.planet} className="flex justify-between py-2"><span>{p.planet} in {p.signName} {p.degree.toFixed(1)}°{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " R" : ""}</span><span className="text-slate">{ORDINAL[p.houseFromMoon]} from Moon</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
