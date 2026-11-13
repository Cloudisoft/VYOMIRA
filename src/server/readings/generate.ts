import "server-only";
import { db } from "../db";
import { getConfig } from "../config";
import { hasConsent } from "../consent";
import { decryptJson } from "../crypto";
import { audit, logError } from "../audit";
import { costMicros, llm } from "../ai/providers";
import { recordTokenUsage } from "../billing/entitlements";
import { buildNumerologyReport, NUMEROLOGY_SECTIONS, numerologyFacts, TIER_SECTIONS, type NumerologyTier } from "@/lib/readings/numerology-report";
import { numerologyProfile } from "@/lib/readings/numerology";
import { CARD, DECK, SPREADS, suitTheme, TAROT_CATEGORY_LABEL, type DrawnCard, type SpreadId } from "@/lib/readings/tarot";
import { dedupeReport, READING_DISCLAIMER, type ReportSection } from "@/lib/readings/report";
import { readInput } from "./service";
import type { NumerologyInput, PalmistryInput, TarotInput } from "./inputs";

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi in Devanagari script", hinglish: "Hinglish (conversational Hindi written in Latin script)" };

const WRITER_RULES = `You write one section at a time of a personal reading for VYOMIRA. Rules:
- Use ONLY the facts provided. Never invent numbers, cards, lines or features.
- Each section has a SCOPE. Stay inside it. Do not re-introduce the person, the method or earlier sections; refer back briefly ("as your Life Path suggests") instead of restating.
- No filler intros ("In this section…"), no "In conclusion" outside the summary, no disclaimers (the app adds one at the end), no headings unless asked.
- Warm, plain, specific language. Short paragraphs. Markdown bold allowed.
- Never predict death, illness, accidents, pregnancy or financial results; no medical, legal or financial advice; no fear-based language; never sell remedies.
- Present meanings as traditional interpretation ("traditionally", "often read as"), not certainty.`;

const SECTIONS_SCHEMA = {
  type: "object", additionalProperties: false, required: ["sections"],
  properties: { sections: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "body"], properties: { id: { type: "string" }, body: { type: "string" } } } } },
};

async function aiAllowed(userId: string) {
  const provider = llm();
  if (!provider) return null;
  if (!(await hasConsent(userId, "ai_processing"))) return null;
  const ai = await getConfig("ai");
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const spent = (await db.usageLedger.aggregate({ _sum: { costMicros: true }, where: { kind: "llm_tokens", createdAt: { gte: start } } }))._sum.costMicros ?? 0;
  if (spent > ai.monthlyBudgetUsd * 1_000_000) return null;
  return { provider, ai };
}

async function callJson<T>(userId: string, readingId: string, opts: { model: string; tier: "fast" | "deep"; system: string; user: string; images?: { mediaType: "image/jpeg"; data: string }[]; maxTokens: number; schema: Record<string, unknown>; effort?: "low" | "medium" | "high" }): Promise<{ data: T; generator: string } | null> {
  const ok = await aiAllowed(userId);
  if (!ok) return null;
  const out = await ok.provider.generate({ tier: opts.tier, model: opts.model, system: opts.system, messages: [{ role: "user", content: opts.user }], maxTokens: opts.maxTokens, jsonSchema: opts.schema, images: opts.images, effort: opts.effort });
  await recordTokenUsage(userId, out.model, out.tokensIn, out.tokensOut, costMicros(ok.ai.prices, out.model, out.tokensIn, out.tokensOut), `reading:${readingId}`);
  if (out.refused || !out.text) return null;
  return { data: JSON.parse(out.text) as T, generator: `${ok.provider.id}:${out.model}` };
}

// ───────────────────────── Numerology ─────────────────────────

/** Integers the writer may mention: anything present in the computed facts. */
function allowedNumbers(facts: unknown) {
  return new Set((JSON.stringify(facts).match(/\d+/g) ?? []).map(Number));
}

export function numbersOutsideFacts(text: string, allowed: Set<number>) {
  return (text.match(/\b\d+\b/g) ?? []).map(Number).filter((n) => !allowed.has(n));
}

async function generateNumerology(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string }) {
  const input = readInput<NumerologyInput>(r);
  const tier = r.tier as NumerologyTier;
  const profile = numerologyProfile({ ...input });
  const facts = numerologyFacts(profile);
  const ai = await getConfig("ai");
  const writeIds = TIER_SECTIONS[tier].filter((id) => id !== "core" && id !== "loshu"); // exact tables stay rule-generated
  const specs = NUMEROLOGY_SECTIONS.filter((s) => writeIds.includes(s.id));
  const res = await callJson<{ sections: { id: string; body: string }[] }>(r.userId, r.id, {
    model: ai.modelFast, tier: "fast", maxTokens: ai.maxOutputTokensReport, schema: SECTIONS_SCHEMA,
    system: WRITER_RULES,
    user: `Write these sections in ${LANG_NAME[r.language] ?? "English"} for ${profile.name.split(/\s+/)[0]}. Each 60–140 words (summary 40–80).\nSECTIONS:\n${JSON.stringify(specs.map(({ id, title, scope, dependsOn }) => ({ id, title, scope, dependsOn })))}\nFACTS (computed exactly, ${facts.method} method):\n${JSON.stringify(facts)}`,
  });
  const allowed = allowedNumbers(facts);
  [profile.targetYear + 1, profile.targetYear + 2].forEach((y) => allowed.add(y));
  const write: Record<string, string> = {};
  for (const s of res?.data.sections ?? []) {
    if (!writeIds.includes(s.id)) continue;
    if (numbersOutsideFacts(s.body, allowed).length) continue; // invented a number → use the rule text
    write[s.id] = s.body;
  }
  const doc = buildNumerologyReport({ ...input, tier, targetYear: profile.targetYear }, write);
  return { result: { kind: "numerology", report: doc, profile: { method: profile.method, lifePath: profile.lifePath.value, expression: profile.expression.value, soulUrge: profile.soulUrge.value, personality: profile.personality.value, birthday: profile.birthday.value, personalYear: profile.personalYear, targetYear: profile.targetYear, loShu: profile.loShu } }, generator: Object.keys(write).length ? res!.generator : "rules" };
}

// ───────────────────────── Tarot ─────────────────────────

const ORIENT = (rev: boolean) => (rev ? "reversed" : "upright");
const FORBIDDEN_CARD_NAMES = DECK.map((c) => c.name).filter((n) => n.startsWith("The ") || n.includes(" of "));

export function mentionsUndrawnCard(text: string, drawn: string[]) {
  return FORBIDDEN_CARD_NAMES.filter((n) => !drawn.includes(n)).find((n) => text.includes(n)) ?? null;
}

function tarotRules(cards: DrawnCard[], spread: SpreadId, input: TarotInput) {
  const pos = SPREADS[spread].positions;
  const out: Record<string, string> = {};
  for (const c of cards) {
    const card = CARD[c.cardId], p = pos.find((x) => x.id === c.position)!;
    out[c.position] = `In the **${p.label}** position — ${p.meaning} — you drew **${card.name}${c.reversed ? ", reversed" : ""}**. Traditionally this speaks of ${c.reversed ? card.reversed : card.upright}.${card.suit === "major" ? " As a Major Arcana card, it points to a significant theme rather than a passing mood." : ` Its suit relates to ${suitTheme(card.suit)}.`}`;
  }
  const majors = cards.filter((c) => CARD[c.cardId].suit === "major").length;
  const rev = cards.filter((c) => c.reversed).length;
  const suits = cards.map((c) => CARD[c.cardId].suit).filter((s) => s !== "major");
  const dom = suits.sort((a, b) => suits.filter((x) => x === b).length - suits.filter((x) => x === a).length)[0];
  out.overview = `You asked${input.question ? `: “${input.question}”` : ` for ${TAROT_CATEGORY_LABEL[input.category].toLowerCase()}`}. You chose ${cards.length === 1 ? "one card" : `${cards.length} cards`} for the ${SPREADS[spread].name} spread.`;
  if (cards.length > 1) out.synthesis = [majors >= Math.ceil(cards.length / 2) ? "Several Major Arcana cards suggest this is a meaningful chapter rather than a passing situation." : "Mostly Minor Arcana cards suggest everyday choices shape this more than fate does.", dom ? `The ${dom} suit is strongest, pointing to ${suitTheme(dom)}.` : "", rev > cards.length / 2 ? "Many reversed cards can indicate blocked or internalised energy that needs attention first." : ""].filter(Boolean).join(" ");
  const g = cards.find((c) => c.position === "guidance") ?? cards[cards.length - 1];
  out.guidance = g.reversed
    ? `${CARD[g.cardId].name}, reversed, asks you to notice where ${CARD[g.cardId].reversed.split(",")[0]} may be holding you back. Name one place it shows up this week, and one small step that does the opposite.`
    : `${CARD[g.cardId].name} invites you to lean into ${CARD[g.cardId].upright.split(",")[0]}. Pick one small action this week that reflects it.`;
  return out;
}

async function generateTarot(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string; draw: unknown }) {
  const input = readInput<TarotInput>(r);
  const spread = r.tier as SpreadId;
  const cards = (r.draw as { picks: DrawnCard[] | null }).picks;
  if (!cards?.length) throw new UserFacingError("Please choose your cards first.");
  const pos = SPREADS[spread].positions;
  const facts = cards.map((c) => { const card = CARD[c.cardId], p = pos.find((x) => x.id === c.position)!; return { positionId: p.id, position: p.label, positionMeaning: p.meaning, card: card.name, orientation: ORIENT(c.reversed), traditionalMeaning: c.reversed ? card.reversed : card.upright, arcana: card.suit === "major" ? "Major" : `Minor (${card.suit}, ${card.element})` }; });
  const ids = ["overview", ...pos.map((p) => p.id), ...(cards.length > 1 ? ["synthesis"] : []), "guidance"];
  const ai = await getConfig("ai");
  const res = await callJson<{ sections: { id: string; body: string }[] }>(r.userId, r.id, {
    model: spread === "celtic" || spread === "five" ? ai.modelDeep : ai.modelFast, tier: spread === "celtic" ? "deep" : "fast", maxTokens: ai.maxOutputTokensReport, schema: SECTIONS_SCHEMA,
    system: WRITER_RULES + "\n- Interpret ONLY the cards listed, in their stated orientation and position. Mention each card by its exact name in its own section.",
    user: `Language: ${LANG_NAME[r.language] ?? "English"}. Topic: ${TAROT_CATEGORY_LABEL[input.category]}. Question: ${input.question || "(none — general guidance for this topic)"}.\nSpread: ${SPREADS[spread].name}.\nWrite sections with ids ${JSON.stringify(ids)}:\n- overview: 1–2 sentences framing the question (no card meanings).\n- one section per position id: 60–110 words relating that card in that position to the question.\n${cards.length > 1 ? "- synthesis: how the cards connect, 60–120 words, no re-listing of each card.\n" : ""}- guidance: practical reflection, 40–80 words.\nCARDS DRAWN:\n${JSON.stringify(facts)}`,
  });
  const rule = tarotRules(cards, spread, input);
  const drawnNames = cards.map((c) => CARD[c.cardId].name);
  const body: Record<string, string> = { ...rule };
  for (const s of res?.data.sections ?? []) {
    if (!ids.includes(s.id) || mentionsUndrawnCard(s.body, drawnNames)) continue;
    const c = cards.find((x) => x.position === s.id);
    if (c && !s.body.includes(CARD[c.cardId].name)) continue; // must interpret the actual card
    body[s.id] = s.body;
  }
  const sections: ReportSection[] = [
    { id: "overview", title: "Your Question", body: body.overview },
    ...cards.map((c) => { const p = pos.find((x) => x.id === c.position)!; return { id: c.position, title: `${p.label} — ${CARD[c.cardId].name}${c.reversed ? " (reversed)" : ""}`, body: body[c.position] }; }),
    ...(cards.length > 1 ? [{ id: "synthesis", title: "What the Cards Say Together", body: body.synthesis }] : []),
    { id: "guidance", title: "Practical Reflection", body: body.guidance },
  ];
  const doc = dedupeReport({ title: r.tier === "single" ? "Single Card Reading" : SPREADS[spread].name, subtitle: TAROT_CATEGORY_LABEL[input.category], sections, disclaimer: READING_DISCLAIMER.tarot, method: ["78-card deck (Rider–Waite–Smith tradition), upright and reversed meanings.", "The deck was shuffled server-side with a cryptographically secure random number generator; you chose the cards face-down."] });
  const usedAi = res && sections.some((s) => s.body !== rule[s.id]);
  return { result: { kind: "tarot", report: doc, cards: cards.map((c) => ({ ...c, name: CARD[c.cardId].name })) }, generator: usedAi ? res!.generator : "rules" };
}

// ───────────────────────── Palmistry ─────────────────────────

const PALM_TIER: Record<string, { id: string; title: string; scope: string }[]> = {
  basic: [
    { id: "overview", title: "Palm Overview", scope: "Palm shape and the overall character of the visible major lines." },
    { id: "personality", title: "Personality", scope: "Temperament traditionally associated with the observed shape, head and heart lines." },
    { id: "summary", title: "Summary", scope: "3–4 sentences tying the reading together, one practical suggestion." },
  ],
};
PALM_TIER.detailed = [...PALM_TIER.basic.slice(0, 2),
  { id: "career", title: "Career", scope: "Work style traditionally read from head line, fate/sun lines (only if visible) and mounts observed." },
  { id: "relationships", title: "Relationships", scope: "Emotional style read from heart line and Venus mount (only if observed)." },
  { id: "strengths", title: "Strengths", scope: "Strengths suggested by the observed features, without re-describing them." },
  PALM_TIER.basic[2]];
PALM_TIER.complete = [...PALM_TIER.detailed.slice(0, 5),
  { id: "development", title: "Personal Development", scope: "Growth areas and, if both hands were provided, how the non-dominant (inherited) and dominant (developed) hands differ." },
  PALM_TIER.basic[2]];

const LINE_IDS = ["life", "head", "heart", "fate", "sun", "mercury"] as const;
const PALM_SCHEMA = {
  type: "object", additionalProperties: false, required: ["usable", "retake", "hands", "sections"],
  properties: {
    usable: { type: "boolean" },
    retake: { type: "array", items: { type: "string" } },
    hands: { type: "array", items: { type: "object", additionalProperties: false, required: ["side", "isPalm", "palmShape", "lines", "mounts"], properties: {
      side: { type: "string", enum: ["left", "right"] },
      isPalm: { type: "boolean" },
      palmShape: { type: "object", additionalProperties: false, required: ["type", "basis"], properties: { type: { type: "string", enum: ["earth", "air", "fire", "water", "unclear"] }, basis: { type: "string" } } },
      lines: { type: "array", items: { type: "object", additionalProperties: false, required: ["line", "visibility", "observation"], properties: { line: { type: "string", enum: [...LINE_IDS] }, visibility: { type: "string", enum: ["clear", "faint", "not_visible"] }, observation: { type: "string" } } } },
      mounts: { type: "array", items: { type: "object", additionalProperties: false, required: ["mount", "observation"], properties: { mount: { type: "string" }, observation: { type: "string" } } } },
    } } },
    sections: SECTIONS_SCHEMA.properties.sections,
  },
};

interface PalmAnalysis { usable: boolean; retake: string[]; hands: { side: "left" | "right"; isPalm: boolean; palmShape: { type: string; basis: string }; lines: { line: string; visibility: string; observation: string }[]; mounts: { mount: string; observation: string }[] }[]; sections: { id: string; body: string }[] }

export class UserFacingError extends Error {}

async function generatePalmistry(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string }) {
  const input = readInput<PalmistryInput>(r);
  const images = await db.palmImage.findMany({ where: { readingId: r.id }, orderBy: { side: "asc" } });
  const need = input.hands === "both" ? ["left", "right"] : [input.hands];
  if (need.some((s) => !images.find((i) => i.side === s))) throw new UserFacingError("Please upload your palm photo(s) first.");
  if (!llm()) throw new UserFacingError("Palm analysis is temporarily unavailable. Please try again later.");
  if (!(await hasConsent(r.userId, "ai_processing"))) throw new UserFacingError("Palm readings need your permission for AI photo analysis. Please allow it and try again.");
  const sections = PALM_TIER[r.tier] ?? PALM_TIER.basic;
  const ai = await getConfig("ai");
  const used = images.filter((i) => need.includes(i.side));
  const res = await callJson<PalmAnalysis>(r.userId, r.id, {
    model: ai.modelVision, tier: "deep", effort: "high", maxTokens: 12000, schema: PALM_SCHEMA,
    images: used.map((i) => ({ mediaType: "image/jpeg" as const, data: decryptJson<string>(i.data) })),
    system: `${WRITER_RULES}
You are also a careful palm-photo analyst. Work in two strictly separate steps:
1. OBSERVE: for each image (in the order given: ${used.map((i) => i.side).join(", ")}), report only what is actually visible. If the image is not a human palm, is blurry, too dark, cropped, or lines cannot be traced, set usable=false and list concrete retake tips. Mark any line you cannot clearly trace as "not_visible" — never guess or invent a line, break, fork, star or mark. Palm shape is "unclear" if fingers/palm proportions are not visible. Mention only mounts you can actually judge.
2. INTERPRET: only if usable=true, write the requested sections from the observations using traditional palmistry meanings. Never interpret a line marked not_visible. Never mention lifespan, health or death from the life line.`,
    user: `Language for observations and sections: ${LANG_NAME[r.language] ?? "English"}. Dominant hand: ${input.dominant}. Hands provided: ${used.map((i) => i.side).join(" and ")}.\nSections to write (ids, titles, scope; 60–130 words each, summary 40–80):\n${JSON.stringify(sections)}`,
  });
  if (!res) throw new UserFacingError("Palm analysis is temporarily unavailable. Please try again in a few minutes.");
  const a = res.data;
  const anyPalm = a.hands.some((h) => h.isPalm);
  const traceable = a.hands.flatMap((h) => h.lines).filter((l) => l.visibility !== "not_visible").length;
  if (!a.usable || !anyPalm || traceable < 2) {
    return { needsPhoto: true, result: { kind: "palmistry", retake: a.retake.length ? a.retake : ["We couldn't trace your palm lines clearly. Retake the photo in daylight, palm flat and filling the frame, fingers together and slightly spread, camera directly above."] }, generator: res.generator };
  }
  const notVisible = new Set(a.hands.flatMap((h) => h.lines.filter((l) => l.visibility === "not_visible").map((l) => l.line)));
  const visibleAnywhere = new Set(a.hands.flatMap((h) => h.lines.filter((l) => l.visibility !== "not_visible").map((l) => l.line)));
  const observations = a.hands.map((h) => {
    const lines = LINE_IDS.map((id) => h.lines.find((l) => l.line === id) ?? { line: id, visibility: "not_visible", observation: "" });
    return `**${h.side === "left" ? "Left" : "Right"} hand${h.side === input.dominant ? " (dominant)" : ""}** — palm shape: ${h.palmShape.type}${h.palmShape.type !== "unclear" ? ` (${h.palmShape.basis})` : ""}.\n\n${lines.map((l) => `- **${l.line[0].toUpperCase()}${l.line.slice(1)} line:** ${l.visibility === "not_visible" ? "not clearly visible in this photo" : `${l.visibility} — ${l.observation}`}`).join("\n")}${h.mounts.length ? `\n- **Mounts:** ${h.mounts.map((m) => `${m.mount} — ${m.observation}`).join("; ")}` : ""}`;
  }).join("\n\n");
  const ids = sections.map((s) => s.id);
  const body: ReportSection[] = [
    { id: "observations", title: "What We Can See (observations)", body: observations },
    ...sections.map((s) => ({ id: s.id, title: s.title, body: a.sections.find((x) => x.id === s.id)?.body ?? "" })).filter((s) => s.body && ids.includes(s.id)),
  ];
  // A section that leans on a line that isn't visible anywhere is dropped rather than shown.
  const cleaned = body.filter((s) => s.id === "observations" || ![...notVisible].filter((l) => !visibleAnywhere.has(l)).some((l) => new RegExp(`\\b${l} line\\b`, "i").test(s.body) && !/not (clearly )?visible|couldn.t|can.t see|unclear/i.test(s.body)));
  const doc = dedupeReport({ title: "Palm Reading", subtitle: `${r.tier[0].toUpperCase()}${r.tier.slice(1)} · dominant hand: ${input.dominant}`, sections: cleaned, disclaimer: READING_DISCLAIMER.palmistry, method: ["Observations describe only what is visible in your photos. Lines that could not be traced are marked as not visible and are not interpreted.", "Interpretations follow traditional (Western/Indian Hasta Samudrika) palmistry meanings."] });
  return { needsPhoto: false, result: { kind: "palmistry", report: doc, hands: a.hands }, generator: res.generator };
}

// ───────────────────────── Orchestration ─────────────────────────

/**
 * Generate (or retry) a paid reading. Exactly one generation runs at a time per reading (conditional
 * status claim). Failures are recorded and can be retried without paying again.
 */
export async function generateReading(readingId: string, userId: string): Promise<{ ok: boolean; status: string; error?: string }> {
  const ai = await getConfig("ai");
  const since = new Date(Date.now() - 86400000);
  const today = await db.usageLedger.count({ where: { userId, kind: "reading_generation", createdAt: { gte: since } } });
  if (today >= ai.readingGenerationsPerDay) return { ok: false, status: "LIMIT", error: "You've reached today's limit for generating readings. Please try again tomorrow." };
  const claim = await db.serviceReading.updateMany({
    where: { id: readingId, userId, OR: [{ status: { in: ["PAID", "FAILED", "NEEDS_PHOTO"] } }, { status: "GENERATING", updatedAt: { lt: new Date(Date.now() - 5 * 60000) } }] },
    data: { status: "GENERATING", attempts: { increment: 1 }, error: null },
  });
  if (claim.count !== 1) {
    const cur = await db.serviceReading.findFirst({ where: { id: readingId, userId }, select: { status: true } });
    return { ok: cur?.status === "READY", status: cur?.status ?? "NOT_FOUND" };
  }
  await db.usageLedger.create({ data: { userId, kind: "reading_generation", delta: 0, refId: readingId } });
  const r = (await db.serviceReading.findUnique({ where: { id: readingId } }))!;
  try {
    let out: { result: unknown; generator: string; needsPhoto?: boolean };
    if (r.category === "numerology") out = await generateNumerology(r);
    else if (r.category === "tarot") out = await generateTarot(r);
    else out = await generatePalmistry(r);
    const status = out.needsPhoto ? "NEEDS_PHOTO" : "READY";
    await db.serviceReading.update({ where: { id: r.id }, data: { status, result: out.result as never, generator: out.generator, generatedAt: status === "READY" ? new Date() : null } });
    await audit(status === "READY" ? "reading.generated" : "reading.needs_photo", { userId, target: r.id, meta: { generator: out.generator } });
    return { ok: status === "READY", status };
  } catch (e) {
    const msg = e instanceof UserFacingError ? e.message : "We couldn't finish this reading. Please try again — you won't be charged again.";
    if (!(e instanceof UserFacingError)) logError("reading-generate", e, userId);
    // Tarot without picks / palm without photos goes back to PAID so the user can continue.
    const back = e instanceof UserFacingError && /choose your cards|upload your palm/.test(e.message) ? "PAID" : "FAILED";
    await db.serviceReading.update({ where: { id: r.id }, data: { status: back, error: msg } });
    if (back === "FAILED") await audit("reading.failed", { userId, target: r.id, level: "warn", meta: { error: e instanceof Error ? e.message.slice(0, 200) : "unknown" } });
    return { ok: false, status: back, error: msg };
  }
}

export const _test = { tarotRules, allowedNumbers };
