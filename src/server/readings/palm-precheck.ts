import "server-only";
import { getConfig } from "../config";
import { hasConsent } from "../consent";
import { costMicros, llm } from "../ai/providers";
import { recordTokenUsage } from "../billing/entitlements";
import { logError } from "../audit";

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["isPalm", "linesTraceable", "problem"],
  properties: { isPalm: { type: "boolean" }, linesTraceable: { type: "boolean" }, problem: { type: "string" } },
};
const LANG = { en: "English", hi: "Hindi (Devanagari)", hinglish: "Hinglish (Hindi in Latin script)" } as Record<string, string>;

/**
 * Quick, low-cost check at upload time (before payment): is this a human palm with traceable major
 * lines? Returns null when the check can't run (no AI / no consent / error) — the full analysis after
 * payment still guards against unusable photos, and retakes are always free.
 */
export async function palmPrecheck(userId: string, readingId: string, jpegB64: string, side: string, lang: string): Promise<{ ok: boolean; problem: string } | null> {
  const provider = llm();
  if (!provider || !(await hasConsent(userId, "ai_processing"))) return null;
  try {
    const ai = await getConfig("ai");
    const out = await provider.generate({
      tier: "fast", model: ai.modelFast, maxTokens: 600, jsonSchema: SCHEMA, effort: "low",
      images: [{ mediaType: "image/jpeg", data: jpegB64 }],
      system: "You check photos uploaded for a palm reading. Decide only: is this a photo of a human palm (inner side of the hand), and could someone trace at least two of the major lines (life, head, heart)? Be strict but fair: normal phone photos with ordinary lighting pass. If it fails, explain the single most important fix in one short, friendly sentence.",
      messages: [{ role: "user", content: `This should be the ${side} palm. Reply "problem" in ${LANG[lang] ?? "English"} (empty string if it passes).` }],
    });
    await recordTokenUsage(userId, out.model, out.tokensIn, out.tokensOut, costMicros(ai.prices, out.model, out.tokensIn, out.tokensOut), `reading:${readingId}:precheck`);
    if (out.refused || !out.text) return null;
    const j = JSON.parse(out.text) as { isPalm: boolean; linesTraceable: boolean; problem: string };
    return { ok: j.isPalm && j.linesTraceable, problem: j.problem };
  } catch (e) {
    logError("palm-precheck", e, userId);
    return null;
  }
}
