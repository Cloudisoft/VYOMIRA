"use client";
import { useState } from "react";
import { KundliChart, vargaTable, type ChartStyle, type NodeMode, type Varga } from "./KundliChart";
import { PlacementsTable } from "./PlacementsTable";
import { PlanetaryOrrery } from "./PlanetaryOrrery";
import { WesternView } from "./WesternView";
import { Toggle } from "@/components/home/ChartPreview";
import type { ChartResult } from "@/lib/astro/chart";
import type { Planet } from "@/lib/astro/constants";
import { VARGA_RULES } from "@/lib/astro/varga";

export function KundliExplorer({ chart }: { chart: ChartResult }) {
  const [style, setStyle] = useState<ChartStyle>("north");
  const [varga, setVarga] = useState<Varga>("D1");
  const [view, setView] = useState<"chart" | "sky" | "western">("chart");
  const [node, setNode] = useState<NodeMode>("mean");
  const [sel, setSel] = useState<Planet | null>(null);
  const hasAdvanced = Boolean(chart.advanced);
  const vargaKeys = hasAdvanced ? Object.keys(VARGA_RULES) : ["D1", "D9", "D10"];
  const vt = vargaTable(chart, varga);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
      <div className="glass rounded-[1.75rem] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Toggle label="View" value={view} onChange={setView} options={[{ v: "chart", l: "Traditional" }, { v: "sky", l: "Artistic sky" }, ...(hasAdvanced ? [{ v: "western" as const, l: "Western" }] : [])]} />
          {view === "chart" && <Toggle label="Chart style" value={style} onChange={setStyle} options={[{ v: "north", l: "North" }, { v: "south", l: "South" }]} />}
          {view !== "western" && (
            <label className="inline-flex items-center gap-2 rounded-full border hairline bg-navy/60 px-3 py-1.5 text-xs text-slate">
              Varga
              <select aria-label="Divisional chart" value={varga} onChange={(e) => setVarga(e.target.value)} className="bg-transparent text-moon outline-none">
                {vargaKeys.map((k) => <option key={k} value={k} className="bg-navy">{k} · {VARGA_RULES[k].name}</option>)}
              </select>
            </label>
          )}
          {view === "chart" && hasAdvanced && <Toggle label="Lunar nodes" value={node} onChange={setNode} options={[{ v: "mean", l: "Mean node" }, { v: "true", l: "True node" }]} />}
        </div>
        {view === "chart" && <KundliChart chart={chart} style={style} varga={varga} selected={sel} onSelect={setSel} nodeMode={node} />}
        {view === "sky" && <PlanetaryOrrery chart={chart} varga={varga} selected={sel} onSelect={setSel} />}
        {view === "western" && chart.advanced && <WesternView western={chart.advanced.western} />}
        {view !== "western" && varga !== "D1" && (
          <p className="mt-2 text-center text-xs text-slate">
            {VARGA_RULES[varga]?.name} — traditionally consulted for {VARGA_RULES[varga]?.purpose}.
            {vt && (vt.Lagna === null || vt.Lagna === undefined) && " Divisional Lagna withheld: it changes faster than your birth-time precision allows."}
          </p>
        )}
      </div>
      <div className="glass rounded-[1.75rem] p-5 sm:p-7">
        <h2 className="font-display text-2xl">Planetary positions</h2>
        <p className="mt-1 mb-4 text-sm text-slate">Sidereal longitudes, exact to the arcsecond.</p>
        <PlacementsTable chart={chart} selected={sel} />
        {chart.advanced && (
          <p className="mt-4 rounded-xl border hairline px-4 py-3 text-xs text-slate">
            True (osculating) node: Rahu {chart.advanced.trueNode.rahu.toFixed(2)}° ({chart.advanced.trueNode.rahuNakshatra}), {chart.advanced.trueNode.differenceFromMean >= 0 ? "+" : ""}{chart.advanced.trueNode.differenceFromMean.toFixed(2)}° from the mean node used for dashas and yogas.
          </p>
        )}
      </div>
    </div>
  );
}
