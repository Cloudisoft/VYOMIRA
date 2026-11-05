import "server-only";
import { computeChart } from "@/lib/astro";
import { transitSummary } from "@/lib/astro/transits";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading } from "@/lib/interpret/narrative";
import type { SampleData } from "@/components/home/types";

let memo: { day: string; data: SampleData } | null = null;

/** A real chart for a published sample moment, recomputed daily (transits change). */
export function sampleData(): SampleData {
  const day = new Date().toISOString().slice(0, 10);
  if (memo?.day === day) return memo.data;
  const chart = computeChart({ local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi, Delhi, India", precision: "exact" });
  const transits = transitSummary(chart, new Date(), true);
  const qs: [string, "career" | "general" | "love" | "growth"][] = [
    ["What does my current Mahadasha indicate?", "general"],
    ["When is a traditionally favorable phase for career changes?", "career"],
    ["Which relationship patterns appear in my chart?", "love"],
    ["How do current transits relate to my personal growth?", "growth"],
  ];
  const answers = qs.map(([question, topic]) => ({ question, reading: deterministicReading(buildEvidence(chart, topic, transits), question) }));
  const data: SampleData = { label: "15 August 1990, 10:30 IST, New Delhi — a sample birth moment, not a real person.", chart, transits, answers };
  memo = { day, data };
  return data;
}
