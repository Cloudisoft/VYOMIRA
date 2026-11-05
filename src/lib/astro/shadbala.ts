import * as A from "astronomy-engine";
import { SIGNS, type Planet } from "./constants";
import { DEG, norm360 } from "./math";
import { angles, bodyPosition, previousSunrise, timeContext } from "./positions";
import { relation } from "./compatibility";
import { VARGA_RULES } from "./varga";

/**
 * Shadbala — six-fold planetary strength (BPHS ch. 27), in virupas (60 virupas = 1 rupa).
 * Conventions (versioned as SHADBALA_VERSION, shown to users):
 *  - Saptavargaja over D1, D2, D3, D7, D9, D12, D30 with compound (natural + temporal) friendship;
 *    moolatrikona (45) is recognised in D1 only.
 *  - Dig bala measured from the actual Lagna / Midheaven degrees.
 *  - Abda and Masa lords from the Kali Yuga ahargana (epoch JD 588465.5, a Friday), 360-day years and 30-day months.
 *  - Cheshta bala of the five tara grahas from their apparent motion (BPHS's eight motion states)
 *    rather than Surya Siddhanta mean-planet tables; Sun = Ayana bala, Moon = Paksha bala.
 *  - Yuddha (planetary war) bala is not applied.
 * Different software (JHora, PyJHora, printed tables) uses different variants; totals are therefore
 * comparable in pattern, not to the virupa.
 */
export const SHADBALA_VERSION = "shadbala-bphs-1.0.0";
export const SB_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
type SP = (typeof SB_PLANETS)[number];

const DEEP_EXALT: Record<SP, number> = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };
const MT: Record<SP, [number, number, number]> = { Sun: [4, 0, 20], Moon: [1, 4, 20], Mars: [0, 0, 12], Mercury: [5, 16, 20], Jupiter: [8, 0, 10], Venus: [6, 0, 15], Saturn: [10, 0, 20] };
export const NAISARGIKA: Record<SP, number> = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };
export const REQUIRED_RUPAS: Record<SP, number> = { Sun: 6.5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 };
const WEEKDAY_LORDS: SP[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const HORA_ORDER: SP[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]; // Chaldean order

const sep = (a: number, b: number) => { const d = Math.abs(norm360(a - b)); return d > 180 ? 360 - d : d; };

export interface ShadbalaRow {
  planet: SP;
  sthana: { total: number; uchcha: number; saptavargaja: number; ojayugma: number; kendradi: number; drekkana: number };
  dig: number;
  kala: { total: number; nathonnatha: number; paksha: number; tribhaga: number; abda: number; masa: number; vara: number; hora: number; ayana: number };
  cheshta: number;
  naisargika: number;
  drik: number;
  total: number;
  rupas: number;
  required: number;
  ratio: number;
}

/** BPHS sputa drishti value (0–60) of aspecting planet p on a point `ang` degrees ahead of it. */
export function drishti(p: SP, ang: number): number {
  const a = norm360(ang);
  let v = a < 30 ? 0 : a < 60 ? (a - 30) / 2 : a < 90 ? a - 60 + 15 : a < 120 ? (120 - a) / 2 + 30 : a < 150 ? 150 - a : a < 180 ? (a - 150) * 2 : a < 300 ? (300 - a) / 2 : 0;
  if (p === "Saturn" && ((a >= 60 && a < 90) || (a >= 270 && a < 300))) v = 60;
  if (p === "Mars" && ((a >= 90 && a < 120) || (a >= 210 && a < 240))) v = 60;
  if (p === "Jupiter" && ((a >= 120 && a < 150) || (a >= 240 && a < 270))) v = 60;
  return v;
}

export function shadbala(utc: Date, latitude: number, longitude: number): ShadbalaRow[] {
  const ctx = timeContext(utc);
  const pos = Object.fromEntries(SB_PLANETS.map((p) => [p, bodyPosition(p as Planet, utc)])) as Record<SP, ReturnType<typeof bodyPosition>>;
  const lon = (p: SP) => pos[p].longitude;
  const sign = (p: SP) => Math.floor(lon(p) / 30);
  const ang = angles(utc, latitude, longitude);
  const lagnaSign = Math.floor(ang.ascendant / 30);
  const elong = norm360(lon("Moon") - lon("Sun"));
  const waxing = elong < 180;
  const benefic = (p: SP) => p === "Jupiter" || p === "Venus" || p === "Mercury" || (p === "Moon" && waxing);

  // Temporal friendship from D1 sign positions.
  const temporal = (p: SP, q: SP) => [2, 3, 4, 10, 11, 12].includes(((sign(q) - sign(p) + 12) % 12) + 1);
  const compound = (p: SP, lord: SP): number => {
    if (p === lord) return 30;
    const n = relation(p, lord), t = temporal(p, lord);
    const c = n === "friend" ? (t ? "adhimitra" : "sama") : n === "neutral" ? (t ? "mitra" : "shatru") : t ? "sama" : "adhishatru";
    return { adhimitra: 22.5, mitra: 15, sama: 7.5, shatru: 3.75, adhishatru: 1.875 }[c];
  };

  // Time-of-day quantities.
  const obs = new A.Observer(latitude, longitude, 0);
  const sunEq = A.Equator(A.Body.Sun, ctx.time, obs, true, true);
  const lst = norm360(A.SiderealTime(ctx.time) * 15 + longitude);
  const ha = norm360(lst - sunEq.ra * 15); // 0 = local apparent noon
  const haFromNoon = ha > 180 ? 360 - ha : ha; // 0..180
  const sunrise = previousSunrise(utc, latitude, longitude);
  const nextSet = sunrise ? A.SearchRiseSet(A.Body.Sun, obs, -1, A.MakeTime(sunrise), 1) : null;
  const nextRise = sunrise ? A.SearchRiseSet(A.Body.Sun, obs, +1, A.MakeTime(new Date(sunrise.getTime() + 3600000)), 2) : null;
  const isDay = Boolean(sunrise && nextSet && utc < nextSet.date);
  let tribhagaLord: SP | null = null;
  if (sunrise && nextSet && nextRise) {
    const [s, e] = isDay ? [sunrise.getTime(), nextSet.date.getTime()] : [nextSet.date.getTime(), nextRise.date.getTime()];
    const third = Math.min(2, Math.floor(((utc.getTime() - s) / (e - s)) * 3));
    tribhagaLord = (isDay ? ["Mercury", "Sun", "Saturn"] : ["Moon", "Venus", "Mars"])[third] as SP;
  }
  // Vara (from sunrise) and hora (equal hours from sunrise).
  const varaDate = sunrise ?? utc;
  const localWeekday = (d: Date) => new Date(d.getTime() + (longitude / 15) * 3600000).getUTCDay();
  const varaLord = WEEKDAY_LORDS[localWeekday(varaDate)];
  const hoursSinceRise = sunrise ? Math.floor((utc.getTime() - sunrise.getTime()) / 3600000) : 0;
  const horaLord = HORA_ORDER[(HORA_ORDER.indexOf(varaLord) + hoursSinceRise) % 7];
  // Abda / Masa lords from the Kali ahargana (epoch weekday Friday = index 5).
  const ahargana = Math.floor(ctx.jdUT + 0.5 - 588465.5);
  const abdaLord = WEEKDAY_LORDS[(Math.floor(ahargana / 360) * 360 + 5) % 7];
  const masaLord = WEEKDAY_LORDS[(Math.floor(ahargana / 30) * 30 + 5) % 7];

  // Declination for Ayana bala.
  const declination = (p: SP) => {
    const trop = norm360(pos[p].tropicalLongitude + ctx.dpsi) * DEG, beta = pos[p].latitude * DEG, e = ctx.trueObliquity * DEG;
    return Math.asin(Math.sin(beta) * Math.cos(e) + Math.cos(beta) * Math.sin(e) * Math.sin(trop)) / DEG;
  };

  const rows: ShadbalaRow[] = SB_PLANETS.map((p) => {
    const l = lon(p), s = sign(p), deg = l % 30;
    // --- Sthana
    const uchcha = sep(l, DEEP_EXALT[p] + 180) / 3;
    let sapta = 0;
    for (const k of ["D1", "D2", "D3", "D7", "D9", "D12", "D30"]) {
      const vs = VARGA_RULES[k].fn(l);
      if (k === "D1" && MT[p][0] === s && deg >= MT[p][1] && deg < MT[p][2]) { sapta += 45; continue; }
      sapta += compound(p, SIGNS[vs].lord as SP);
    }
    const femaleLike = p === "Moon" || p === "Venus";
    const odd = (x: number) => x % 2 === 0;
    const ojayugma = ((femaleLike ? !odd(s) : odd(s)) ? 15 : 0) + ((femaleLike ? !odd(VARGA_RULES.D9.fn(l)) : odd(VARGA_RULES.D9.fn(l))) ? 15 : 0);
    const house = ((s - lagnaSign + 12) % 12) + 1;
    const kendradi = [1, 4, 7, 10].includes(house) ? 60 : [2, 5, 8, 11].includes(house) ? 30 : 15;
    const dk = Math.floor(deg / 10);
    const drekkana = (["Sun", "Mars", "Jupiter"].includes(p) && dk === 0) || (["Mercury", "Saturn"].includes(p) && dk === 1) || (femaleLike && dk === 2) ? 15 : 0;
    const sthana = { uchcha, saptavargaja: sapta, ojayugma, kendradi, drekkana, total: uchcha + sapta + ojayugma + kendradi + drekkana };
    // --- Dig (strongest point → weakest point opposite)
    const strongest = p === "Sun" || p === "Mars" ? ang.midheaven : p === "Jupiter" || p === "Mercury" ? ang.ascendant : p === "Moon" || p === "Venus" ? norm360(ang.midheaven + 180) : norm360(ang.ascendant + 180);
    const dig = sep(l, strongest + 180) / 3;
    // --- Kala
    const nathonnatha = p === "Mercury" ? 60 : ["Sun", "Jupiter", "Venus"].includes(p) ? 60 * (1 - haFromNoon / 180) : 60 * (haFromNoon / 180);
    const pakshaBase = sep(lon("Moon"), lon("Sun")) / 3;
    const paksha = (benefic(p) ? pakshaBase : 60 - pakshaBase) * (p === "Moon" ? 2 : 1);
    const tribhaga = p === "Jupiter" || tribhagaLord === p ? 60 : 0;
    const abda = abdaLord === p ? 15 : 0, masa = masaLord === p ? 30 : 0, vara = varaLord === p ? 45 : 0, hora = horaLord === p ? 60 : 0;
    const dec = declination(p);
    const ayanaRaw = p === "Mercury" ? ((24 + Math.abs(dec)) / 48) * 60 : ["Moon", "Saturn"].includes(p) ? ((24 - dec) / 48) * 60 : ((24 + dec) / 48) * 60;
    const ayana = Math.max(0, Math.min(60, ayanaRaw)) * (p === "Sun" ? 2 : 1);
    const kala = { nathonnatha, paksha, tribhaga, abda, masa, vara, hora, ayana, total: nathonnatha + paksha + tribhaga + abda + masa + vara + hora + ayana };
    // --- Cheshta
    let cheshta: number;
    if (p === "Sun") cheshta = ayana / 2;
    else if (p === "Moon") cheshta = pakshaBase;
    else {
      const meanSpeed: Record<string, number> = { Mars: 0.524, Mercury: 0.9856, Jupiter: 0.0831, Venus: 0.9856, Saturn: 0.0335 };
      const r = pos[p].speed / meanSpeed[p];
      // Vakra 60, Anuvakra 30, Vikala (stationary) 15, Manda 30, Mandatara 15, Sama 7.5, Chara 45, Atichara 30
      cheshta = r < -0.1 ? 60 : r < 0 ? 30 : r < 0.1 ? 15 : r < 0.5 ? 15 : r < 0.9 ? 30 : r < 1.1 ? 7.5 : r < 1.5 ? 45 : 30;
    }
    return { planet: p, sthana, dig, kala, cheshta, naisargika: NAISARGIKA[p], drik: 0, total: 0, rupas: 0, required: REQUIRED_RUPAS[p], ratio: 0 };
  });
  // --- Drik: benefic minus malefic aspects received, divided by 4
  for (const r of rows) {
    let ben = 0, mal = 0;
    for (const q of SB_PLANETS) {
      if (q === r.planet) continue;
      const v = drishti(q, lon(r.planet) - lon(q));
      if (benefic(q)) ben += v; else mal += v;
    }
    r.drik = (ben - mal) / 4;
    r.total = r.sthana.total + r.dig + r.kala.total + r.cheshta + r.naisargika + r.drik;
    r.rupas = r.total / 60;
    r.ratio = r.rupas / r.required;
  }
  return rows;
}
