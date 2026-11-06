import "server-only";
import type { ChartResult } from "@/lib/astro/chart";
import { lifeGuide, slowSignWindows, type SignWindow } from "@/lib/interpret/life-guide";
import type { Lang } from "@/lib/interpret/life-guide-i18n";
import { transitsFor } from "./ai/aura";
import { cacheGet, cacheSet } from "./redis";

/** Jupiter/Saturn sign windows are the same for everyone on a given day — compute once, cache 12 h. */
async function signWindows(now: Date): Promise<SignWindow[]> {
  const key = `sw:v1:${now.toISOString().slice(0, 10)}`;
  const hit = await cacheGet(key);
  if (hit) return JSON.parse(hit);
  const w = slowSignWindows(now, 8);
  await cacheSet(key, JSON.stringify(w), 12 * 3600);
  return w;
}

export async function lifeGuideFor(chartId: string, chart: ChartResult, name: string, lang: Lang, now = new Date()) {
  const [transits, windows] = await Promise.all([transitsFor(chartId, chart, now), signWindows(now)]);
  return lifeGuide(chart, transits, name, now, lang, windows);
}
