import "server-only";
import { db } from "../db";
import { getConfig } from "../config";
import { hasConsent } from "../consent";
import { decryptJson } from "../crypto";
import { audit, logError } from "../audit";
import { costMicros, llm } from "../ai/providers";
import { recordTokenUsage } from "../billing/entitlements";
import { buildNumerologyReport, NUMEROLOGY_SECTIONS, numerologyFacts, ruleSection, TIER_SECTIONS, type NumerologyTier } from "@/lib/readings/numerology-report";
import { numerologyProfile } from "@/lib/readings/numerology";
import { CARD, DECK, cardMeaning, positionL, spreadName, topicLabel, type DrawnCard, type SpreadId } from "@/lib/readings/tarot";
import { buildTarotReport, tarotRuleSections, tarotSectionIds } from "@/lib/readings/tarot-report";
import { dedupeReport, sharesPhrase, type ReportSection } from "@/lib/readings/report";
import { rs } from "@/lib/readings/strings";
import { invisibleEverywhere, LINE_FEATURES, LINE_IDS, MOUNT_IDS, PALM_SCOPE, PALM_TIER_IDS, palmObservations, type PalmHand } from "@/lib/readings/palm";
import { toRLang } from "@/lib/readings/lang";
import { readInput } from "./service";
import type { NumerologyInput, PalmistryInput, TarotInput } from "./inputs";

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi in Devanagari script", hinglish: "Hinglish (conversational Hindi written in Latin script)" };

const WRITER_RULES = `You write one section at a time of a personal reading for VYOMIRA. Rules:
- Use ONLY the facts provided. Never invent numbers, cards, lines or features.
- Each section has a SCOPE. Stay inside it. Do not re-introduce the person, the method or earlier sections; refer back briefly ("as your Life Path suggests") instead of restating.
- No filler intros ("In this section…"), no "In conclusion" outside the summary, no disclaimers (the app adds one at the end), no headings unless asked.
- Never repeat a sentence or phrase you have used in another section; each section must add something new.
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

/** Accept AI sections only if they add something new: no invented numbers, no phrase shared with earlier text. */
function acceptSections(order: string[], ai: Record<string, string>, rule: Record<string, string>, ok: (id: string, body: string) => boolean) {
  const accepted: Record<string, string> = {};
  const earlier: string[] = [];
  for (const id of order) {
    const body = ai[id]?.trim();
    if (body && ok(id, body) && !sharesPhrase(body, earlier)) { accepted[id] = body; earlier.push(body); }
    else earlier.push(rule[id] ?? "");
  }
  return accepted;
}

async function generateNumerology(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string }) {
  const input = readInput<NumerologyInput>(r);
  const lang = toRLang(r.language);
  const tier = r.tier as NumerologyTier;
  const profile = numerologyProfile({ ...input });
  const facts = numerologyFacts(profile, lang);
  const ai = await getConfig("ai");
  const order = TIER_SECTIONS[tier];
  const writeIds = order.filter((id) => id !== "core" && id !== "loshu"); // exact tables stay rule-generated
  const specs = NUMEROLOGY_SECTIONS.filter((s) => writeIds.includes(s.id));
  const res = await callJson<{ sections: { id: string; body: string }[] }>(r.userId, r.id, {
    model: ai.modelFast, tier: "fast", maxTokens: ai.maxOutputTokensReport, schema: SECTIONS_SCHEMA,
    system: WRITER_RULES,
    user: `Write these sections in ${LANG_NAME[lang]} for ${profile.name.split(/\s+/)[0]}. Each 60–140 words (summary 40–80).\nSECTIONS:\n${JSON.stringify(specs.map(({ id, title, scope, dependsOn }) => ({ id, title, scope, dependsOn })))}\nFACTS (computed exactly, ${facts.method} method):\n${JSON.stringify(facts)}`,
  });
  const allowed = allowedNumbers(facts);
  [profile.targetYear + 1, profile.targetYear + 2].forEach((y) => allowed.add(y));
  const rule = Object.fromEntries(order.map((id) => [id, ruleSection(id, profile, tier, lang)]));
  const aiMap = Object.fromEntries((res?.data.sections ?? []).filter((s) => writeIds.includes(s.id)).map((s) => [s.id, s.body]));
  const write = acceptSections(order, aiMap, rule, (_id, body) => numbersOutsideFacts(body, allowed).length === 0);
  const doc = buildNumerologyReport({ ...input, tier, targetYear: profile.targetYear, lang }, write);
  return { result: { kind: "numerology", report: doc, profile: { method: profile.method, lifePath: profile.lifePath.value, expression: profile.expression.value, soulUrge: profile.soulUrge.value, personality: profile.personality.value, birthday: profile.birthday.value, personalYear: profile.personalYear, targetYear: profile.targetYear, loShu: profile.loShu } }, generator: Object.keys(write).length ? res!.generator : "rules" };
}

// ───────────────────────── Tarot ─────────────────────────

const FORBIDDEN_CARD_NAMES = DECK.map((c) => c.name).filter((n) => n.startsWith("The ") || n.includes(" of "));

export function mentionsUndrawnCard(text: string, drawn: string[]) {
  return FORBIDDEN_CARD_NAMES.filter((n) => !drawn.includes(n)).find((n) => text.includes(n)) ?? null;
}

async function generateTarot(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string; draw: unknown }) {
  const input = readInput<TarotInput>(r);
  const lang = toRLang(r.language);
  const spread = r.tier as SpreadId;
  const cards = (r.draw as { picks: DrawnCard[] | null }).picks;
  if (!cards?.length) throw new UserFacingError("Please choose your cards first.");
  const facts = cards.map((c) => { const card = CARD[c.cardId], p = positionL(spread, c.position, lang); return { positionId: c.position, position: p.label, positionMeaning: p.meaning, card: card.name, orientation: c.reversed ? "reversed" : "upright", traditionalMeaning: cardMeaning(c.cardId, c.reversed, lang), arcana: card.suit === "major" ? "Major" : `Minor (${card.suit}, ${card.element})` }; });
  const ids = tarotSectionIds(cards);
  const ai = await getConfig("ai");
  const res = await callJson<{ sections: { id: string; body: string }[] }>(r.userId, r.id, {
    model: spread === "celtic" || spread === "five" ? ai.modelDeep : ai.modelFast, tier: spread === "celtic" ? "deep" : "fast", maxTokens: ai.maxOutputTokensReport, schema: SECTIONS_SCHEMA,
    system: WRITER_RULES + "\n- Interpret ONLY the cards listed, in their stated orientation and position. Mention each card by its exact English name in its own section. Mention a suit's or the Major Arcana's general meaning at most once in the whole reading.",
    user: `Language: ${LANG_NAME[lang]}. Topic: ${topicLabel(input.category, lang)}. Question: ${input.question || "(none — general guidance for this topic)"}.\nSpread: ${spreadName(spread, lang)}.\nWrite sections with ids ${JSON.stringify(ids)}:\n- overview: 1–2 sentences framing the question (no card meanings).\n- one section per position id: 60–110 words relating that card in that position to the question.\n${cards.length > 1 ? "- synthesis: how the cards connect, 60–120 words, no re-listing of each card.\n" : ""}- guidance: practical reflection, 40–80 words.\nCARDS DRAWN:\n${JSON.stringify(facts)}`,
  });
  const rule = tarotRuleSections(cards, spread, input, lang);
  const drawnNames = cards.map((c) => CARD[c.cardId].name);
  const aiMap = Object.fromEntries((res?.data.sections ?? []).filter((s) => ids.includes(s.id)).map((s) => [s.id, s.body]));
  const write = acceptSections(ids, aiMap, rule, (id, body) => {
    if (mentionsUndrawnCard(body, drawnNames)) return false;
    const c = cards.find((x) => x.position === id);
    return !c || body.includes(CARD[c.cardId].name); // must interpret the actual card
  });
  const doc = buildTarotReport(cards, spread, input, lang, write);
  return { result: { kind: "tarot", report: doc, cards: cards.map((c) => ({ ...c, name: CARD[c.cardId].name })) }, generator: Object.keys(write).length ? res!.generator : "rules" };
}

// ───────────────────────── Palmistry ─────────────────────────

const PALM_SCHEMA = {
  type: "object", additionalProperties: false, required: ["usable", "retake", "hands", "sections"],
  properties: {
    usable: { type: "boolean" },
    retake: { type: "array", items: { type: "string" } },
    hands: { type: "array", items: { type: "object", additionalProperties: false, required: ["side", "isPalm", "palmShape", "lines", "mounts"], properties: {
      side: { type: "string", enum: ["left", "right"] },
      isPalm: { type: "boolean" },
      palmShape: { type: "object", additionalProperties: false, required: ["type", "basis"], properties: { type: { type: "string", enum: ["earth", "air", "fire", "water", "unclear"] }, basis: { type: "string" } } },
      lines: { type: "array", items: { type: "object", additionalProperties: false, required: ["line", "visibility", "length", "shape", "features", "observation"], properties: {
        line: { type: "string", enum: [...LINE_IDS] }, visibility: { type: "string", enum: ["clear", "faint", "not_visible"] },
        length: { type: "string", enum: ["short", "medium", "long", "unclear"] }, shape: { type: "string", enum: ["straight", "curved", "wavy", "unclear"] },
        features: { type: "array", items: { type: "string", enum: [...LINE_FEATURES] } }, observation: { type: "string" } } } },
      mounts: { type: "array", items: { type: "object", additionalProperties: false, required: ["mount", "prominence", "observation"], properties: { mount: { type: "string", enum: [...MOUNT_IDS] }, prominence: { type: "string", enum: ["prominent", "average", "flat", "unclear"] }, observation: { type: "string" } } } },
    } } },
    sections: SECTIONS_SCHEMA.properties.sections,
  },
};

interface PalmAnalysis { usable: boolean; retake: string[]; hands: PalmHand[]; sections: { id: string; body: string }[] }

export class UserFacingError extends Error {}

async function generatePalmistry(r: { id: string; userId: string; tier: string; language: string; encryptedInput: string }) {
  const input = readInput<PalmistryInput>(r);
  const lang = toRLang(r.language);
  const S = rs(lang);
  const images = await db.palmImage.findMany({ where: { readingId: r.id }, orderBy: { side: "asc" } });
  const need = input.hands === "both" ? ["left", "right"] : [input.hands];
  if (need.some((s) => !images.find((i) => i.side === s))) throw new UserFacingError("Please upload your palm photo(s) first.");
  if (!llm()) throw new UserFacingError("Palm analysis is temporarily unavailable. Please try again later.");
  if (!(await hasConsent(r.userId, "ai_processing"))) throw new UserFacingError("Palm readings need your permission for AI photo analysis. Please allow it and try again.");
  const ids = PALM_TIER_IDS[r.tier] ?? PALM_TIER_IDS.basic;
  const ai = await getConfig("ai");
  const used = images.filter((i) => need.includes(i.side));
  const res = await callJson<PalmAnalysis>(r.userId, r.id, {
    model: ai.modelVision, tier: "deep", effort: "high", maxTokens: 12000, schema: PALM_SCHEMA,
    images: used.map((i) => ({ mediaType: "image/jpeg" as const, data: decryptJson<string>(i.data) })),
    system: `${WRITER_RULES}
You are also a careful palm-photo analyst. Work in two strictly separate steps:
1. OBSERVE: for each image (in the order given: ${used.map((i) => i.side).join(", ")}), report only what is actually visible. If the image is not a human palm, is blurry, too dark, cropped, or lines cannot be traced, set usable=false and list concrete retake tips. For every one of the six lines give visibility, length and shape; mark any line you cannot clearly trace as "not_visible" with length and shape "unclear" — never guess. List a feature (fork, break, chain, island, branch, star, cross, joined_life_line) ONLY if it is unmistakably visible. Give all eight mounts a prominence; use "unclear" when the photo doesn't show it. Palm shape is "unclear" if finger and palm proportions are not visible.
2. INTERPRET: only if usable=true, write the requested sections from the observations using traditional palmistry meanings. Never interpret a line marked not_visible. Never mention lifespan, health, illness or death from any line. Each section must cover only its scope and add something new.`,
    user: `Language for observation notes and sections: ${LANG_NAME[lang]}. Dominant hand: ${input.dominant}. Hands provided: ${used.map((i) => i.side).join(" and ")}.\nSections to write (60–130 words each, summary 40–80):\n${JSON.stringify(ids.map((id) => ({ id, title: S.palmSections[id as keyof typeof S.palmSections], scope: PALM_SCOPE[id] })))}`,
  });
  if (!res) throw new UserFacingError("Palm analysis is temporarily unavailable. Please try again in a few minutes.");
  const a = res.data;
  const anyPalm = a.hands.some((h) => h.isPalm);
  const traceable = a.hands.flatMap((h) => h.lines).filter((l) => l.visibility !== "not_visible").length;
  if (!a.usable || !anyPalm || traceable < 2) {
    return { needsPhoto: true, result: { kind: "palmistry", retake: a.retake.length ? a.retake : ["We couldn't trace your palm lines clearly. Retake the photo in daylight, palm flat and filling the frame, fingers together and slightly spread, camera directly above."] }, generator: res.generator };
  }
  const hidden = invisibleEverywhere(a.hands);
  const lineWords: Record<string, RegExp> = { life: /life line|जीवन रेखा|jeevan rekha/i, head: /head line|मस्तिष्क रेखा|mastishk rekha/i, heart: /heart line|हृदय रेखा|hriday rekha/i, fate: /fate line|भाग्य रेखा|bhagya rekha/i, sun: /sun line|सूर्य रेखा|surya rekha/i, mercury: /mercury line|बुध रेखा|budh rekha/i };
  const negation = /not (clearly )?visible|couldn.t|can.t see|unclear|स्पष्ट नहीं|नहीं दिख|saaf nahi|nahi dikh/i;
  const earlier: string[] = [];
  const sections: ReportSection[] = [{ id: "observations", title: S.palmSections.observations, body: palmObservations(a.hands, input.dominant, lang) }];
  for (const id of ids) {
    const body = a.sections.find((x) => x.id === id)?.body?.trim();
    if (!body) continue;
    // Drop a section that interprets a line that isn't visible anywhere, or that repeats earlier text.
    if (hidden.some((l) => lineWords[l].test(body) && !negation.test(body))) continue;
    if (sharesPhrase(body, earlier)) continue;
    earlier.push(body);
    sections.push({ id, title: S.palmSections[id as keyof typeof S.palmSections], body });
  }
  const doc = dedupeReport({ title: S.palmTitle, subtitle: `${S.tier[r.tier] ?? r.tier} · ${S.dominant}: ${input.dominant === "left" ? S.left : S.right}`, sections, disclaimer: S.disclaimer.palmistry, method: S.palmMethod });
  return { needsPhoto: false, result: { kind: "palmistry", report: doc, hands: a.hands, dominant: input.dominant }, generator: res.generator };
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

export const _test = { allowedNumbers };
