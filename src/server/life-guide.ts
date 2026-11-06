import "server-only";
import type { ChartResult } from "@/lib/astro/chart";
import { lifeGuide } from "@/lib/interpret/life-guide";
import type { Lang } from "@/lib/interpret/life-guide-i18n";
import { transitsFor } from "./ai/aura";
import { signWindows } from "./sign-windows";

export async function lifeGuideFor(chartId: string, chart: ChartResult, name: string, lang: Lang, now = new Date()) {
  const [transits, windows] = await Promise.all([transitsFor(chartId, chart, now), signWindows(now)]);
  return lifeGuide(chart, transits, name, now, lang, windows);
}
