import { NAKSHATRAS, SIGNS, TITHIS, VARAS } from "@/lib/astro/constants";
import type { ChartResult } from "@/lib/astro/chart";
import { nakshatraOf } from "@/lib/astro/chart";
import { bodyPosition } from "@/lib/astro/positions";
import { norm360, signOf } from "@/lib/astro/math";
import { localToUtc, offsetAt } from "@/lib/astro/timezone";
import { ORDINAL } from "./catalog";

/** Tara Bala: the 9-fold count from Janma Nakshatra to the day's nakshatra (classical muhurta rule). */
const TARAS = [
  { name: "Janma", quality: "mixed", note: "the day's Moon returns to your birth star — traditionally a day for steadiness rather than new ventures" },
  { name: "Sampat", quality: "favorable", note: "traditionally associated with gains and resourcefulness" },
  { name: "Vipat", quality: "challenging", note: "traditionally a day to double-check plans and avoid needless risk" },
  { name: "Kshema", quality: "favorable", note: "traditionally associated with wellbeing and security" },
  { name: "Pratyak", quality: "challenging", note: "traditionally read as resistance — patience pays" },
  { name: "Sadhana", quality: "favorable", note: "traditionally supportive of effort and accomplishment" },
  { name: "Naidhana", quality: "challenging", note: "traditionally a day for rest and caution rather than launches" },
  { name: "Mitra", quality: "favorable", note: "traditionally friendly and cooperative" },
  { name: "Parama Mitra", quality: "favorable", note: "traditionally the most supportive of the nine taras" },
] as const;

const MOON_GOOD = [1, 3, 6, 7, 10, 11];
const HOUSE_HINT: Record<number, string> = {
  1: "attention turns to yourself — energy, appearance, how you show up",
  2: "family, finances and words carry extra weight",
  3: "a good moment for messages, short trips and initiative",
  4: "home and inner comfort ask for attention",
  5: "creativity, learning and play are highlighted",
  6: "routines, health habits and clearing tasks go well",
  7: "partners and one-to-one conversations come forward",
  8: "an inward, private mood — research and reflection suit it",
  9: "teachers, ideas and the bigger picture are highlighted",
  10: "work and visibility are in focus",
  11: "friends, networks and gains are highlighted",
  12: "rest, retreat and letting go are favoured",
};

export interface DailyInsight {
  date: string;
  timeZone: string;
  moon: { sign: string; nakshatra: string; houseFromMoon: number; favorable: boolean; hint: string };
  tara: { name: string; quality: string; note: string; count: number };
  tithi: string;
  vara: string;
  text: string;
  basis: string[];
}

function at(chart: ChartResult, when: Date, tz: string): DailyInsight {
  const moon = bodyPosition("Moon", when).longitude;
  const sun = bodyPosition("Sun", when).longitude;
  const nak = nakshatraOf(moon);
  const s = signOf(moon);
  const h = ((s - chart.moonSign.sign + 12) % 12) + 1;
  const count = ((nak.index - chart.janmaNakshatra.index + 27) % 27) + 1;
  const tara = TARAS[(count - 1) % 9];
  const elong = norm360(moon - sun);
  const ti = Math.floor(elong / 12) + 1;
  const tithi = `${ti <= 15 ? "Shukla" : "Krishna"} ${ti === 15 ? "Purnima" : ti === 30 ? "Amavasya" : TITHIS[(ti - 1) % 15]}`;
  const local = new Date(when.getTime() + offsetAt(tz, when.getTime()) * 60000);
  const vara = VARAS[local.getUTCDay()];
  const favorable = MOON_GOOD.includes(h);
  const text = `The Moon moves through ${SIGNS[s].name} in ${nak.name} — the ${ORDINAL[h]} sign from your natal Moon, where ${HOUSE_HINT[h]}. ${favorable ? "Classical gochara counts this position as supportive." : "Classical gochara counts this position as one to move through gently."} Your Tara Bala today is ${tara.name}: ${tara.note}.`;
  return {
    date: local.toISOString().slice(0, 10),
    timeZone: tz,
    moon: { sign: SIGNS[s].name, nakshatra: nak.name, houseFromMoon: h, favorable, hint: HOUSE_HINT[h] },
    tara: { name: tara.name, quality: tara.quality, note: tara.note, count },
    tithi,
    vara: `${vara.name} (${vara.en})`,
    text,
    basis: [`Transit Moon ${SIGNS[s].name} ${(moon % 30).toFixed(1)}°, ${nak.name} pada ${nak.pada}`, `Natal Moon ${chart.moonSign.signName}, Janma Nakshatra ${chart.janmaNakshatra.name}`, `Tara count ${count} → ${tara.name}`, "Calculated for the moment shown, in your local timezone"],
  };
}

export function dailyInsight(chart: ChartResult, tz: string, now = new Date()) {
  return at(chart, now, tz);
}

/** 14-day calendar evaluated at 06:00 local time each day. */
export function cosmicCalendar(chart: ChartResult, tz: string, days = 14, now = new Date()) {
  const off = offsetAt(tz, now.getTime());
  const local = new Date(now.getTime() + off * 60000);
  const out: DailyInsight[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + i));
    const inst = localToUtc({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: 6, minute: 0 }, tz).utc;
    out.push(at(chart, inst, tz));
  }
  return out;
}
export { NAKSHATRAS };
