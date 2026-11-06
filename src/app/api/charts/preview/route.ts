import { birthInputSchema } from "@/lib/schemas";
import { calculate, ChartError } from "@/server/charts";
import { err, json, parseBody, publicLimited } from "@/server/http";
import { transitSummary } from "@/lib/astro/transits";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading } from "@/lib/interpret/narrative";
import { lifeGuide } from "@/lib/interpret/life-guide";
import { toLang } from "@/lib/interpret/life-guide-i18n";
import { signWindows } from "@/server/sign-windows";

/** Anonymous chart calculation. Nothing is stored or logged; the chart is returned to the browser only. */
export async function POST(req: Request) {
  const limited = await publicLimited("chart-preview", 20, 600);
  if (limited) return limited;
  const p = await parseBody(req, birthInputSchema);
  if (!p.ok) return p.res;
  try {
    const chart = calculate(p.data);
    const now = new Date();
    const transits = transitSummary(chart, now, true);
    const insight = deterministicReading(buildEvidence(chart, "general", transits));
    // The plain-language Life Guide (past / now / future per life area) in the chosen language
    const guide = lifeGuide(chart, transits, p.data.fullName, now, toLang(p.data.language), await signWindows(now));
    return json({ chart, insight, guide }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ChartError) return err(422, e.message);
    console.error("[chart-preview] failed", e instanceof Error ? e.message : "unknown");
    return err(500, "We couldn't calculate this chart. Please check the details and try again.");
  }
}
