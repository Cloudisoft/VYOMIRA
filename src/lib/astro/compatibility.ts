import { NAKSHATRAS, SIGNS, type Planet } from "./constants";
import type { ChartResult } from "./chart";

/**
 * Ashtakoota Guna Milan (36 points), North Indian method.
 *
 * Ashtakoota tables genuinely differ between traditions and software. Every table below names its
 * source, and the result carries COMPAT_VERSION so a score is always reproducible:
 *  - Varna, Tara, Bhakoot, Nadi, Gana membership: classical rules (BPHS / Muhurta Chintamani as commonly taught)
 *  - Vashya groups & matrix, Yoni pairs & matrix, Gana matrix: Maitreya open-source software
 *    documentation (saravali.github.io/astrology/koota_*.html)
 *  - Graha Maitri: BPHS natural friendships; scores 5/4/3/1/0.5/0 (the most widely used scale)
 * Classical exceptions (e.g. Nadi/Bhakoot cancellation when Rashi lords are friends) are reported,
 * never silently applied.
 */
export const COMPAT_VERSION = "ashtakoota-1.0.0";

const NADI = ["Adi", "Madhya", "Antya"] as const;
export const nadiOf = (nak: number) => NADI[[0, 1, 2, 2, 1, 0][nak % 6]];
const DEVA = [0, 4, 6, 7, 12, 14, 16, 21, 26];
const MANUSHYA = [1, 3, 5, 10, 11, 19, 20, 24, 25];
export type Gana = "Deva" | "Manushya" | "Rakshasa";
export const ganaOf = (nak: number): Gana => (DEVA.includes(nak) ? "Deva" : MANUSHYA.includes(nak) ? "Manushya" : "Rakshasa");

// Varna by element: water → Brahmin, fire → Kshatriya, earth → Vaishya, air → Shudra.
const VARNA = ["Brahmin", "Kshatriya", "Vaishya", "Shudra"] as const;
const varnaOf = (sign: number) => VARNA[[1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0][sign]];

// Vashya groups (sign + half for Sagittarius / Capricorn).
const VASHYA = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"] as const;
type Vashya = (typeof VASHYA)[number];
function vashyaOf(sign: number, degInSign: number): Vashya {
  if (sign === 8) return degInSign < 15 ? "Manava" : "Chatushpada";
  if (sign === 9) return degInSign < 15 ? "Chatushpada" : "Jalachara";
  return (["Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava", "Manava", "Keeta", "", "", "Manava", "Jalachara"] as Vashya[])[sign];
}
/** rows = bride, columns = groom (Maitreya). Order: Chatushpada, Manava, Jalachara, Vanachara(Leo), Keeta(Scorpio) */
const VASHYA_M = [
  [2, 0, 0, 0.5, 0],
  [1, 2, 1, 0.5, 1],
  [0.5, 1, 2, 1, 1],
  [0, 0, 0, 2, 0],
  [1, 1, 1, 0, 2],
];

// Yoni of each nakshatra (Ashwini..Revati) and the 14×14 matrix (rows = bride, Maitreya).
const YONI = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"] as const;
const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const YONI_M = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 4],
];

/** Gana matrix, rows = bride, columns = groom (Maitreya). */
const GANA_M: Record<Gana, Record<Gana, number>> = {
  Deva: { Deva: 6, Manushya: 6, Rakshasa: 0 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 1, Manushya: 0, Rakshasa: 6 },
};

/** BPHS natural friendships (Naisargika maitri). */
const FRIENDS: Record<string, { f: Planet[]; e: Planet[] }> = {
  Sun: { f: ["Moon", "Mars", "Jupiter"], e: ["Venus", "Saturn"] },
  Moon: { f: ["Sun", "Mercury"], e: [] },
  Mars: { f: ["Sun", "Moon", "Jupiter"], e: ["Mercury"] },
  Mercury: { f: ["Sun", "Venus"], e: ["Moon"] },
  Jupiter: { f: ["Sun", "Moon", "Mars"], e: ["Mercury", "Venus"] },
  Venus: { f: ["Mercury", "Saturn"], e: ["Sun", "Moon"] },
  Saturn: { f: ["Mercury", "Venus"], e: ["Sun", "Moon", "Mars"] },
};
export const relation = (a: Planet, b: Planet): "friend" | "neutral" | "enemy" | "same" =>
  a === b ? "same" : FRIENDS[a].f.includes(b) ? "friend" : FRIENDS[a].e.includes(b) ? "enemy" : "neutral";
function maitriScore(a: Planet, b: Planet) {
  const r1 = relation(a, b), r2 = relation(b, a);
  if (r1 === "same") return 5;
  const k = [r1, r2].sort().join("-");
  return ({ "friend-friend": 5, "friend-neutral": 4, "neutral-neutral": 3, "enemy-friend": 1, "enemy-neutral": 0.5, "enemy-enemy": 0 } as Record<string, number>)[k];
}

/** Tara: count bride→groom and groom→bride; remainder (mod 9) of 3, 5 or 7 is inauspicious; 1.5 points per auspicious direction. */
function taraScore(brideNak: number, groomNak: number) {
  const ok = (from: number, to: number) => ![3, 5, 7].includes((((to - from + 27) % 27) % 9) + 1);
  return (ok(brideNak, groomNak) ? 1.5 : 0) + (ok(groomNak, brideNak) ? 1.5 : 0);
}

export interface Person { moonLon: number; nakshatraStable: boolean }
export interface KootaResult { name: string; max: number; score: number; detail: string }

export function ashtakoota(bride: Person, groom: Person) {
  const bs = Math.floor(bride.moonLon / 30), gs = Math.floor(groom.moonLon / 30);
  const bn = Math.floor(bride.moonLon / (360 / 27)), gn = Math.floor(groom.moonLon / (360 / 27));
  const bl = SIGNS[bs].lord as Planet, gl = SIGNS[gs].lord as Planet;
  const kootas: KootaResult[] = [];

  const vB = varnaOf(bs), vG = varnaOf(gs);
  kootas.push({ name: "Varna", max: 1, score: VARNA.indexOf(vG) <= VARNA.indexOf(vB) ? 1 : 0, detail: `Bride ${vB}, groom ${vG}.` });

  const wB = vashyaOf(bs, bride.moonLon % 30), wG = vashyaOf(gs, groom.moonLon % 30);
  kootas.push({ name: "Vashya", max: 2, score: VASHYA_M[VASHYA.indexOf(wB)][VASHYA.indexOf(wG)], detail: `Bride ${wB}, groom ${wG}.` });

  kootas.push({ name: "Tara", max: 3, score: taraScore(bn, gn), detail: `Counted between ${NAKSHATRAS[bn]} and ${NAKSHATRAS[gn]} in both directions.` });

  const yB = YONI_OF[bn], yG = YONI_OF[gn];
  kootas.push({ name: "Yoni", max: 4, score: YONI_M[yB][yG], detail: `Bride ${YONI[yB]}, groom ${YONI[yG]}.` });

  kootas.push({ name: "Graha Maitri", max: 5, score: maitriScore(bl, gl), detail: `Moon-sign lords ${bl} and ${gl} (${relation(bl, gl)} / ${relation(gl, bl)}).` });

  const gB = ganaOf(bn), gG = ganaOf(gn);
  kootas.push({ name: "Gana", max: 6, score: GANA_M[gB][gG], detail: `Bride ${gB}, groom ${gG}.` });

  const d1 = ((gs - bs + 12) % 12) + 1, d2 = ((bs - gs + 12) % 12) + 1;
  const pair = [d1, d2].sort((a, b) => a - b).join("/");
  const bhakootDosha = ["2/12", "5/9", "6/8"].includes(pair);
  kootas.push({ name: "Bhakoot", max: 7, score: bhakootDosha ? 0 : 7, detail: `Moon signs ${SIGNS[bs].name} and ${SIGNS[gs].name} are ${pair} from each other.` });

  const nB = nadiOf(bn), nG = nadiOf(gn);
  kootas.push({ name: "Nadi", max: 8, score: nB === nG ? 0 : 8, detail: `Bride ${nB}, groom ${nG}.` });

  const notes: string[] = [];
  const lordsFriendly = bl === gl || (relation(bl, gl) === "friend" && relation(gl, bl) === "friend");
  if (nB === nG) notes.push(bn === gn && Math.floor(bride.moonLon / (360 / 108)) !== Math.floor(groom.moonLon / (360 / 108)) ? "Nadi dosha: same nakshatra but different padas is a commonly cited exception." : "Nadi dosha: same nadi. Classical texts list exceptions (e.g. same Rashi with different nakshatras); they are not applied to the score.");
  if (bhakootDosha) notes.push(lordsFriendly ? "Bhakoot dosha: classical texts cancel it when the Moon-sign lords are the same or mutual friends — that condition holds here, but the score shows the basic rule." : "Bhakoot dosha by the basic rule.");
  const total = kootas.reduce((s, k) => s + k.score, 0);
  return {
    version: COMPAT_VERSION,
    total,
    max: 36,
    band: total < 18 ? "below the traditional threshold of 18" : total < 25 ? "average (18–24)" : total < 33 ? "good (25–32)" : "excellent (33–36)",
    kootas,
    notes,
    reliable: bride.nakshatraStable && groom.nakshatraStable,
  };
}

/** Back-compat wrapper used by the API: chart A is treated as the bride, B as the groom unless specified. */
export function compatibilityFromCharts(a: ChartResult, b: ChartResult, aRole: "bride" | "groom" = "bride") {
  const pa = { moonLon: a.placements.find((p) => p.planet === "Moon")!.longitude, nakshatraStable: a.confidence.nakshatraStable };
  const pb = { moonLon: b.placements.find((p) => p.planet === "Moon")!.longitude, nakshatraStable: b.confidence.nakshatraStable };
  return aRole === "bride" ? ashtakoota(pa, pb) : ashtakoota(pb, pa);
}
