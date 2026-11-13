import "server-only";
import { getConfig } from "../config";
import { db } from "../db";
import { costMicros, llm } from "./providers";
import { guard } from "./guardrails";
import { userContext, type System, type UserContext } from "../readings/context";
import { mentionsUndrawnCard, numbersOutsideFacts } from "../readings/generate";
import type { AuraAnswer } from "./aura";

export type AuraMode = "astrology" | "numerology" | "tarot" | "palmistry" | "combined";
const SYSTEMS: Record<Exclude<AuraMode, "astrology">, System[]> = {
  numerology: ["numerology"], tarot: ["tarot"], palmistry: ["palmistry"], combined: ["astrology", "numerology", "tarot", "palmistry"],
};
const LABEL: Record<string, string> = { numerology: "Numerology", tarot: "Tarot", palmistry: "Palmistry", combined: "Combined", astrology: "Astrology" };

const SYSTEM_PROMPT = `You are AURA, VYOMIRA's calm, warm guide. In this conversation you answer from the user's own readings, supplied as CONTEXT (computed numerology numbers, tarot cards they actually drew, palm features actually observed in their photos, and their astrology Life Guide). CONTEXT is the only source of facts.

Rules:
1. Never invent a number, card, palm line or chart factor. If CONTEXT lacks what's needed, say so plainly and suggest which reading would answer it.
2. Tarot cards are interpreted only as drawn (name, position, orientation) and only for the question they were drawn for; say so if the user asks something different. Palm lines marked "not visible" must not be interpreted.
3. In combined mode, label each point with its system (Astrology / Numerology / Palmistry / Tarot). Note agreement or difference between systems; never present them as scientific or as certainty.
4. Answer format: "directAnswer" — one or two sentences answering exactly what was asked. "evidence" — 2–4 short bullets naming the specific facts used. "interpretation" — one short paragraph on what it means in practice. "reflection" — one practical suggestion. "followUp" — one natural next question, or "".
5. No filler: no greetings, no restating the question, no generic intros, no re-explaining basics the user already knows, no repeating earlier answers in the conversation — build on them.
6. Never predict death, illness, accidents, pregnancy, lottery or investment results; no medical, legal or financial advice; no fear-based language; never sell remedies.
7. Reply in the requested language: "en" English, "hi" Hindi (Devanagari), "hinglish" Hindi in Latin script.`;

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["directAnswer", "evidence", "interpretation", "reflection", "followUp"],
  properties: { directAnswer: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, interpretation: { type: "string" }, reflection: { type: "string" }, followUp: { type: "string" } },
};

const T = {
  en: { based: "What this is based on", also: "You could also ask", none: (m: string) => `You don't have a ${m} reading yet, so I can't answer this from ${m} without guessing. Start one from **My Readings** and I'll answer from what it actually shows.`, plain: "Here is what your readings show." },
  hi: { based: "यह किस पर आधारित है", also: "आप यह भी पूछ सकते हैं", none: (m: string) => `आपकी अभी कोई ${m} रीडिंग नहीं है, इसलिए अनुमान लगाए बिना मैं इसका उत्तर नहीं दे सकता। **My Readings** से एक रीडिंग शुरू करें।`, plain: "आपकी रीडिंग यह दिखाती है।" },
  hinglish: { based: "Yeh kis par based hai", also: "Aap yeh bhi pooch sakte hain", none: (m: string) => `Aapki abhi koi ${m} reading nahi hai, isliye bina guess kiye main jawaab nahi de sakta. **My Readings** se ek reading shuru kijiye.`, plain: "Aapki readings yeh dikhati hain." },
} as const;

function evidenceOf(ctx: UserContext, mode: AuraMode) {
  const f: { id: string; statement: string; interpretation: string; polarity: "neutral" }[] = [];
  if (ctx.numerology) f.push({ id: "num", statement: `Numerology (${ctx.numerology.method}${ctx.numerology.source === "birth details" ? ", from birth details" : ""}): Life Path ${ctx.numerology.lifePath}, Expression ${ctx.numerology.expression}, Soul Urge ${ctx.numerology.soulUrge}, Personal Year ${ctx.numerology.personalYear}`, interpretation: ctx.numerology.meanings.lifePath, polarity: "neutral" as const });
  for (const t of ctx.tarot ?? []) f.push({ id: `tarot-${t.readingId}`, statement: `Tarot ${t.spread} (${t.date}): ${t.cards.map((c) => `${c.position}: ${c.card}${c.orientation === "reversed" ? " (reversed)" : ""}`).join("; ")}`, interpretation: t.question ? `Question: ${t.question}` : "", polarity: "neutral" as const });
  if (ctx.palmistry) f.push({ id: "palm", statement: `Palm reading (${ctx.palmistry.date})`, interpretation: ctx.palmistry.observations.slice(0, 6).join("; "), polarity: "neutral" as const });
  if (ctx.astrology && mode === "combined") f.push({ id: "astro", statement: "Astrology Life Guide", interpretation: ctx.astrology.headline, polarity: "neutral" as const });
  return { topic: "general" as const, topicLabel: LABEL[mode], factors: f.slice(0, 8), timing: [], notes: [], rulesVersion: "readings-1", computationVersion: "readings-1" };
}

/** Rule-based answer used when AI is off: shows the relevant facts in the same answer format. */
function plainAnswer(ctx: UserContext, mode: AuraMode, question: string, lang: keyof typeof T) {
  const q = question.toLowerCase();
  const area = /career|job|work|naukri|business|kaam/.test(q) ? "career" : /love|marriage|partner|relationship|shaadi|pyaar/.test(q) ? "love" : /money|finance|paisa|wealth|income/.test(q) ? "money" : "general";
  const lines: string[] = [];
  const n = ctx.numerology;
  if (n && (mode === "numerology" || mode === "combined")) lines.push(`**Numerology** — ${area === "career" ? `Expression ${n.expression}: ${n.career}` : area === "love" ? `Soul Urge ${n.soulUrge}: ${n.love}` : area === "money" ? `Personal Year ${n.personalYear} (${n.year}): ${n.yearTheme}.` : `Life Path ${n.lifePath} — ${n.meanings.lifePath}. This year (${n.year}) is Personal Year ${n.personalYear}: ${n.yearTheme}.`}`);
  const t = ctx.tarot?.[0];
  if (t && (mode === "tarot" || mode === "combined")) lines.push(`**Tarot** — your ${t.spread} (${t.date})${t.question ? ` for “${t.question}”` : ""}: ${t.cards.map((c) => `${c.position}: **${c.card}**${c.orientation === "reversed" ? " reversed" : ""} — ${c.meaning}`).join("; ")}.`);
  if (ctx.palmistry && (mode === "palmistry" || mode === "combined")) {
    const s = ctx.palmistry.sections[area === "love" ? "relationships" : area === "career" ? "career" : "summary"] ?? ctx.palmistry.sections.overview ?? "";
    lines.push(`**Palmistry** — ${s.split(/\n/)[0]}`);
  }
  if (ctx.astrology && mode === "combined") {
    const a = ctx.astrology.areas[area === "general" ? "career" : area];
    lines.push(`**Astrology** — ${area === "general" ? ctx.astrology.headline : `${a?.label}: ${a?.text.split(/(?<=[.!?।])\s/)[0] ?? ""}`}`);
  }
  return `${T[lang].plain}\n\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

export async function answerFromReadings(opts: { userId: string; mode: Exclude<AuraMode, "astrology">; question: string; language: "en" | "hi" | "hinglish"; history: { role: "user" | "assistant"; content: string }[]; aiConsent: boolean; deep: boolean }): Promise<AuraAnswer> {
  const g = guard(opts.question, opts.language);
  const ctx = await userContext(opts.userId, SYSTEMS[opts.mode], opts.language);
  const evidence = evidenceOf(ctx, opts.mode);
  const base = { evidence, tokensIn: 0, tokensOut: 0, costMicros: 0 };
  if (g.kind !== "ok") return { ...base, content: g.reply, generator: "guardrail", validation: "guardrail", chargeable: false };
  const has = SYSTEMS[opts.mode].some((s) => ctx[s]);
  if (!has) return { ...base, content: T[opts.language].none(LABEL[opts.mode].toLowerCase()), generator: "rules", validation: "fallback", chargeable: false };

  const provider = llm();
  if (!provider || !opts.aiConsent) return { ...base, content: plainAnswer(ctx, opts.mode, opts.question, opts.language), generator: "rules", validation: "fallback", chargeable: true };
  const ai = await getConfig("ai");
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const spent = (await db.usageLedger.aggregate({ _sum: { costMicros: true }, where: { kind: "llm_tokens", createdAt: { gte: start } } }))._sum.costMicros ?? 0;
  if (spent > ai.monthlyBudgetUsd * 1_000_000) return { ...base, content: plainAnswer(ctx, opts.mode, opts.question, opts.language), generator: "rules", validation: "fallback", chargeable: true };

  const model = opts.deep || opts.mode === "combined" ? ai.modelDeep : ai.modelFast;
  const userTurn = `MODE: ${opts.mode}\nLANGUAGE: ${opts.language}\nCONTEXT:\n${JSON.stringify(ctx)}\n\nQUESTION: ${opts.question}`;
  const drawn = (ctx.tarot ?? []).flatMap((t) => t.cards.map((c) => c.card));
  const allowedNums = new Set((JSON.stringify(ctx).match(/\d+/g) ?? []).map(Number));
  let tokensIn = 0, tokensOut = 0, cost = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await provider.generate({ tier: model === ai.modelDeep ? "deep" : "fast", model, system: SYSTEM_PROMPT, messages: [...opts.history.slice(-6), { role: "user", content: attempt ? `${userTurn}\n\n(Your previous draft mentioned facts not in CONTEXT. Use only CONTEXT.)` : userTurn }], maxTokens: ai.maxOutputTokensChat, jsonSchema: SCHEMA });
      tokensIn += out.tokensIn; tokensOut += out.tokensOut; cost += costMicros(ai.prices, out.model, out.tokensIn, out.tokensOut);
      if (out.refused) break;
      const p = JSON.parse(out.text) as { directAnswer: string; evidence: string[]; interpretation: string; reflection: string; followUp: string };
      const L = T[opts.language];
      const text = [p.directAnswer.trim(), p.evidence.length ? `**${L.based}:**\n${p.evidence.map((e) => `- ${e.trim()}`).join("\n")}` : "", p.interpretation.trim(), p.reflection.trim() ? `_${p.reflection.trim()}_` : "", p.followUp.trim() ? `**${L.also}:** ${p.followUp.trim()}` : ""].filter(Boolean).join("\n\n");
      const badCard = (opts.mode === "tarot" || opts.mode === "combined") && mentionsUndrawnCard(text, drawn);
      const badNum = opts.mode === "numerology" && numbersOutsideFacts(text, allowedNums).filter((x) => x > 3).length > 0;
      if (badCard || badNum) continue;
      return { ...base, content: text, generator: `${provider.id}:${out.model}`, validation: "passed", tokensIn, tokensOut, costMicros: cost, chargeable: true };
    } catch { /* retry once, then fall back */ }
  }
  return { ...base, content: plainAnswer(ctx, opts.mode, opts.question, opts.language), generator: "rules", validation: "fallback", tokensIn, tokensOut, costMicros: cost, chargeable: true };
}
