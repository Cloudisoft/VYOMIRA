import "server-only";
import { computeChart, COMPUTATION_VERSION, type ChartInput, type ChartResult } from "@/lib/astro";
import { computeAdvanced } from "@/lib/astro/advanced";
import type { BirthInput } from "@/lib/schemas";
import { db } from "./db";
import { decryptJson, encryptJson, sha256 } from "./crypto";
import { placeById } from "./places";

export class ChartError extends Error {}

export function toChartInput(b: BirthInput): ChartInput {
  const place = placeById(b.placeId);
  if (!place) throw new ChartError("Unknown birthplace");
  const [year, month, day] = b.date.split("-").map(Number);
  const [hour, minute] = (b.time || "12:00").split(":").map(Number);
  return {
    local: { year, month, day, hour, minute, second: 0 },
    timeZone: place.tz,
    latitude: place.lat,
    longitude: place.lng,
    placeLabel: place.label,
    precision: b.precision,
    uncertaintyMinutes: b.precision === "approximate" ? (b.uncertaintyMinutes ?? 30) : undefined,
    fold: b.fold,
  };
}

export function calculate(b: BirthInput): ChartResult {
  return computeChart(toChartInput(b));
}

const PREC = { exact: "EXACT", approximate: "APPROXIMATE", unknown: "UNKNOWN" } as const;

/** Persist a birth profile (encrypted) and its chart snapshot with normalized placements/dashas. */
export async function saveChart(userId: string, b: BirthInput) {
  const place = placeById(b.placeId);
  if (!place) throw new ChartError("Unknown birthplace");
  const chart = calculate(b);
  const inputHash = sha256(JSON.stringify({ d: b.date, t: b.time, p: b.precision, u: b.uncertaintyMinutes, pl: b.placeId, f: b.fold ?? 0, v: COMPUTATION_VERSION.id }));

  return db.$transaction(async (tx) => {
    await tx.computationVersion.upsert({ where: { id: COMPUTATION_VERSION.id }, create: { id: COMPUTATION_VERSION.id, conventions: COMPUTATION_VERSION as never }, update: {} });
    const gp = await tx.geocodedPlace.upsert({
      where: { source_sourceId: { source: "geonames", sourceId: String(place.id) } },
      create: { source: "geonames", sourceId: String(place.id), name: place.name, admin1: place.admin1, country: place.country, latitude: place.lat, longitude: place.lng, timeZone: place.tz },
      update: {},
    });
    await tx.birthProfile.updateMany({ where: { userId, isPrimary: true }, data: { isPrimary: false } });
    const profile = await tx.birthProfile.create({
      data: {
        userId,
        encryptedDetails: encryptJson({ fullName: b.fullName, date: b.date, time: b.time ?? null }),
        precision: PREC[b.precision],
        uncertaintyMinutes: b.uncertaintyMinutes ?? null,
        fold: b.fold ?? 0,
        placeId: gp.id,
        language: b.language,
        isPrimary: true,
      },
    });
    const snap = await tx.chartSnapshot.create({
      data: { birthProfileId: profile.id, computationVersionId: COMPUTATION_VERSION.id, inputHash, encryptedPayload: encryptJson(chart), confidence: chart.confidence as never },
    });
    await tx.planetaryPlacement.createMany({
      data: chart.placements.flatMap((p) => [
        { chartSnapshotId: snap.id, varga: "D1", planet: p.planet, sign: p.sign, degree: p.degree, longitude: p.longitude, house: p.house, nakshatra: p.nakshatra, pada: p.pada, retrograde: p.retrograde, dignity: p.dignity },
        { chartSnapshotId: snap.id, varga: "D9", planet: p.planet, sign: p.navamsaSign },
        { chartSnapshotId: snap.id, varga: "D10", planet: p.planet, sign: p.dashamsaSign },
      ]),
    });
    await tx.dashaPeriod.createMany({
      data: chart.dasha.mahadashas.flatMap((m) => [
        { chartSnapshotId: snap.id, level: 1, lord: m.lord, startsAt: new Date(m.start), endsAt: new Date(m.end) },
        ...(m.children ?? []).map((a) => ({ chartSnapshotId: snap.id, level: 2, lord: a.lord, parentLord: m.lord, startsAt: new Date(a.start), endsAt: new Date(a.end) })),
      ]),
    });
    return { profileId: profile.id, chartId: snap.id, chart };
  });
}

export interface LoadedChart {
  chartId: string;
  profileId: string;
  fullName: string;
  language: string;
  chart: ChartResult;
  birth: { date: string; time: string | null };
}

/** Loads the user's chart. All lookups are scoped by userId (IDOR-safe). */
export async function loadChart(userId: string, chartId?: string): Promise<LoadedChart | null> {
  const snap = await db.chartSnapshot.findFirst({
    where: chartId ? { id: chartId, birthProfile: { userId } } : { birthProfile: { userId, isPrimary: true } },
    orderBy: { calculatedAt: "desc" },
    include: { birthProfile: true },
  });
  if (!snap) return null;
  const details = decryptJson<{ fullName: string; date: string; time: string | null }>(snap.birthProfile.encryptedDetails);
  return {
    chartId: snap.id,
    profileId: snap.birthProfileId,
    fullName: details.fullName,
    language: snap.birthProfile.language,
    chart: withAdvanced(decryptJson<ChartResult>(snap.encryptedPayload)),
    birth: { date: details.date, time: details.time },
  };
}

export const chartFactsHash = (c: ChartResult) =>
  sha256(JSON.stringify({ v: c.computation.id, p: c.placements.map((p) => [p.planet, p.sign, p.house, p.nakshatra]), l: c.lagna?.sign ?? null, d: c.dasha.balanceAtBirth.totalYears.toFixed(4) }));

/** Charts saved before the advanced layer existed get it computed on read (same inputs, deterministic). */
function withAdvanced(c: ChartResult): ChartResult {
  return c.advanced ? c : { ...c, advanced: computeAdvanced(c) };
}
