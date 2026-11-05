import { PLANETS, SIGNS, type Planet } from "./constants";
import { signOf } from "./math";
import { bodyPosition } from "./positions";
import type { ChartResult } from "./chart";
import { nakshatraOf } from "./chart";

export interface TransitPlacement {
  planet: Planet;
  longitude: number;
  signName: string;
  sign: number;
  degree: number;
  nakshatra: string;
  retrograde: boolean;
  houseFromMoon: number;
  houseFromLagna: number | null;
}

export interface TransitSummary {
  at: string;
  placements: TransitPlacement[];
  sadeSati: { active: boolean; phase: "rising" | "peak" | "setting" | null; note: string } | null;
  ingresses: { planet: Planet; fromSign: string; toSign: string; at: string }[];
}

/** Find the next moment the planet's sidereal sign changes, by daily stepping then bisection. */
export function nextIngress(planet: Planet, from: Date, maxDays = 1200): { at: Date; toSign: number } | null {
  const step = planet === "Moon" ? 0.25 : 1;
  let t0 = from.getTime();
  let s0 = signOf(bodyPosition(planet, from).longitude);
  for (let i = 1; i <= maxDays / step; i++) {
    const t1 = from.getTime() + i * step * 86400000;
    const s1 = signOf(bodyPosition(planet, new Date(t1)).longitude);
    if (s1 !== s0) {
      let lo = t0, hi = t1;
      while (hi - lo > 60000) {
        const mid = (lo + hi) / 2;
        if (signOf(bodyPosition(planet, new Date(mid)).longitude) === s0) lo = mid; else hi = mid;
      }
      return { at: new Date(hi), toSign: s1 };
    }
    t0 = t1;
    s0 = s1;
  }
  return null;
}

export function transitSummary(chart: ChartResult | null, at: Date = new Date(), withIngresses = true): TransitSummary {
  const placements: TransitPlacement[] = PLANETS.map((p) => {
    const b = bodyPosition(p, at);
    const sign = signOf(b.longitude);
    return {
      planet: p,
      longitude: b.longitude,
      sign,
      signName: SIGNS[sign].name,
      degree: b.longitude % 30,
      nakshatra: nakshatraOf(b.longitude).name,
      retrograde: b.retrograde,
      houseFromMoon: chart ? ((sign - chart.moonSign.sign + 12) % 12) + 1 : 0,
      houseFromLagna: chart?.lagna ? ((sign - chart.lagna.sign + 12) % 12) + 1 : null,
    };
  });
  let sadeSati: TransitSummary["sadeSati"] = null;
  if (chart && chart.confidence.moonSignStable) {
    const h = placements.find((p) => p.planet === "Saturn")!.houseFromMoon;
    const phase = h === 12 ? "rising" : h === 1 ? "peak" : h === 2 ? "setting" : null;
    sadeSati = {
      active: phase !== null,
      phase,
      note: phase
        ? `Saturn is transiting the ${h === 1 ? "sign of" : h === 12 ? "12th sign from" : "2nd sign from"} your natal Moon — traditionally called Sade Sati. It is read as a period of maturing responsibilities, not a fixed misfortune.`
        : "Saturn is not transiting the 12th, 1st or 2nd sign from your natal Moon, so Sade Sati is not active.",
    };
  }
  const ingresses: TransitSummary["ingresses"] = [];
  if (withIngresses) {
    for (const p of ["Jupiter", "Saturn", "Rahu", "Mars"] as Planet[]) {
      const cur = placements.find((x) => x.planet === p)!;
      const n = nextIngress(p, at, p === "Mars" ? 400 : 1200);
      if (n) ingresses.push({ planet: p, fromSign: cur.signName, toSign: SIGNS[n.toSign].name, at: n.at.toISOString() });
    }
  }
  return { at: at.toISOString(), placements, sadeSati, ingresses };
}
