"use client";
import { useState } from "react";
import { KundliChart, type ChartStyle, type Varga } from "./KundliChart";
import { PlacementsTable } from "./PlacementsTable";
import { PlanetaryOrrery } from "./PlanetaryOrrery";
import { Toggle } from "@/components/home/ChartPreview";
import type { ChartResult } from "@/lib/astro/chart";
import type { Planet } from "@/lib/astro/constants";

export function KundliExplorer({ chart }: { chart: ChartResult }) {
  const [style, setStyle] = useState<ChartStyle>("north");
  const [varga, setVarga] = useState<Varga>("D1");
  const [view, setView] = useState<"chart" | "sky">("chart");
  const [sel, setSel] = useState<Planet | null>(null);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
      <div className="glass rounded-[1.75rem] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Toggle label="View" value={view} onChange={setView} options={[{ v: "chart", l: "Traditional" }, { v: "sky", l: "Artistic sky" }]} />
          {view === "chart" && <Toggle label="Chart style" value={style} onChange={setStyle} options={[{ v: "north", l: "North" }, { v: "south", l: "South" }]} />}
          <Toggle label="Divisional chart" value={varga} onChange={setVarga} options={[{ v: "D1", l: "D1 Rashi" }, { v: "D9", l: "D9" }, { v: "D10", l: "D10" }]} />
        </div>
        {view === "chart" ? <KundliChart chart={chart} style={style} varga={varga} selected={sel} onSelect={setSel} /> : <PlanetaryOrrery chart={chart} varga={varga} selected={sel} onSelect={setSel} />}
        {varga !== "D1" && <p className="mt-2 text-center text-xs text-slate">{varga === "D9" ? "Navamsa: each sign divided into 9 parts of 3°20′." : "Dashamsa: each sign divided into 10 parts of 3°; odd signs count from the sign, even signs from the 9th."}{chart.vargas[varga].Lagna === null && " Divisional Lagna withheld — it changes every few minutes and needs an exact birth time."}</p>}
      </div>
      <div className="glass rounded-[1.75rem] p-5 sm:p-7">
        <h2 className="font-display text-2xl">Planetary positions</h2>
        <p className="mt-1 mb-4 text-sm text-slate">Sidereal longitudes, exact to the arcsecond.</p>
        <PlacementsTable chart={chart} selected={sel} />
      </div>
    </div>
  );
}
