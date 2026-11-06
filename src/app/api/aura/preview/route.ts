import { z } from "zod";
import { birthInputSchema } from "@/lib/schemas";
import { calculate } from "@/server/charts";
import { err, json, parseBody, publicLimited } from "@/server/http";
import { transitSummary } from "@/lib/astro/transits";
import { detectTopic } from "@/lib/interpret/catalog";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading } from "@/lib/interpret/narrative";
import { guard } from "@/server/ai/guardrails";
import { lifeGuide } from "@/lib/interpret/life-guide";
import { toLang } from "@/lib/interpret/life-guide-i18n";
import { simpleAnswer } from "@/lib/interpret/simple-answer";
import { signWindows } from "@/server/sign-windows";

/** Anonymous AURA preview: plain-language timing answer in the chosen language (no LLM, no storage). */
export async function POST(req: Request) {
  const limited = await publicLimited("aura-preview", 8, 600);
  if (limited) return limited;
  const p = await parseBody(req, z.object({ birth: birthInputSchema, question: z.string().trim().min(3).max(300) }));
  if (!p.ok) return p.res;
  const lang = toLang(p.data.birth.language);
  const g = guard(p.data.question, lang);
  if (g.kind !== "ok") return json({ guard: g.reply });
  try {
    const chart = calculate(p.data.birth);
    const now = new Date();
    const transits = transitSummary(chart, now, true);
    const topic = detectTopic(p.data.question);
    const ev = buildEvidence(chart, topic, transits);
    const guide = lifeGuide(chart, transits, p.data.birth.fullName, now, lang, await signWindows(now));
    return json({ reading: deterministicReading(ev, p.data.question), answer: guide ? simpleAnswer(guide, topic, p.data.question, lang) : null });
  } catch {
    return err(500, "Could not prepare an answer right now.");
  }
}
