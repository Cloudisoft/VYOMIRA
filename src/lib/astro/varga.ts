import { norm360 } from "./math";

/** Divisional chart conventions (Parashari). Return the sign index (0 = Aries) in the varga. */

/** D9 Navamsa: 9 parts of 3°20'; movable signs start from the sign itself, fixed from the 9th,
 * dual from the 5th. Equivalent to continuous counting from Aries. */
export function navamsaSign(lon: number): number {
  return Math.floor(norm360(lon) / (30 / 9)) % 12;
}

/** D10 Dashamsa: 10 parts of 3°; odd signs start from the sign itself, even signs from the 9th. */
export function dashamsaSign(lon: number): number {
  const l = norm360(lon);
  const sign = Math.floor(l / 30);
  const part = Math.floor((l % 30) / 3);
  const start = sign % 2 === 0 ? sign : (sign + 8) % 12; // sign index 0 = Aries (odd sign)
  return (start + part) % 12;
}

export const VARGAS = {
  D1: { name: "Rashi", fn: (lon: number) => Math.floor(norm360(lon) / 30) },
  D9: { name: "Navamsa", fn: navamsaSign },
  D10: { name: "Dashamsa", fn: dashamsaSign },
} as const;
export type VargaId = keyof typeof VARGAS;
