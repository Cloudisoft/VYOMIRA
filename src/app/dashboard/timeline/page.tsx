import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { UI, dateL, ordinalL, planetName, signName } from "@/lib/i18n/ui";
import { loadChart } from "@/server/charts";
import { transitsFor } from "@/server/ai/aura";
import { NoChart, PageHeader, Panel } from "@/components/dashboard/ui";
import { DashaTimeline } from "@/components/chart/DashaTimeline";

export const metadata = { title: "Cosmic Timeline" };

export default async function TimelinePage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  const lang = await userLang(user.id);
  const L = UI[lang].timeline;
  if (!loaded) return <NoChart t={UI[lang].noChart} />;
  const c = loaded.chart;
  const P = (p: Parameters<typeof planetName>[1]) => planetName(lang, p);
  const S = (x: string) => signName(lang, x);
  const t = await transitsFor(loaded.chartId, c);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={L.eyebrow} title={L.title} intro={L.intro(P(c.dasha.balanceAtBirth.lord), c.dasha.balanceAtBirth.years, c.dasha.balanceAtBirth.months, c.dasha.balanceAtBirth.days)} />
      <Panel><DashaTimeline mahadashas={c.dasha.mahadashas} birthIso={c.input.utc} reliable={c.confidence.dashaTimingReliable} /></Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={L.ingress}>
          <ul className="space-y-3 text-sm">
            {t.ingresses.map((i) => (
              <li key={i.planet} className="flex items-center justify-between rounded-xl border hairline px-4 py-3"><span>{P(i.planet)}: {S(i.fromSign)} → <span className="text-gold">{S(i.toSign)}</span></span><span className="text-slate">{dateL(lang, i.at, { day: "numeric", month: "short", year: "numeric" })}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate/70">{L.ingressNote}</p>
        </Panel>
        <Panel title={L.today}>
          <ul className="divide-y divide-[rgba(165,139,255,.12)] text-sm">
            {t.placements.map((p) => (
              <li key={p.planet} className="flex justify-between py-2"><span>{P(p.planet)} {L.in} {S(p.signName)} {p.degree.toFixed(1)}°{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " R" : ""}</span><span className="text-slate">{ordinalL(lang, p.houseFromMoon)} {L.fromMoon}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
