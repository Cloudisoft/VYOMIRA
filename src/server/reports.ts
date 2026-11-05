import "server-only";
import { SIGNS, dms } from "@/lib/astro";
import type { ChartResult } from "@/lib/astro";
import { activePeriods } from "@/lib/astro/dasha";
import type { Topic } from "@/lib/interpret/catalog";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading, type Reading } from "@/lib/interpret/narrative";
import { sha256 } from "./crypto";
import { chartFactsHash } from "./charts";
import type { TransitSummary } from "@/lib/astro/transits";

export const REPORT_TYPES = {
  "birth-chart": { title: "Birth Chart & Personality", topic: "general", premium: false, blurb: "Lagna, Moon, Nakshatra, dignities and the yogas present in your chart." },
  career: { title: "Career & Professional Growth", topic: "career", premium: true, blurb: "10th house, its lord, D10 and the periods that activate them." },
  relationships: { title: "Relationships", topic: "love", premium: true, blurb: "5th and 7th houses, Venus and the Moon." },
  marriage: { title: "Marriage & Partnership", topic: "marriage", premium: true, blurb: "7th house, Navamsa (D9), Venus and Jupiter." },
  wealth: { title: "Wealth Themes", topic: "wealth", premium: true, blurb: "2nd, 11th, 5th and 9th houses with Jupiter's condition." },
  education: { title: "Education & Learning", topic: "education", premium: true, blurb: "4th, 5th and 9th houses, Mercury and Jupiter." },
  "annual-outlook": { title: "Annual Outlook", topic: "growth", premium: true, blurb: "The dasha periods and major transits of the next twelve months." },
  "dasha-timeline": { title: "Planetary Period Timeline", topic: "general", premium: false, blurb: "Your complete Vimshottari Mahadasha and Antardasha sequence." },
} as const satisfies Record<string, { title: string; topic: Topic; premium: boolean; blurb: string }>;
export type ReportType = keyof typeof REPORT_TYPES;

export interface ReportContent {
  type: ReportType;
  title: string;
  preparedFor: string;
  generatedAt: string;
  contextKey: string;
  chartSummary: { label: string; value: string }[];
  placements: { planet: string; sign: string; degree: string; house: string; nakshatra: string; dignity: string; retro: boolean }[];
  reading: Reading;
  dashaTable?: { lord: string; start: string; end: string; antardashas: { lord: string; start: string; end: string }[] }[];
  methodology: string[];
  disclaimer: string[];
}

export function reportContextKey(type: ReportType, chart: ChartResult, now = new Date()) {
  const act = activePeriods(chart.dasha, now);
  const ctx = type === "annual-outlook" ? now.toISOString().slice(0, 7) : type === "dasha-timeline" || type === "birth-chart" ? "static" : act.antardasha?.start.slice(0, 10) ?? "none";
  return { contextKey: ctx, factsHash: sha256(`${chartFactsHash(chart)}|${type}|${ctx}`) };
}

export function buildReport(type: ReportType, chart: ChartResult, fullName: string, transits: TransitSummary, now = new Date()): ReportContent {
  const def = REPORT_TYPES[type];
  const ev = buildEvidence(chart, def.topic, transits, now);
  const reading = deterministicReading(ev);
  const { contextKey } = reportContextKey(type, chart, now);
  const act = activePeriods(chart.dasha, now);
  return {
    type,
    title: def.title,
    preparedFor: fullName,
    generatedAt: now.toISOString(),
    contextKey,
    chartSummary: [
      { label: "Lagna", value: chart.lagna ? `${chart.lagna.signName} ${dms(chart.lagna.degree)}` : "Not determined (birth time)" },
      { label: "Moon sign (Rashi)", value: chart.moonSign.signName },
      { label: "Sun sign (sidereal)", value: chart.sunSign.signName },
      { label: "Janma Nakshatra", value: `${chart.janmaNakshatra.name}, pada ${chart.janmaNakshatra.pada}` },
      { label: "Current Mahadasha", value: act.mahadasha ? `${act.mahadasha.lord} until ${act.mahadasha.end.slice(0, 10)}` : "—" },
      { label: "Current Antardasha", value: act.antardasha ? `${act.antardasha.lord} until ${act.antardasha.end.slice(0, 10)}` : "—" },
      { label: "Ayanamsa", value: `Lahiri ${dms(chart.ayanamsa)}` },
    ],
    placements: chart.placements.map((p) => ({ planet: p.planet, sign: p.signName, degree: dms(p.degree), house: p.house ? String(p.house) : `${p.houseFromMoon} (from Moon)`, nakshatra: `${p.nakshatra} ${p.pada}`, dignity: p.dignity, retro: p.retrograde })),
    reading,
    dashaTable:
      type === "dasha-timeline" || type === "annual-outlook"
        ? chart.dasha.mahadashas.map((m) => ({ lord: m.lord, start: m.start.slice(0, 10), end: m.end.slice(0, 10), antardashas: (m.children ?? []).map((a) => ({ lord: a.lord, start: a.start.slice(0, 10), end: a.end.slice(0, 10) })) }))
        : undefined,
    methodology: [
      `Computation ${chart.computation.id}: sidereal zodiac, ${chart.computation.ayanamsaDefinition}.`,
      `Ephemeris: ${chart.computation.ephemeris}. Houses: whole-sign from Lagna. Nodes: mean. Dasha year: ${chart.computation.dashaYear}.`,
      `Interpretive rules: ${reading.generator}. Every statement above cites a computed chart factor.`,
      `Birth input resolved as ${chart.input.local} ${chart.input.timeZone} (${chart.input.utcOffset}) = ${chart.input.utc} UTC.`,
    ],
    disclaimer: [
      "Vedic astrology is a traditional interpretive system. The astronomical positions in this report are computed precisely; the interpretations are traditional readings, not scientifically established predictions.",
      "Nothing in this report is medical, legal, psychological or financial advice. Please consult a qualified professional for those matters.",
      ...chart.confidence.notes,
    ],
  };
}

export { SIGNS };
