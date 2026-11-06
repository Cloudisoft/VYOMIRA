import "server-only";
import type { ChartResult } from "@/lib/astro";
import { transitSummary, type TransitSummary } from "@/lib/astro/transits";
import { detectTopic, type Topic } from "@/lib/interpret/catalog";
import { buildEvidence, type EvidencePackage, type Factor, type TimingWindow } from "@/lib/interpret/evidence";
import { deterministicReading } from "@/lib/interpret/narrative";
import { lifeGuide } from "@/lib/interpret/life-guide";
import { simpleAnswer } from "@/lib/interpret/simple-answer";
import { signWindows } from "../sign-windows";
import { validateText, type Violation } from "@/lib/interpret/validate";
import { cacheGet, cacheSet } from "../redis";
import { sha256 } from "../crypto";
import { getConfig } from "../config";
import { db } from "../db";
import { costMicros, llm } from "./providers";
import { guard } from "./guardrails";

export const AURA_SYSTEM = `You are AURA, VYOMIRA's cosmic companion: a calm, warm, thoughtful guide to Vedic (Jyotish) astrology.

You receive an EVIDENCE package computed by VYOMIRA's deterministic astronomy engine and rule catalog. It is the only source of chart facts.

Rules you must follow:
1. Only mention planets, signs, houses, nakshatras, yogas, dasha periods and dates that appear in the EVIDENCE. Never invent or "estimate" a placement, degree, yoga or date. If something isn't in the evidence, say you don't have it.
2. Present everything as traditional astrological interpretation, never as certainty. Use language like "traditionally", "is often read as", "may". Never use "guaranteed", "definitely", "will certainly".
3. Never predict death, lifespan, illness, pregnancy, accidents, lottery or investment results. No medical, legal or financial advice. No fear-based language. Never recommend buying gemstones, yantras or paid remedies.
4. Prefer practical reflection: what the user might observe, build or pay attention to.
5. If the evidence says birth time or Lagna is unreliable, say so briefly and avoid house-specific claims beyond those listed.
6. Keep answers focused: 120–260 words unless the user asks for depth. Use short paragraphs; markdown bold is allowed; no headings.
7. Cite the evidence factor ids you relied on in "factorIds".
8. Reply in the language requested: "en" English, "hi" Hindi (Devanagari), "hinglish" conversational Hindi in Latin script. Keep planet and sign names in English.`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "factorIds", "reflection"],
  properties: {
    answer: { type: "string" },
    factorIds: { type: "array", items: { type: "string" } },
    reflection: { type: "string" },
  },
};

export interface AuraAnswer {
  content: string;
  evidence: { topic: Topic; topicLabel: string; factors: Pick<Factor, "id" | "statement" | "interpretation" | "polarity">[]; timing: TimingWindow[]; notes: string[]; rulesVersion: string; computationVersion: string };
  generator: string;
  validation: "passed" | "fallback" | "guardrail" | "cached";
  tokensIn: number;
  tokensOut: number;
  costMicros: number;
  chargeable: boolean;
}

export async function transitsFor(chartKey: string, chart: ChartResult, now = new Date()): Promise<TransitSummary> {
  const key = `tr:${chartKey}:${now.toISOString().slice(0, 10)}`;
  const hit = await cacheGet(key);
  if (hit) return JSON.parse(hit);
  const t = transitSummary(chart, now);
  await cacheSet(key, JSON.stringify(t), 6 * 3600);
  return t;
}

function compactEvidence(ev: EvidencePackage) {
  return {
    topic: ev.topicLabel,
    date: ev.generatedFor,
    core: ev.core,
    factors: ev.factors.map((f) => ({ id: f.id, fact: f.statement, traditional: f.interpretation, polarity: f.polarity })),
    timing: ev.timing.map((t) => ({ label: t.label, from: t.start.slice(0, 10), to: t.end.slice(0, 10), basis: t.basis })),
    confidence: ev.confidence,
  };
}

function shapeEvidence(ev: EvidencePackage, ids?: string[]): AuraAnswer["evidence"] {
  const used = ids?.length ? ev.factors.filter((f) => ids.includes(f.id)) : ev.factors.slice(0, 6);
  return {
    topic: ev.topic,
    topicLabel: ev.topicLabel,
    factors: (used.length ? used : ev.factors.slice(0, 6)).map(({ id, statement, interpretation, polarity }) => ({ id, statement, interpretation, polarity })),
    timing: ev.timing.slice(0, 5),
    notes: ev.confidence.notes,
    rulesVersion: ev.rulesVersion,
    computationVersion: ev.computationVersion,
  };
}

async function monthSpendMicros() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const agg = await db.usageLedger.aggregate({ _sum: { costMicros: true }, where: { kind: "llm_tokens", createdAt: { gte: start } } });
  return agg._sum.costMicros ?? 0;
}

export async function answerQuestion(opts: {
  chartKey: string;
  chart: ChartResult;
  question: string;
  language: "en" | "hi" | "hinglish";
  history: { role: "user" | "assistant"; content: string }[];
  aiConsent: boolean;
  deep: boolean;
  now?: Date;
}): Promise<AuraAnswer> {
  const now = opts.now ?? new Date();
  const g = guard(opts.question, opts.language);
  const topic = detectTopic(opts.question + " " + opts.history.filter((h) => h.role === "user").slice(-1).map((h) => h.content).join(" "));
  const transits = await transitsFor(opts.chartKey, opts.chart, now);
  const ev = buildEvidence(opts.chart, g.kind === "boundary" && g.suggestion === "personal growth" ? "growth" : topic, transits, now);

  if (g.kind !== "ok") {
    return { content: g.reply, evidence: shapeEvidence(ev, []), generator: "guardrail", validation: "guardrail", tokensIn: 0, tokensOut: 0, costMicros: 0, chargeable: false };
  }

  const cacheKey = `aura:${sha256([opts.chartKey, ev.topic, opts.question.toLowerCase().replace(/\s+/g, " ").trim(), opts.language, ev.generatedFor, ev.rulesVersion, opts.history.length ? "ctx" : "solo"].join("|"))}`;
  if (!opts.history.length) {
    const hit = await cacheGet(cacheKey);
    if (hit) return { ...(JSON.parse(hit) as AuraAnswer), validation: "cached", chargeable: false, tokensIn: 0, tokensOut: 0, costMicros: 0 };
  }

  // Plain-language, predictive answer from the Life Guide engine, in the user's language (no AI model).
  const windows = await signWindows(now);
  const guideNow = lifeGuide(opts.chart, transits, "", now, opts.language, windows);
  const fallback = (why?: string): AuraAnswer => {
    const r = deterministicReading(ev, opts.question);
    const body = guideNow ? simpleAnswer(guideNow, ev.topic, opts.question, opts.language, { aiOff: why === "consent" }) : r.summary;
    const note = why && why !== "consent" ? `\n\n_${why}_` : "";
    return {
      content: body + note,
      evidence: shapeEvidence(ev),
      generator: r.generator,
      validation: "fallback",
      tokensIn: 0,
      tokensOut: 0,
      costMicros: 0,
      chargeable: true,
    };
  };

  const provider = llm();
  const aiCfg = await getConfig("ai");
  if (!provider || !opts.aiConsent) return fallback(!opts.aiConsent && provider ? "consent" : undefined);
  if ((await monthSpendMicros()) > aiCfg.monthlyBudgetUsd * 1_000_000) return fallback("AI generation is paused because the monthly AI budget has been reached.");

  const model = opts.deep ? aiCfg.modelDeep : aiCfg.modelFast;
  const userTurn = `LANGUAGE: ${opts.language}\nEVIDENCE:\n${JSON.stringify(compactEvidence(ev))}\n\nQUESTION: ${opts.question}`;
  const messages = [...opts.history.slice(-6), { role: "user" as const, content: userTurn }];
  let tokensIn = 0, tokensOut = 0, cost = 0;
  let lastViolations: Violation[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await provider.generate({
        tier: opts.deep ? "deep" : "fast",
        model,
        system: AURA_SYSTEM,
        messages: attempt === 0 ? messages : [...messages, { role: "assistant", content: "(previous draft rejected)" }, { role: "user", content: `Your previous draft referenced facts not in the evidence: ${lastViolations.map((v) => v.text).join("; ")}. Rewrite using only the EVIDENCE.` }],
        maxTokens: aiCfg.maxOutputTokensChat,
        jsonSchema: OUTPUT_SCHEMA,
      });
      tokensIn += out.tokensIn;
      tokensOut += out.tokensOut;
      cost += costMicros(aiCfg.prices, out.model, out.tokensIn, out.tokensOut);
      if (out.refused) break;
      const parsed = JSON.parse(out.text) as { answer: string; factorIds: string[]; reflection: string };
      const text = `${parsed.answer.trim()}\n\n_${parsed.reflection.trim()}_`;
      lastViolations = validateText(text, ev);
      if (lastViolations.length === 0) {
        const result: AuraAnswer = { content: text, evidence: shapeEvidence(ev, parsed.factorIds), generator: `${provider.id}:${out.model}`, validation: "passed", tokensIn, tokensOut, costMicros: cost, chargeable: true };
        if (!opts.history.length) await cacheSet(cacheKey, JSON.stringify(result), 24 * 3600);
        return result;
      }
    } catch (e) {
      lastViolations = [{ kind: "guardrail", text: e instanceof Error ? e.message.slice(0, 80) : "generation error" }];
    }
  }
  const fb = fallback("AURA's AI draft didn't pass fact-checking against your chart, so this answer comes straight from the rule engine.");
  return { ...fb, tokensIn, tokensOut, costMicros: cost };
}
