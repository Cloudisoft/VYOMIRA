"use client";
import { useState } from "react";
import { PLANET_INFO, SIGNS, type Planet } from "@/lib/astro/constants";
import { dms } from "@/lib/astro/math";
import type { ChartResult } from "@/lib/astro/chart";
import { cn } from "@/lib/utils";

export type ChartStyle = "north" | "south";
export type Varga = "D1" | "D9" | "D10";

interface Body { planet: Planet; sign: number; label: string; retro: boolean; detail: string }

function bodiesFor(chart: ChartResult, varga: Varga): { bodies: Body[]; lagna: number | null; ref: "lagna" | "moon" } {
  const v = varga === "D1" ? null : chart.vargas[varga];
  const bodies = chart.placements.map((p) => ({
    planet: p.planet,
    sign: v ? (v[p.planet] as number) : p.sign,
    label: PLANET_INFO[p.planet].abbr,
    retro: p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu",
    detail: `${p.planet}: ${p.signName} ${dms(p.degree)} · ${p.nakshatra} pada ${p.pada}${p.retrograde ? " · retrograde" : ""}${p.combust ? " · combust" : ""} · ${p.dignity}${varga !== "D1" && v ? ` · ${varga} sign ${SIGNS[v[p.planet] as number].name}` : ""}`,
  }));
  const lagna = varga === "D1" ? chart.lagna?.sign ?? null : (chart.vargas[varga].Lagna as number | null);
  return { bodies, lagna: lagna ?? null, ref: lagna === null ? "moon" : "lagna" };
}

const NORTH_HOUSES: { poly: string; c: [number, number]; n: [number, number] }[] = [
  { poly: "200,0 300,100 200,200 100,100", c: [200, 92], n: [200, 172] },
  { poly: "0,0 200,0 100,100", c: [100, 38], n: [100, 84] },
  { poly: "0,0 100,100 0,200", c: [36, 100], n: [82, 100] },
  { poly: "0,200 100,100 200,200 100,300", c: [100, 192], n: [176, 200] },
  { poly: "0,200 100,300 0,400", c: [36, 300], n: [82, 300] },
  { poly: "0,400 100,300 200,400", c: [100, 362], n: [100, 318] },
  { poly: "200,400 100,300 200,200 300,300", c: [200, 292], n: [200, 228] },
  { poly: "200,400 300,300 400,400", c: [300, 362], n: [300, 318] },
  { poly: "400,400 300,300 400,200", c: [364, 300], n: [318, 300] },
  { poly: "400,200 300,300 200,200 300,100", c: [300, 192], n: [224, 200] },
  { poly: "400,200 300,100 400,0", c: [364, 100], n: [318, 100] },
  { poly: "400,0 300,100 200,0", c: [300, 38], n: [300, 84] },
];
const SOUTH_CELLS: [number, number][] = [[1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0]]; // index = sign (Aries=0)

export function KundliChart({ chart, varga = "D1", style = "north", selected, onSelect, className }: { chart: ChartResult; varga?: Varga; style?: ChartStyle; selected?: Planet | null; onSelect?: (p: Planet | null) => void; className?: string }) {
  const { bodies, lagna, ref } = bodiesFor(chart, varga);
  const base = lagna ?? chart.moonSign.sign; // when Lagna unknown, Chandra Lagna
  const [hover, setHover] = useState<Body | null>(null);
  const info = hover ?? bodies.find((b) => b.planet === selected) ?? null;

  const planetText = (list: Body[], cx: number, cy: number, perRow = 3) =>
    list.map((b, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const n = Math.min(perRow, list.length - row * perRow);
      const x = cx + (col - (n - 1) / 2) * 30;
      const y = cy + row * 18;
      const active = selected === b.planet;
      return (
        <g
          key={b.planet}
          role="button"
          tabIndex={0}
          aria-label={b.detail}
          className="cursor-pointer outline-none"
          onMouseEnter={() => setHover(b)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(b)}
          onBlur={() => setHover(null)}
          onClick={() => onSelect?.(active ? null : b.planet)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(active ? null : b.planet); } }}
        >
          {active && <circle cx={x} cy={y - 4} r={12} fill="rgba(216,180,119,.18)" stroke="#D8B477" strokeWidth=".8" />}
          <text x={x} y={y} textAnchor="middle" fontSize="13" fontWeight={600} fill={b.planet === "Rahu" || b.planet === "Ketu" ? "#A58BFF" : "#F1DCAE"}>
            {b.label}
            {b.retro && <tspan fontSize="8" dy="-5">R</tspan>}
          </text>
        </g>
      );
    });

  return (
    <figure className={cn("relative", className)}>
      <svg viewBox="-6 -6 412 412" className="h-auto w-full" role="group" aria-label={`${style === "north" ? "North" : "South"} Indian ${varga} chart`}>
        <defs>
          <linearGradient id="kgrid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D8B477" stopOpacity=".65" />
            <stop offset="1" stopColor="#A58BFF" stopOpacity=".5" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="400" rx="6" fill="rgba(13,18,48,.55)" stroke="url(#kgrid)" strokeWidth="1.2" />
        {style === "north" ? (
          <>
            <path d="M0 0L400 400M400 0L0 400M200 0L400 200L200 400L0 200Z" stroke="url(#kgrid)" strokeWidth="1" fill="none" />
            {NORTH_HOUSES.map((h, i) => {
              const sign = (base + i) % 12;
              const list = bodies.filter((b) => b.sign === sign);
              return (
                <g key={i}>
                  <text x={h.n[0]} y={h.n[1]} textAnchor="middle" fontSize="10" fill="#9BA3BC">{sign + 1}</text>
                  {i === 0 && <text x={200} y={148} textAnchor="middle" fontSize="9" letterSpacing="2" fill="#D8B477">{ref === "lagna" ? "ASC" : "MOON"}</text>}
                  {planetText(list, h.c[0], h.c[1] - (list.length > 3 ? 8 : 0), i % 3 === 0 ? 3 : 2)}
                </g>
              );
            })}
          </>
        ) : (
          <>
            {[100, 200, 300].map((v) => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={v === 200 ? 100 : 400} stroke="url(#kgrid)" />
                {v === 200 && <line x1={v} y1={300} x2={v} y2={400} stroke="url(#kgrid)" />}
                <line x1={0} y1={v} x2={v === 200 ? 100 : 400} y2={v} stroke="url(#kgrid)" />
                {v === 200 && <line x1={300} y1={v} x2={400} y2={v} stroke="url(#kgrid)" />}
              </g>
            ))}
            <rect x="100" y="100" width="200" height="200" fill="rgba(8,13,32,.6)" stroke="url(#kgrid)" />
            <text x="200" y="196" textAnchor="middle" fontSize="20" fill="#E9E3F5" fontFamily="var(--font-display)">{varga === "D1" ? "Rashi" : varga === "D9" ? "Navamsa" : "Dashamsa"}</text>
            <text x="200" y="216" textAnchor="middle" fontSize="9" letterSpacing="3" fill="#9BA3BC">{varga} · LAHIRI</text>
            {SOUTH_CELLS.map(([cx, cy], sign) => {
              const list = bodies.filter((b) => b.sign === sign);
              const isAsc = sign === base;
              return (
                <g key={sign}>
                  <text x={cx * 100 + 8} y={cy * 100 + 15} fontSize="9" fill="#9BA3BC">{SIGNS[sign].name.slice(0, 3)}</text>
                  {isAsc && <line x1={cx * 100} y1={cy * 100 + 22} x2={cx * 100 + 22} y2={cy * 100} stroke="#D8B477" strokeWidth="1.2" />}
                  {isAsc && <text x={cx * 100 + 92} y={cy * 100 + 15} textAnchor="end" fontSize="8" letterSpacing="1.5" fill="#D8B477">{ref === "lagna" ? "ASC" : "MOON"}</text>}
                  {planetText(list, cx * 100 + 50, cy * 100 + 50 - (list.length > 3 ? 8 : 0), 3)}
                </g>
              );
            })}
          </>
        )}
      </svg>
      <figcaption className="mt-3 min-h-[2.75rem] text-center text-xs leading-relaxed text-slate" aria-live="polite">
        {info ? info.detail : ref === "moon" ? "Birth time unknown — houses counted from the Moon (Chandra Lagna). Select a planet for details." : "Select or hover a planet for its exact degree and nakshatra."}
      </figcaption>
    </figure>
  );
}
