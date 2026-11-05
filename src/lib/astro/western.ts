import * as A from "astronomy-engine";
import { DEG, norm360 } from "./math";
import { timeContext } from "./positions";

/**
 * Western (tropical) layer: apparent positions in the true ecliptic of date, Placidus houses,
 * and Ptolemaic aspects. Tested against Swiss Ephemeris.
 */
export const WESTERN_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as const;
const BODIES = { Sun: A.Body.Sun, Moon: A.Body.Moon, Mercury: A.Body.Mercury, Venus: A.Body.Venus, Mars: A.Body.Mars, Jupiter: A.Body.Jupiter, Saturn: A.Body.Saturn, Uranus: A.Body.Uranus, Neptune: A.Body.Neptune, Pluto: A.Body.Pluto } as const;
export type WesternBody = keyof typeof BODIES;

const tropicalLon = (b: A.Body, t: A.AstroTime) => norm360(A.Ecliptic(A.GeoVector(b, t, true)).elon);

/** Placidus cusps by iterating each intermediate cusp on its semi-arc. Returns null above ~66° latitude (undefined there). */
export function placidus(ramcDeg: number, eps: number, phi: number): number[] | null {
  const e = eps * DEG, f = phi * DEG;
  const asc = norm360(Math.atan2(Math.cos(ramcDeg * DEG), -(Math.sin(ramcDeg * DEG) * Math.cos(e) + Math.tan(f) * Math.sin(e))) / DEG);
  const mc = norm360(Math.atan2(Math.sin(ramcDeg * DEG), Math.cos(ramcDeg * DEG) * Math.cos(e)) / DEG);
  const lonFromRa = (ra: number) => norm360(Math.atan2(Math.sin(ra * DEG), Math.cos(ra * DEG) * Math.cos(e)) / DEG);
  const decOf = (lon: number) => Math.asin(Math.sin(e) * Math.sin(lon * DEG));
  // cusp k (11,12 above horizon east; 2,3 below) — fraction of semi-arc
  const cusp = (fraction: number, above: boolean) => {
    let lon = norm360(mc + (above ? 1 : -1) * 0); // seed
    let ra = norm360(ramcDeg + (above ? fraction * 90 : 180 - fraction * 90));
    for (let i = 0; i < 60; i++) {
      lon = lonFromRa(ra);
      const x = Math.tan(f) * Math.tan(decOf(lon));
      if (Math.abs(x) > 1) return null;
      const ad = Math.asin(x) / DEG; // ascensional difference
      const next = above ? norm360(ramcDeg + fraction * (90 + ad)) : norm360(ramcDeg + 180 - fraction * (90 - ad));
      if (Math.abs(((next - ra + 540) % 360) - 180) < 1e-9) break;
      ra = next;
    }
    return lonFromRa(ra);
  };
  const c11 = cusp(1 / 3, true), c12 = cusp(2 / 3, true), c2 = cusp(2 / 3, false), c3 = cusp(1 / 3, false);
  if (c11 === null || c12 === null || c2 === null || c3 === null) return null;
  const c = [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
  return c;
}

export const ASPECTS = [
  { name: "Conjunction", angle: 0, orb: 8 },
  { name: "Sextile", angle: 60, orb: 6 },
  { name: "Square", angle: 90, orb: 7 },
  { name: "Trine", angle: 120, orb: 8 },
  { name: "Opposition", angle: 180, orb: 8 },
] as const;

export interface WesternChart {
  system: "tropical-placidus";
  positions: { body: WesternBody; longitude: number; sign: string; degree: number; retrograde: boolean; house: number | null }[];
  ascendant: number | null;
  midheaven: number | null;
  cusps: number[] | null;
  houseSystem: "placidus" | "whole-sign" | "none";
  aspects: { a: WesternBody; b: WesternBody; aspect: string; orb: number; applying: boolean }[];
  notes: string[];
}

export function westernChart(utc: Date, lat: number, lon: number, timeKnown: boolean): WesternChart {
  const ctx = timeContext(utc);
  const t = ctx.time, t2 = A.MakeTime(new Date(utc.getTime() + 3600000));
  const notes: string[] = [];
  const positions = (Object.keys(BODIES) as WesternBody[]).map((b) => {
    const l = tropicalLon(BODIES[b], t);
    let d = tropicalLon(BODIES[b], t2) - l;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    return { body: b, longitude: l, sign: WESTERN_SIGNS[Math.floor(l / 30)], degree: l % 30, retrograde: d < 0, house: null as number | null };
  });
  let cusps: number[] | null = null, asc: number | null = null, mc: number | null = null;
  let houseSystem: WesternChart["houseSystem"] = "none";
  if (timeKnown) {
    const ramc = norm360(A.SiderealTime(t) * 15 + lon);
    cusps = placidus(ramc, ctx.trueObliquity, lat);
    const e = ctx.trueObliquity * DEG, f = lat * DEG;
    asc = norm360(Math.atan2(Math.cos(ramc * DEG), -(Math.sin(ramc * DEG) * Math.cos(e) + Math.tan(f) * Math.sin(e))) / DEG);
    mc = norm360(Math.atan2(Math.sin(ramc * DEG), Math.cos(ramc * DEG) * Math.cos(e)) / DEG);
    if (cusps) houseSystem = "placidus";
    else {
      houseSystem = "whole-sign";
      cusps = Array.from({ length: 12 }, (_, i) => (Math.floor(asc! / 30) * 30 + i * 30) % 360);
      notes.push("Placidus houses are undefined at this latitude; whole-sign houses are used instead.");
    }
    for (const p of positions) {
      for (let i = 0; i < 12; i++) {
        const a = cusps[i], b = cusps[(i + 1) % 12];
        const span = norm360(b - a), off = norm360(p.longitude - a);
        if (off < span) { p.house = i + 1; break; }
      }
    }
  } else notes.push("Birth time unknown: ascendant, midheaven and houses are not shown.");
  const aspects: WesternChart["aspects"] = [];
  for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
    const p = positions[i], q = positions[j];
    if (!timeKnown && (p.body === "Moon" || q.body === "Moon")) continue;
    let sep = Math.abs(p.longitude - q.longitude); if (sep > 180) sep = 360 - sep;
    for (const asp of ASPECTS) {
      const orb = Math.abs(sep - asp.angle);
      if (orb <= asp.orb) {
        const later = positions.map((x) => ({ ...x, longitude: tropicalLon(BODIES[x.body], t2) }));
        let sep2 = Math.abs(later[i].longitude - later[j].longitude); if (sep2 > 180) sep2 = 360 - sep2;
        aspects.push({ a: p.body, b: q.body, aspect: asp.name, orb: Number(orb.toFixed(2)), applying: Math.abs(sep2 - asp.angle) < orb });
        break;
      }
    }
  }
  return { system: "tropical-placidus", positions, ascendant: asc, midheaven: mc, cusps, houseSystem, aspects, notes };
}
