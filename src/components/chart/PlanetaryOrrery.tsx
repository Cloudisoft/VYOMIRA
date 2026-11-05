"use client";
import { motion } from "motion/react";
import { PLANET_INFO, SIGNS, type Planet } from "@/lib/astro/constants";
import type { ChartResult } from "@/lib/astro/chart";
import type { Varga } from "./KundliChart";

/** Artistic sky view: the zodiac as a ring, each graha at its exact sidereal longitude. */
export function PlanetaryOrrery({ chart, varga, selected, onSelect }: { chart: ChartResult; varga: Varga; selected: Planet | null; onSelect: (p: Planet | null) => void }) {
  const R = 170;
  // In D1 we place planets by exact longitude; in vargas by the middle of their varga sign.
  const lonOf = (p: ChartResult["placements"][number]) => (varga === "D1" ? p.longitude : (chart.vargas[varga][p.planet] as number) * 30 + 15);
  const asc = varga === "D1" ? chart.lagna?.longitude ?? null : chart.vargas[varga].Lagna !== null ? (chart.vargas[varga].Lagna as number) * 30 + 15 : null;
  const rot = asc !== null ? 180 - asc : 0; // ascendant on the left, as in a horoscope wheel
  const pt = (lon: number, r: number) => { const a = ((-(lon + rot)) * Math.PI) / 180; return [Number((Math.cos(a) * r).toFixed(2)), Number((Math.sin(a) * r).toFixed(2))]; };
  const radii = [128, 108, 88, 68];
  const used: number[] = [];
  return (
    <figure>
      <svg viewBox="-215 -215 430 430" className="h-auto w-full" role="group" aria-label="Artistic sky view of planetary longitudes">
        <defs><radialGradient id="orr"><stop offset="0" stopColor="#7256D8" stopOpacity=".25" /><stop offset="1" stopColor="#080D20" stopOpacity="0" /></radialGradient></defs>
        <circle r="200" fill="url(#orr)" />
        <circle r={R + 22} fill="none" stroke="rgba(216,180,119,.35)" />
        <circle r={R} fill="none" stroke="rgba(165,139,255,.25)" />
        {SIGNS.map((s, i) => {
          const [x1, y1] = pt(i * 30, R);
          const [x2, y2] = pt(i * 30, R + 22);
          const [tx, ty] = pt(i * 30 + 15, R + 11);
          return (
            <g key={s.name}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(216,180,119,.35)" />
              <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" letterSpacing="1" fill="#9BA3BC">{s.name.slice(0, 3).toUpperCase()}</text>
            </g>
          );
        })}
        {asc !== null && (() => { const [x, y] = pt(asc, R + 30); return <g><line x1="0" y1="0" x2={x} y2={y} stroke="#D8B477" strokeDasharray="2 4" /><text x={x - 4} y={y - 6} fontSize="9" fill="#D8B477" textAnchor="end">ASC</text></g>; })()}
        {chart.placements.map((p, i) => {
          const lon = lonOf(p);
          let ring = 0;
          while (ring < radii.length - 1 && used.some((u, k) => k % radii.length === ring && Math.abs(((u - lon + 540) % 360) - 180) > 168)) ring++;
          used.push(lon);
          const [x, y] = pt(lon, radii[ring]);
          const [mx, my] = pt(lon, R);
          const on = selected === p.planet;
          return (
            <motion.g key={p.planet} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.07 }} role="button" tabIndex={0} aria-label={`${p.planet} at ${p.signName} ${p.degree.toFixed(1)}°`} className="cursor-pointer outline-none" onClick={() => onSelect(on ? null : p.planet)} onKeyDown={(e) => { if (e.key === "Enter") onSelect(on ? null : p.planet); }}>
              <line x1={x} y1={y} x2={mx} y2={my} stroke="rgba(233,227,245,.18)" />
              <circle cx={mx} cy={my} r="2" fill="#F1DCAE" />
              <circle cx={x} cy={y} r={on ? 15 : 12} fill={on ? "rgba(216,180,119,.25)" : "rgba(18,26,53,.9)"} stroke={on ? "#D8B477" : "rgba(165,139,255,.45)"} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="#F1DCAE">{PLANET_INFO[p.planet].abbr}</text>
            </motion.g>
          );
        })}
        <text y="4" textAnchor="middle" fontSize="10" letterSpacing="3" fill="#9BA3BC">{varga}</text>
      </svg>
      <figcaption className="mt-2 text-center text-xs text-slate">{varga === "D1" ? "Each graha is drawn at its exact sidereal longitude; the Lagna points left." : "Divisional view: grahas are placed at the centre of their varga sign."}</figcaption>
    </figure>
  );
}
