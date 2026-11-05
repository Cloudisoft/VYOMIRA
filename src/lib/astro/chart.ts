import {
  HOUSE_THEMES, NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, PLANETS, SIGNS, SPECIAL_ASPECTS, TITHIS, VARAS,
  VIMSHOTTARI_ORDER, YOGAS_PANCHANG, KARANAS_MOVABLE, type Planet,
} from "./constants";
import { activePeriods, vimshottari, DASHA_YEAR_DAYS, type VimshottariResult } from "./dasha";
import { dignityOf, type Dignity } from "./dignity";
import { degInSign, norm360, signOf } from "./math";
import { angles, bodyPosition, EPHEMERIS, previousSunrise } from "./positions";
import { LAHIRI } from "./ayanamsa";
import { formatOffset, localToUtc, offsetAt, type LocalDateTime, type ResolvedInstant } from "./timezone";
import { dashamsaSign, navamsaSign } from "./varga";
import { detectYogas, type YogaResult } from "./yogas";
import { computeAdvanced, type AdvancedChart } from "./advanced";

/** Bump whenever any convention or algorithm that changes numeric output changes. */
export const COMPUTATION_VERSION = {
  id: "vyomira-astro-1.1.0",
  zodiac: "sidereal",
  ayanamsa: LAHIRI.id,
  ayanamsaDefinition: "Lahiri/Chitrapaksha: 23.245524743° at JD 2435553.5 TT, IAU 1976 precession, mean (no nutation)",
  houseSystem: "whole-sign",
  nodes: "mean",
  dashaYear: `${DASHA_YEAR_DAYS} days`,
  vargas: ["D1", "D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"],
  extras: "Ashtakavarga (BPHS), Shadbala (BPHS, documented conventions), true node (osculating), Western tropical/Placidus",
  aspects: "Parashari graha drishti (sign-based); Rahu/Ketu aspects not applied",
  ephemeris: `${EPHEMERIS.id}@${EPHEMERIS.version}`,
} as const;

export type BirthTimePrecision = "exact" | "approximate" | "unknown";

export interface ChartInput {
  local: LocalDateTime;
  timeZone: string;
  latitude: number;
  longitude: number;
  placeLabel: string;
  precision: BirthTimePrecision;
  /** ± minutes for approximate times (default 30) */
  uncertaintyMinutes?: number;
  /** For ambiguous local times: 0 = earlier occurrence (default), 1 = later. */
  fold?: 0 | 1;
}

export interface Placement {
  planet: Planet;
  longitude: number;
  sign: number;
  signName: string;
  degree: number;
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  nakshatraLord: Planet;
  house: number | null; // whole-sign house from Lagna (null when birth time is unknown)
  houseFromMoon: number;
  retrograde: boolean;
  speed: number;
  dignity: Dignity;
  combust: boolean;
  navamsaSign: number;
  dashamsaSign: number;
}

export interface Aspect {
  from: Planet;
  toHouseFromLagna: number | null;
  toSign: number;
  kind: number; // 3,4,5,7,8,9,10
  targets: Planet[];
}

export interface Confidence {
  precision: BirthTimePrecision;
  lagnaReliable: boolean;
  housesReliable: boolean;
  moonSignStable: boolean;
  nakshatraStable: boolean;
  padaStable: boolean;
  dashaTimingReliable: boolean;
  navamsaLagnaReliable: boolean;
  notes: string[];
}

export interface ChartResult {
  computation: typeof COMPUTATION_VERSION & { calculatedAt: string };
  input: {
    local: string;
    timeZone: string;
    utcOffset: string;
    utc: string;
    jdUT: number;
    latitude: number;
    longitude: number;
    placeLabel: string;
    timeResolution: ResolvedInstant["status"];
    timeResolutionNote?: string;
    alternatives?: ResolvedInstant["alternatives"];
    computedAtLocalNoon: boolean;
  };
  ayanamsa: number;
  lagna: { longitude: number; sign: number; signName: string; degree: number; nakshatra: string; pada: number; navamsaSign: number; dashamsaSign: number } | null;
  moonSign: { sign: number; signName: string };
  sunSign: { sign: number; signName: string };
  janmaNakshatra: { name: string; index: number; pada: number; lord: Planet };
  placements: Placement[];
  houses: { house: number; sign: number; signName: string; lord: Planet; occupants: Planet[] }[] | null;
  aspects: Aspect[];
  vargas: { D9: Record<Planet | "Lagna", number | null>; D10: Record<Planet | "Lagna", number | null> };
  dasha: VimshottariResult;
  panchang: {
    tithi: { index: number; name: string; paksha: "Shukla" | "Krishna" };
    nakshatra: string;
    yoga: string;
    karana: string;
    vara: { name: string; en: string; lord: Planet; basis: "sunrise" | "civil-day" };
  };
  yogas: YogaResult[];
  confidence: Confidence;
  advanced?: AdvancedChart;
}

const COMBUST_ORB: Partial<Record<Planet, [number, number]>> = {
  // [direct, retrograde] orbs in degrees from the Sun (Surya Siddhanta / BPHS convention)
  Moon: [12, 12],
  Mars: [17, 17],
  Mercury: [14, 12],
  Jupiter: [11, 11],
  Venus: [10, 8],
  Saturn: [15, 15],
};

export function nakshatraOf(lon: number) {
  const l = norm360(lon);
  const index = Math.floor(l / NAKSHATRA_SPAN);
  const pada = Math.floor((l - index * NAKSHATRA_SPAN) / PADA_SPAN) + 1;
  return { index, name: NAKSHATRAS[index], pada, lord: VIMSHOTTARI_ORDER[index % 9].lord };
}

function computeAt(utc: Date, input: ChartInput) {
  const positions = PLANETS.map((p) => bodyPosition(p, utc));
  const ang = angles(utc, input.latitude, input.longitude);
  return { positions, ang };
}

export function computeChart(input: ChartInput, now: Date = new Date()): ChartResult {
  const notes: string[] = [];
  const unknown = input.precision === "unknown";
  const local: LocalDateTime = unknown ? { ...input.local, hour: 12, minute: 0, second: 0 } : input.local;
  const resolved = localToUtc(local, input.timeZone);
  let utc = resolved.utc;
  let offsetMinutes = resolved.offsetMinutes;
  if (resolved.status === "ambiguous" && input.fold === 1 && resolved.alternatives?.[1]) {
    utc = new Date(resolved.alternatives[1].utc);
    offsetMinutes = resolved.alternatives[1].offsetMinutes;
  }
  if (resolved.note) notes.push(resolved.note);

  const { positions, ang } = computeAt(utc, input);
  const sun = positions.find((p) => p.planet === "Sun")!;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const lagnaSign = signOf(ang.ascendant);
  const moonSignIdx = signOf(moon.longitude);

  // ---- Confidence assessment -------------------------------------------------------------
  let lagnaReliable = input.precision === "exact";
  let moonSignStable = true;
  let nakshatraStable = true;
  let padaStable = true;
  let navamsaLagnaReliable = input.precision === "exact";
  const moonNak = nakshatraOf(moon.longitude);
  const probe = (d: Date) => {
    const m = bodyPosition("Moon", d).longitude;
    const a = angles(d, input.latitude, input.longitude).ascendant;
    return { moonSign: signOf(m), nak: nakshatraOf(m), lagna: signOf(a), d9: navamsaSign(a) };
  };
  if (input.precision === "approximate") {
    const w = (input.uncertaintyMinutes ?? 30) * 60000;
    const probes = [probe(new Date(utc.getTime() - w)), probe(new Date(utc.getTime() + w))];
    lagnaReliable = probes.every((p) => p.lagna === lagnaSign);
    navamsaLagnaReliable = probes.every((p) => p.d9 === navamsaSign(ang.ascendant));
    moonSignStable = probes.every((p) => p.moonSign === moonSignIdx);
    nakshatraStable = probes.every((p) => p.nak.index === moonNak.index);
    padaStable = probes.every((p) => p.nak.index === moonNak.index && p.nak.pada === moonNak.pada);
    notes.push(
      lagnaReliable
        ? `Birth time is approximate (±${input.uncertaintyMinutes ?? 30} min). The rising sign stays ${SIGNS[lagnaSign].name} across that window, but house cusps and degree-sensitive details may shift.`
        : `Birth time is approximate (±${input.uncertaintyMinutes ?? 30} min) and the rising sign changes within that window. House-based interpretations are withheld.`,
    );
  }
  if (unknown) {
    lagnaReliable = false;
    navamsaLagnaReliable = false;
    const startResolved = localToUtc({ ...input.local, hour: 0, minute: 0, second: 0 }, input.timeZone).utc;
    const endResolved = localToUtc({ ...input.local, hour: 23, minute: 59, second: 59 }, input.timeZone).utc;
    const probes = [probe(startResolved), probe(endResolved)];
    moonSignStable = probes.every((p) => p.moonSign === moonSignIdx);
    nakshatraStable = probes.every((p) => p.nak.index === moonNak.index);
    padaStable = probes.every((p) => p.nak.index === moonNak.index && p.nak.pada === moonNak.pada);
    notes.push(
      "Birth time unknown: positions were computed for local noon only to locate slow-moving planets. The ascendant (Lagna), houses from Lagna and house-based yogas are not shown. Houses are counted from the Moon (Chandra Lagna) instead.",
    );
    notes.push("Panchang elements (tithi, yoga, karana) are shown for local noon and may differ at your actual birth moment.");
    if (!moonSignStable) notes.push("The Moon changed sign during your birth date, so your Moon sign cannot be determined without a birth time.");
    else if (!nakshatraStable) notes.push("The Moon changed nakshatra during your birth date, so your Janma Nakshatra is uncertain.");
  }
  const dashaTimingReliable = input.precision === "exact" || (input.precision === "approximate" && nakshatraStable);
  if (!dashaTimingReliable) notes.push("Vimshottari dasha dates depend on the Moon's exact position; with this birth-time precision they can be off by months or more and are shown as indicative only.");
  if (Math.abs(input.latitude) > 60) notes.push("High-latitude birthplace: ascendant calculations are mathematically valid but signs rise unevenly; treat Lagna degree with care.");

  // ---- Placements --------------------------------------------------------------------------
  const placements: Placement[] = positions.map((p) => {
    const sign = signOf(p.longitude);
    const deg = degInSign(p.longitude);
    const nak = nakshatraOf(p.longitude);
    let combust = false;
    const orb = COMBUST_ORB[p.planet];
    if (orb) {
      let sep = Math.abs(p.longitude - sun.longitude);
      if (sep > 180) sep = 360 - sep;
      combust = sep <= orb[p.retrograde ? 1 : 0];
    }
    return {
      planet: p.planet,
      longitude: p.longitude,
      sign,
      signName: SIGNS[sign].name,
      degree: deg,
      nakshatra: nak.name,
      nakshatraIndex: nak.index,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      house: lagnaReliable || input.precision === "approximate" ? ((sign - lagnaSign + 12) % 12) + 1 : null,
      houseFromMoon: ((sign - moonSignIdx + 12) % 12) + 1,
      retrograde: p.retrograde,
      speed: p.speed,
      dignity: dignityOf(p.planet, sign, deg),
      combust,
      navamsaSign: navamsaSign(p.longitude),
      dashamsaSign: dashamsaSign(p.longitude),
    };
  });
  // Houses are only exposed when the rising sign is stable.
  const showHouses = lagnaReliable;
  if (!showHouses) for (const pl of placements) pl.house = null;

  const houses = showHouses
    ? Array.from({ length: 12 }, (_, i) => {
        const sign = (lagnaSign + i) % 12;
        return {
          house: i + 1,
          sign,
          signName: SIGNS[sign].name,
          lord: SIGNS[sign].lord as Planet,
          occupants: placements.filter((p) => p.sign === sign).map((p) => p.planet),
        };
      })
    : null;

  // ---- Aspects (sign-based Parashari drishti) ---------------------------------------------
  const aspects: Aspect[] = [];
  for (const p of placements) {
    if (p.planet === "Rahu" || p.planet === "Ketu") continue;
    for (const k of SPECIAL_ASPECTS[p.planet] ?? [7]) {
      const toSign = (p.sign + k - 1) % 12;
      aspects.push({
        from: p.planet,
        kind: k,
        toSign,
        toHouseFromLagna: showHouses ? ((toSign - lagnaSign + 12) % 12) + 1 : null,
        targets: placements.filter((q) => q.sign === toSign && q.planet !== p.planet).map((q) => q.planet),
      });
    }
  }

  // ---- Panchang ----------------------------------------------------------------------------
  const elong = norm360(moon.longitude - sun.longitude);
  const tithiIndex = Math.floor(elong / 12) + 1; // 1..30
  const tithiName = tithiIndex === 15 ? "Purnima" : tithiIndex === 30 ? "Amavasya" : TITHIS[(tithiIndex - 1) % 15];
  const karanaIdx = Math.floor(elong / 6); // 0..59
  const karana =
    karanaIdx === 0 ? "Kimstughna" : karanaIdx === 57 ? "Shakuni" : karanaIdx === 58 ? "Chatushpada" : karanaIdx === 59 ? "Naga" : KARANAS_MOVABLE[(karanaIdx - 1) % 7];
  const yogaIdx = Math.floor(norm360(sun.longitude + moon.longitude) / NAKSHATRA_SPAN);
  let vara: ChartResult["panchang"]["vara"];
  {
    const offMin = offsetAt(input.timeZone, utc.getTime());
    const localWeekday = new Date(utc.getTime() + offMin * 60000).getUTCDay();
    const sunrise = unknown ? null : previousSunrise(utc, input.latitude, input.longitude);
    if (sunrise) {
      const srLocalDay = new Date(sunrise.getTime() + offsetAt(input.timeZone, sunrise.getTime()) * 60000).getUTCDay();
      const v = VARAS[srLocalDay];
      vara = { ...v, basis: "sunrise" };
    } else {
      const v = VARAS[localWeekday];
      vara = { ...v, basis: "civil-day" };
    }
  }

  // ---- Dasha -------------------------------------------------------------------------------
  const dasha = vimshottari(moon.longitude, utc);

  const lagnaNak = nakshatraOf(ang.ascendant);
  const result: ChartResult = {
    computation: { ...COMPUTATION_VERSION, calculatedAt: now.toISOString() },
    input: {
      local: `${String(input.local.year).padStart(4, "0")}-${String(input.local.month).padStart(2, "0")}-${String(input.local.day).padStart(2, "0")}${unknown ? " (time unknown)" : `T${String(input.local.hour).padStart(2, "0")}:${String(input.local.minute).padStart(2, "0")}`}`,
      timeZone: input.timeZone,
      utcOffset: formatOffset(offsetMinutes),
      utc: utc.toISOString(),
      jdUT: ang.ctx.jdUT,
      latitude: input.latitude,
      longitude: input.longitude,
      placeLabel: input.placeLabel,
      timeResolution: resolved.status,
      timeResolutionNote: resolved.note,
      alternatives: resolved.alternatives,
      computedAtLocalNoon: unknown,
    },
    ayanamsa: ang.ayanamsa,
    lagna: lagnaReliable
      ? {
          longitude: ang.ascendant,
          sign: lagnaSign,
          signName: SIGNS[lagnaSign].name,
          degree: degInSign(ang.ascendant),
          nakshatra: lagnaNak.name,
          pada: lagnaNak.pada,
          navamsaSign: navamsaSign(ang.ascendant),
          dashamsaSign: dashamsaSign(ang.ascendant),
        }
      : null,
    moonSign: { sign: moonSignIdx, signName: SIGNS[moonSignIdx].name },
    sunSign: { sign: signOf(sun.longitude), signName: SIGNS[signOf(sun.longitude)].name },
    janmaNakshatra: { name: moonNak.name, index: moonNak.index, pada: moonNak.pada, lord: moonNak.lord },
    placements,
    houses,
    aspects,
    vargas: {
      D9: Object.fromEntries([...placements.map((p) => [p.planet, p.navamsaSign]), ["Lagna", navamsaLagnaReliable ? navamsaSign(ang.ascendant) : null]]) as ChartResult["vargas"]["D9"],
      D10: Object.fromEntries([...placements.map((p) => [p.planet, p.dashamsaSign]), ["Lagna", lagnaReliable && input.precision === "exact" ? dashamsaSign(ang.ascendant) : null]]) as ChartResult["vargas"]["D10"],
    },
    dasha,
    panchang: {
      tithi: { index: tithiIndex, name: tithiName, paksha: tithiIndex <= 15 ? "Shukla" : "Krishna" },
      nakshatra: moonNak.name,
      yoga: YOGAS_PANCHANG[yogaIdx],
      karana,
      vara,
    },
    yogas: [],
    confidence: {
      precision: input.precision,
      lagnaReliable,
      housesReliable: showHouses,
      moonSignStable,
      nakshatraStable,
      padaStable,
      dashaTimingReliable,
      navamsaLagnaReliable,
      notes,
    },
  };
  result.yogas = detectYogas(result);
  result.advanced = computeAdvanced(result);
  return result;
}

export { activePeriods, HOUSE_THEMES };
