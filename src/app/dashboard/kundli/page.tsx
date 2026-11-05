import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { NoChart, PageHeader, Panel } from "@/components/dashboard/ui";
import { KundliExplorer } from "@/components/chart/KundliExplorer";
import { dms } from "@/lib/astro/math";
import { SIGNS } from "@/lib/astro/constants";
import { ORDINAL } from "@/lib/interpret/catalog";
import { AshtakavargaPanel, ShadbalaPanel } from "@/components/chart/StrengthPanels";

export const metadata = { title: "My Kundli" };

export default async function KundliPage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart />;
  const c = loaded.chart;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Janam Kundli" title="My Kundli" intro={`${c.input.local} · ${c.input.placeLabel} · ${c.input.timeZone} (${c.input.utcOffset})`} />
      <KundliExplorer chart={c} />
      {c.advanced && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Panel title="Ashtakavarga">{c.advanced.ashtakavarga && c.lagna ? <AshtakavargaPanel av={c.advanced.ashtakavarga} lagnaSign={c.lagna.sign} /> : <p className="text-sm text-slate">Needs a reliable birth time (Lagna).</p>}</Panel>
          <Panel title="Shadbala">{c.advanced.shadbala ? <ShadbalaPanel sb={c.advanced.shadbala} /> : <p className="text-sm text-slate">Shown only for exact birth times — it depends on the precise time of day.</p>}</Panel>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Yogas found">
          {c.yogas.length ? (
            <ul className="space-y-4">
              {c.yogas.map((y) => (
                <li key={y.id} className="border-l-2 pl-4" style={{ borderColor: y.category === "auspicious" ? "#D8B477" : y.category === "challenging" ? "#E07A5F" : "#A58BFF" }}>
                  <p className="text-moon">{y.name}</p>
                  <p className="text-sm text-slate">{y.factors.join("; ")}</p>
                  <p className="mt-1 text-xs text-slate/80">Rule: {y.definition}</p>
                  {y.caveats.map((cv) => <p key={cv} className="mt-1 text-xs text-gold/80">{cv}</p>)}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate">None of the yogas in our validated catalog are formed.</p>}
          <p className="mt-4 text-xs text-slate/70">Only yogas with precise, documented definitions are detected (catalog {c.yogas[0]?.ruleVersion ?? "yogas-1.0.0"}).</p>
        </Panel>
        <Panel title="Graha drishti (aspects)">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {c.aspects.filter((a) => a.targets.length || a.kind !== 7).map((a, i) => (
              <li key={i} className="rounded-xl border hairline px-3 py-2"><span className="text-moon">{a.from}</span> <span className="text-slate">→ {ORDINAL[a.kind]} aspect on {SIGNS[a.toSign].name}{a.toHouseFromLagna ? ` (H${a.toHouseFromLagna})` : ""}</span>{a.targets.length > 0 && <span className="text-gold"> · {a.targets.join(", ")}</span>}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate/70">{c.computation.aspects}.</p>
        </Panel>
        <Panel title="Panchang at birth">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate">Tithi</dt><dd>{c.panchang.tithi.paksha} {c.panchang.tithi.name}</dd></div>
            <div><dt className="text-slate">Vara</dt><dd>{c.panchang.vara.name} ({c.panchang.vara.en}){c.panchang.vara.basis === "civil-day" && <span className="text-xs text-slate"> · civil day</span>}</dd></div>
            <div><dt className="text-slate">Nakshatra</dt><dd>{c.panchang.nakshatra}</dd></div>
            <div><dt className="text-slate">Yoga</dt><dd>{c.panchang.yoga}</dd></div>
            <div><dt className="text-slate">Karana</dt><dd>{c.panchang.karana}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate/70">Vara is counted from local sunrise, as is traditional.</p>
        </Panel>
        <Panel title="Calculation record">
          <dl className="space-y-2 font-mono text-xs text-slate">
            {[["computation", c.computation.id], ["calculated", c.computation.calculatedAt], ["ephemeris", c.computation.ephemeris], ["ayanamsa", `${c.computation.ayanamsa} = ${dms(c.ayanamsa)}`], ["houses", c.computation.houseSystem], ["nodes", c.computation.nodes], ["dasha year", c.computation.dashaYear], ["utc", c.input.utc], ["julian day (UT)", c.input.jdUT.toFixed(6)], ["coordinates", `${c.input.latitude.toFixed(4)}, ${c.input.longitude.toFixed(4)}`], ["time resolution", c.input.timeResolution], ["birth-time precision", c.confidence.precision]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-dashed border-white/5 pb-1.5"><dt className="text-amethyst">{k}</dt><dd className="text-right text-moon/90 break-all">{v}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
