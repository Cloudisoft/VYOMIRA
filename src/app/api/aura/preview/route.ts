import { z } from "zod";
import { birthInputSchema } from "@/lib/schemas";
import { calculate } from "@/server/charts";
import { err, json, parseBody, publicLimited } from "@/server/http";
import { transitSummary } from "@/lib/astro/transits";
import { detectTopic } from "@/lib/interpret/catalog";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading } from "@/lib/interpret/narrative";
import { guard } from "@/server/ai/guardrails";

/** Anonymous AURA preview: rule-engine answer only (no LLM, no storage). */
export async function POST(req: Request) {
  const limited = await publicLimited("aura-preview", 8, 600);
  if (limited) return limited;
  const p = await parseBody(req, z.object({ birth: birthInputSchema, question: z.string().trim().min(3).max(300) }));
  if (!p.ok) return p.res;
  const g = guard(p.data.question, "en");
  if (g.kind !== "ok") return json({ guard: g.reply });
  try {
    const chart = calculate(p.data.birth);
    const ev = buildEvidence(chart, detectTopic(p.data.question), transitSummary(chart, new Date(), true));
    return json({ reading: deterministicReading(ev, p.data.question) });
  } catch {
    return err(500, "Could not prepare an answer right now.");
  }
}
