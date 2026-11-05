import type { ChartResult } from "@/lib/astro/chart";
import type { TransitSummary } from "@/lib/astro/transits";
import type { Reading } from "@/lib/interpret/narrative";

export interface SampleData {
  label: string;
  chart: ChartResult;
  transits: TransitSummary;
  answers: { question: string; reading: Reading }[];
}
