import { NAKSHATRAS, SIGNS } from "./constants";
import type { ChartResult } from "./chart";

/**
 * Partial compatibility checks (three of the eight Ashtakoota kootas) using unambiguous
 * classical tables. The full 36-point Guna Milan is NOT computed: several kootas (Yoni,
 * Vashya, Graha Maitri exceptions) have regional variants we have not yet validated.
 */
export const COMPAT_VERSION = "compat-partial-1.0.0";
const NADI = ["Adi", "Madhya", "Antya"] as const;
export const nadiOf = (nak: number) => NADI[[0, 1, 2, 2, 1, 0][nak % 6]];
const DEVA = [0, 4, 6, 7, 12, 14, 16, 21, 26];
const MANUSHYA = [1, 3, 5, 10, 11, 19, 20, 24, 25];
export const ganaOf = (nak: number) => (DEVA.includes(nak) ? "Deva" : MANUSHYA.includes(nak) ? "Manushya" : "Rakshasa");

export function partialCompatibility(a: ChartResult, b: ChartResult) {
  const na = a.janmaNakshatra.index, nb = b.janmaNakshatra.index;
  const nadiA = nadiOf(na), nadiB = nadiOf(nb);
  const ganaA = ganaOf(na), ganaB = ganaOf(nb);
  const d1 = ((b.moonSign.sign - a.moonSign.sign + 12) % 12) + 1;
  const d2 = ((a.moonSign.sign - b.moonSign.sign + 12) % 12) + 1;
  const pair = [d1, d2].sort((x, y) => x - y).join("/");
  const bhakootDosha = ["2/12", "5/9", "6/8"].includes(pair);
  const ganaScore = ganaA === ganaB ? 6 : (ganaA === "Deva" && ganaB === "Manushya") || (ganaB === "Deva" && ganaA === "Manushya") ? 5 : ganaA === "Rakshasa" && ganaB === "Rakshasa" ? 6 : (ganaA === "Manushya" && ganaB === "Rakshasa") || (ganaB === "Manushya" && ganaA === "Rakshasa") ? 0 : 1;
  return {
    version: COMPAT_VERSION,
    reliable: a.confidence.nakshatraStable && b.confidence.nakshatraStable,
    moon: { a: SIGNS[a.moonSign.sign].name, b: SIGNS[b.moonSign.sign].name, relation: `${d1}/${d2}` },
    nakshatra: { a: NAKSHATRAS[na], b: NAKSHATRAS[nb] },
    kootas: [
      { name: "Nadi", max: 8, score: nadiA === nadiB ? 0 : 8, detail: `${nadiA} and ${nadiB} nadi${nadiA === nadiB ? " — same nadi is traditionally flagged (Nadi dosha); classical texts list exceptions not evaluated here." : " — different nadis are traditionally favourable."}` },
      { name: "Bhakoot", max: 7, score: bhakootDosha ? 0 : 7, detail: `Moon signs are ${pair} from each other${bhakootDosha ? " — traditionally a Bhakoot dosha; exceptions (e.g. same sign lords or friendly lords) are not evaluated here." : " — no Bhakoot dosha by the basic rule."}` },
      { name: "Gana", max: 6, score: ganaScore, detail: `${ganaA} and ${ganaB} gana.` },
    ],
    note: "Three of eight kootas only (21 of 36 points). This is not a full Guna Milan and should never be the basis of a life decision.",
  };
}
