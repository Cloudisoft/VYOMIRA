import { EXALTATION, MOOLATRIKONA, OWN_SIGNS, type Planet } from "./constants";

export type Dignity = "exalted" | "debilitated" | "moolatrikona" | "own" | "neutral";

export function dignityOf(planet: Planet, sign: number, deg: number): Dignity {
  const ex = EXALTATION[planet];
  if (ex && ex.sign === sign) return "exalted";
  if (ex && (ex.sign + 6) % 12 === sign) return "debilitated";
  const mt = MOOLATRIKONA[planet];
  if (mt && mt[0] === sign && deg >= mt[1] && deg < mt[2]) return "moolatrikona";
  if (OWN_SIGNS[planet]?.includes(sign)) return "own";
  return "neutral";
}
