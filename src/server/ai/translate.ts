import "server-only";
import type { ReportContent } from "../reports";
import { getConfig } from "../config";
import { costMicros, llm } from "./providers";

/**
 * Hindi report translation (Layer 4 applied to an already-validated deterministic report).
 * Guard: every digit sequence (degrees, dates, years, scores) in each source string must survive
 * unchanged in its translation; otherwise we keep that string in English.
 */
/** Significant numbers only: decimals, degrees/minutes, ISO dates, 4-digit years, scores like 28/36.
 * Small integers (house ordinals "1st", "10th") may legitimately become words (प्रथम, दशम). */
const digits = (s: string) => (s.match(/\d{4}-\d{2}-\d{2}|\d+\.\d+|\d+(?=\s*[°′″%])|\b\d{3,4}\b|\d+\/\d+/g) ?? []).sort().join(",");

const SYSTEM = `You translate Vedic astrology report text from English into natural, respectful Hindi (Devanagari) for an Indian reader.
Rules: translate meaning faithfully; do not add, remove or soften claims; keep every number, date, degree and year exactly as written using Western digits; write planet, sign and nakshatra names in Hindi (e.g. शनि, मकर, रोहिणी); keep "Lagna", "Mahadasha", "Antardasha" as लग्न, महादशा, अंतर्दशा. Return JSON {"t": [...]} with exactly one translated string per input string, same order.`;

export async function translateReportToHindi(r: ReportContent): Promise<{ content: ReportContent; tokensIn: number; tokensOut: number; costMicros: number; model: string } | null> {
  const provider = llm();
  if (!provider) return null;
  const ai = await getConfig("ai");
  // Collect translatable strings (name, ids and computed values that are pure data stay as they are).
  const src: string[] = [];
  const push = (s: string) => (src.push(s), src.length - 1);
  const idx = {
    title: push(r.title),
    labels: r.chartSummary.map((s) => push(s.label)),
    summary: push(r.reading.summary),
    factors: r.reading.factors.map((f) => [push(f.statement), push(f.interpretation)]),
    timing: r.reading.timing.map((t) => [push(t.label), push(t.basis)]),
    sup: r.reading.supportive.map(push),
    chal: r.reading.challenging.map(push),
    refl: r.reading.reflections.map(push),
    meth: r.methodology.map(push),
    disc: r.disclaimer.map(push),
  };
  const out = await provider.generate({
    tier: "fast",
    model: ai.modelFast,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ strings: src }) }],
    maxTokens: Math.min(16000, ai.maxOutputTokensReport * 2),
    jsonSchema: { type: "object", additionalProperties: false, required: ["t"], properties: { t: { type: "array", items: { type: "string" } } } },
  });
  if (out.refused) return null;
  const t = (JSON.parse(out.text) as { t: string[] }).t;
  if (t.length !== src.length) return null;
  const tr = (i: number) => (t[i] && digits(t[i]) === digits(src[i]) ? t[i] : src[i]);
  const content: ReportContent = {
    ...r,
    title: tr(idx.title),
    chartSummary: r.chartSummary.map((s, i) => ({ ...s, label: tr(idx.labels[i]) })),
    reading: {
      ...r.reading,
      summary: tr(idx.summary),
      factors: r.reading.factors.map((f, i) => ({ ...f, statement: tr(idx.factors[i][0]), interpretation: tr(idx.factors[i][1]) })),
      timing: r.reading.timing.map((x, i) => ({ ...x, label: tr(idx.timing[i][0]), basis: tr(idx.timing[i][1]) })),
      supportive: idx.sup.map(tr),
      challenging: idx.chal.map(tr),
      reflections: idx.refl.map(tr),
    },
    methodology: idx.meth.map(tr),
    disclaimer: idx.disc.map(tr),
  };
  return { content, tokensIn: out.tokensIn, tokensOut: out.tokensOut, costMicros: costMicros(ai.prices, out.model, out.tokensIn, out.tokensOut), model: out.model };
}
