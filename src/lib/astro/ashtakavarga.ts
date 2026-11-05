import type { Planet } from "./constants";

/**
 * Ashtakavarga (BPHS ch. 66–72). Benefic places (bindus) counted from each of the eight
 * contributors (seven planets + Lagna). Checksums: Sun 48, Moon 49, Mars 39, Mercury 54,
 * Jupiter 56, Venus 52, Saturn 39 → Sarvashtakavarga 337.
 */
type Contributor = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Lagna";
export const AV_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const satisfies readonly Planet[];
export type AvPlanet = (typeof AV_PLANETS)[number];
const C: Contributor[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"];

export const BINDU_TABLE: Record<AvPlanet, Record<Contributor, number[]>> = {
  Sun: { Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12] },
  Moon: { Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11], Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11], Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11] },
  Mars: { Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [3, 5, 6, 11], Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12], Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11] },
  Mercury: { Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11] },
  Jupiter: { Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11], Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11] },
  Venus: { Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 5, 6, 9, 11, 12], Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11], Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11] },
  Saturn: { Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12], Mercury: [6, 8, 9, 10, 11, 12], Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12], Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11] },
};

export interface AshtakavargaResult {
  /** Bhinnashtakavarga: bindus per sign (index 0 = Aries) for each planet */
  bav: Record<AvPlanet, number[]>;
  /** Prastara: which contributor gave a bindu, per planet per sign */
  prastara: Record<AvPlanet, Record<Contributor, number[]>>;
  /** Sarvashtakavarga: total per sign (sums to 337) */
  sav: number[];
  totals: Record<AvPlanet, number>;
}

export function ashtakavarga(signs: Record<Contributor, number>): AshtakavargaResult {
  const bav = {} as AshtakavargaResult["bav"];
  const prastara = {} as AshtakavargaResult["prastara"];
  const totals = {} as AshtakavargaResult["totals"];
  for (const p of AV_PLANETS) {
    bav[p] = Array(12).fill(0);
    prastara[p] = {} as Record<Contributor, number[]>;
    for (const c of C) {
      const row = Array(12).fill(0);
      for (const h of BINDU_TABLE[p][c]) row[(signs[c] + h - 1) % 12] = 1;
      prastara[p][c] = row;
      row.forEach((v, i) => (bav[p][i] += v));
    }
    totals[p] = bav[p].reduce((a, b) => a + b, 0);
  }
  const sav = Array.from({ length: 12 }, (_, i) => AV_PLANETS.reduce((s, p) => s + bav[p][i], 0));
  return { bav, prastara, sav, totals };
}
