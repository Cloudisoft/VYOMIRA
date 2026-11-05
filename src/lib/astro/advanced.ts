import { PLANETS, type Planet } from "./constants";
import type { ChartResult } from "./chart";
import { nakshatraOf } from "./chart";
import { VARGA_KEYS, VARGA_RULES, vargaSensitivityMinutes, type VargaKey } from "./varga";
import { ashtakavarga, type AshtakavargaResult } from "./ashtakavarga";
import { shadbala, SHADBALA_VERSION, type ShadbalaRow } from "./shadbala";
import { trueNodeSidereal } from "./nodes";
import { westernChart, type WesternChart } from "./western";
import { angles } from "./positions";

export const ADVANCED_VERSION = "vyomira-advanced-1.0.0";

export interface AdvancedChart {
  version: string;
  vargas: Record<VargaKey, Record<Planet | "Lagna", number | null>>;
  /** Vargas whose Lagna is withheld because birth-time precision cannot support them. */
  vargaLagnaWithheld: VargaKey[];
  ashtakavarga: AshtakavargaResult | null;
  shadbala: { version: string; rows: ShadbalaRow[] } | null;
  trueNode: { rahu: number; ketu: number; rahuNakshatra: string; ketuNakshatra: string; differenceFromMean: number };
  western: WesternChart;
  notes: string[];
}

export function computeAdvanced(chart: ChartResult): AdvancedChart {
  const utc = new Date(chart.input.utc);
  const lon = Object.fromEntries(chart.placements.map((p) => [p.planet, p.longitude])) as Record<Planet, number>;
  const asc = angles(utc, chart.input.latitude, chart.input.longitude).ascendant;
  const precision = chart.confidence.precision;
  const window = precision === "exact" ? 2 : precision === "approximate" ? 30 : Infinity; // minutes of assumed error
  const notes: string[] = [];
  const vargas = {} as AdvancedChart["vargas"];
  const withheld: VargaKey[] = [];
  for (const k of VARGA_KEYS) {
    const row = Object.fromEntries(PLANETS.map((p) => [p, VARGA_RULES[k].fn(lon[p])])) as Record<Planet | "Lagna", number | null>;
    const ok = chart.lagna !== null && vargaSensitivityMinutes(k) > window;
    row.Lagna = ok ? VARGA_RULES[k].fn(asc) : null;
    if (!ok) withheld.push(k);
    vargas[k] = row;
  }
  if (withheld.length) notes.push(`Divisional ascendants for ${withheld.join(", ")} are withheld: they change faster than your birth-time precision allows.`);
  const signOf = (l: number) => Math.floor(l / 30);
  const av = chart.lagna
    ? ashtakavarga({ Sun: signOf(lon.Sun), Moon: signOf(lon.Moon), Mars: signOf(lon.Mars), Mercury: signOf(lon.Mercury), Jupiter: signOf(lon.Jupiter), Venus: signOf(lon.Venus), Saturn: signOf(lon.Saturn), Lagna: chart.lagna.sign })
    : null;
  if (!av) notes.push("Ashtakavarga needs the Lagna, so it is not shown without a reliable birth time.");
  const sb = chart.lagna && precision === "exact" ? { version: SHADBALA_VERSION, rows: shadbala(utc, chart.input.latitude, chart.input.longitude) } : null;
  if (!sb) notes.push("Shadbala depends on the exact time of day (house position, day/night, hora), so it is shown only for exact birth times.");
  const rahu = trueNodeSidereal(utc);
  const ketu = (rahu + 180) % 360;
  let diff = rahu - lon.Rahu;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return {
    version: ADVANCED_VERSION,
    vargas,
    vargaLagnaWithheld: withheld,
    ashtakavarga: av,
    shadbala: sb,
    trueNode: { rahu, ketu, rahuNakshatra: nakshatraOf(rahu).name, ketuNakshatra: nakshatraOf(ketu).name, differenceFromMean: diff },
    western: westernChart(utc, chart.input.latitude, chart.input.longitude, precision !== "unknown" && chart.lagna !== null),
    notes,
  };
}
