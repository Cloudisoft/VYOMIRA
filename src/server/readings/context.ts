import "server-only";
import { db } from "../db";
import { loadChart } from "../charts";
import { lifeGuideFor } from "../life-guide";
import { toLang } from "@/lib/interpret/life-guide-i18n";
import { numerologyProfile } from "@/lib/readings/numerology";
import { meaning, PERSONAL_YEAR } from "@/lib/readings/numerology-meanings";
import { CARD, SPREADS, TAROT_CATEGORY_LABEL, type SpreadId, type TarotCategory } from "@/lib/readings/tarot";
import type { ReportDoc } from "@/lib/readings/report";
import { readInput } from "./service";
import type { TarotInput } from "./inputs";

/**
 * Centralised user-context service. Collects ONLY facts that exist for this user — the computed
 * chart / Life Guide, numerology numbers, tarot cards actually drawn and palm observations actually
 * made. Nothing is inferred or invented here; missing systems are simply absent.
 */
export type System = "astrology" | "numerology" | "tarot" | "palmistry";

export interface UserContext {
  astrology?: { headline: string; chapter: string; areas: Record<string, { label: string; rating: string; text: string; tip: string }> };
  numerology?: { source: "reading" | "birth details"; method: string; lifePath: number; expression: number; soulUrge: number; personality: number; personalYear: number; year: number; meanings: { lifePath: string; expression: string; soulUrge: string }; career: string; love: string; strengths: string; challenges: string; yearTheme: string };
  tarot?: { readingId: string; date: string; topic: TarotCategory; question: string; spread: string; cards: { position: string; card: string; orientation: string; meaning: string }[] }[];
  palmistry?: { date: string; observations: string[]; sections: Record<string, string> };
}

const sectionText = (doc: ReportDoc | undefined, id: string) => doc?.sections.find((s) => s.id === id)?.body ?? "";

export async function userContext(userId: string, want: System[] = ["astrology", "numerology", "tarot", "palmistry"], lang = "en"): Promise<UserContext> {
  const ctx: UserContext = {};
  const loaded = want.includes("astrology") || want.includes("numerology") ? await loadChart(userId) : null;

  if (want.includes("astrology") && loaded) {
    const g = await lifeGuideFor(loaded.chartId, loaded.chart, loaded.fullName, toLang(lang));
    if (g) ctx.astrology = { headline: g.headline, chapter: `${g.present.chapter.title}`, areas: Object.fromEntries(g.areas.map((a) => [a.key, { label: a.label, rating: a.rating, text: a.text, tip: a.tip }])) };
  }

  const ready = await db.serviceReading.findMany({ where: { userId, status: "READY", category: { in: want.filter((w) => w !== "astrology") } }, orderBy: { generatedAt: "desc" }, take: 20 });

  if (want.includes("numerology")) {
    const nr = ready.find((r) => r.category === "numerology");
    let p: ReturnType<typeof numerologyProfile> | null = null;
    let source: "reading" | "birth details" = "reading";
    if (nr) { const i = readInput<{ name: string; dob: string; method: "pythagorean" | "chaldean" }>(nr); p = numerologyProfile({ ...i }); }
    else if (loaded?.birth.date) { try { p = numerologyProfile({ name: loaded.fullName, dob: loaded.birth.date.slice(0, 10) }); source = "birth details"; } catch { p = null; } }
    if (p) {
      const lp = meaning(p.lifePath.value), ex = meaning(p.expression.value), su = meaning(p.soulUrge.value);
      ctx.numerology = { source, method: p.method, lifePath: p.lifePath.value, expression: p.expression.value, soulUrge: p.soulUrge.value, personality: p.personality.value, personalYear: p.personalYear, year: p.targetYear, meanings: { lifePath: `${lp.keyword}: ${lp.essence}`, expression: `${ex.keyword}: ${ex.essence}`, soulUrge: `${su.keyword}: ${su.essence}` }, career: ex.career, love: su.love, strengths: lp.strength, challenges: lp.challenge, yearTheme: PERSONAL_YEAR[p.personalYear] };
    }
  }

  if (want.includes("tarot")) {
    const tr = ready.filter((r) => r.category === "tarot").slice(0, 5);
    if (tr.length) ctx.tarot = tr.map((r) => {
      const i = readInput<TarotInput>(r);
      const picks = (r.draw as { picks: { position: string; cardId: string; reversed: boolean }[] }).picks ?? [];
      const pos = SPREADS[r.tier as SpreadId].positions;
      return { readingId: r.id, date: (r.generatedAt ?? r.createdAt).toISOString().slice(0, 10), topic: i.category, question: i.question, spread: SPREADS[r.tier as SpreadId].name, cards: picks.map((c) => ({ position: pos.find((p) => p.id === c.position)?.label ?? c.position, card: CARD[c.cardId].name, orientation: c.reversed ? "reversed" : "upright", meaning: c.reversed ? CARD[c.cardId].reversed : CARD[c.cardId].upright })) };
    });
  }

  if (want.includes("palmistry")) {
    const pr = ready.find((r) => r.category === "palmistry");
    const res = pr?.result as { report?: ReportDoc; hands?: { side: string; lines: { line: string; visibility: string; observation: string }[]; palmShape: { type: string } }[] } | null;
    if (pr && res?.report) ctx.palmistry = {
      date: (pr.generatedAt ?? pr.createdAt).toISOString().slice(0, 10),
      observations: (res.hands ?? []).flatMap((h) => [`${h.side} hand palm shape: ${h.palmShape.type}`, ...h.lines.map((l) => `${h.side} ${l.line} line: ${l.visibility === "not_visible" ? "not visible (not interpreted)" : `${l.visibility} — ${l.observation}`}`)]),
      sections: Object.fromEntries(["overview", "personality", "career", "relationships", "strengths", "development", "summary"].map((id) => [id, sectionText(res.report, id)]).filter(([, t]) => t)),
    };
  }
  return ctx;
}

export interface InsightPoint { system: System; text: string; note?: string }
export const INSIGHT_AREAS = [
  { id: "career", title: "Career Insight" },
  { id: "relationship", title: "Relationship Insight" },
  { id: "growth", title: "Growth Insight" },
  { id: "financial", title: "Financial Insight" },
  { id: "general", title: "General Insight" },
] as const;

const firstSentences = (s: string, n = 2) => (s.replace(/\*\*/g, "").match(/[^.!?।]+[.!?।]+/g) ?? [s]).slice(0, n).join(" ").trim();

/** Combined Insights: each point is labelled by the system it came from. Tarot stays a separate, question-specific input. */
export function combinedInsights(c: UserContext) {
  const out: Record<string, InsightPoint[]> = {};
  const add = (area: string, p: InsightPoint | null) => { if (p && p.text) (out[area] ??= []).push(p); };
  const astro = (k: string) => (c.astrology?.areas[k] ? { system: "astrology" as const, text: `${c.astrology.areas[k].label}: ${firstSentences(c.astrology.areas[k].text)} ${c.astrology.areas[k].tip ? `Tip: ${c.astrology.areas[k].tip}` : ""}`.trim() } : null);
  const palm = (k: string) => (c.palmistry?.sections[k] ? { system: "palmistry" as const, text: firstSentences(c.palmistry.sections[k], 2) } : null);
  const tarot = (topics: TarotCategory[]) => {
    const t = c.tarot?.find((x) => topics.includes(x.topic));
    return t ? { system: "tarot" as const, text: `Your ${t.spread.toLowerCase()} on ${TAROT_CATEGORY_LABEL[t.topic].toLowerCase()} (${t.date}) drew ${t.cards.map((x) => `${x.card}${x.orientation === "reversed" ? " reversed" : ""} (${x.position})`).join(", ")}.`, note: "Tarot reflects the question you asked at that time, not a fixed trait." } : null;
  };
  const n = c.numerology;
  add("career", astro("career")); add("career", astro("business"));
  add("career", n ? { system: "numerology", text: `Expression ${n.expression}: ${n.career}` } : null);
  add("career", palm("career")); add("career", tarot(["career"]));
  add("relationship", astro("love")); add("relationship", astro("family"));
  add("relationship", n ? { system: "numerology", text: `Soul Urge ${n.soulUrge}: ${n.love}` } : null);
  add("relationship", palm("relationships")); add("relationship", tarot(["love"]));
  add("growth", astro("learning"));
  add("growth", n ? { system: "numerology", text: `Life Path ${n.lifePath} strengths — ${n.strengths}; growth edge — ${n.challenges}.` } : null);
  add("growth", palm("development") ?? palm("strengths")); add("growth", tarot(["growth"]));
  add("financial", astro("money")); add("financial", astro("fortune"));
  add("financial", n ? { system: "numerology", text: `Personal Year ${n.personalYear} (${n.year}): ${n.yearTheme}.` } : null);
  add("financial", tarot(["finance"]));
  add("general", c.astrology ? { system: "astrology", text: firstSentences(c.astrology.headline, 2) } : null);
  add("general", n ? { system: "numerology", text: `Life Path ${n.lifePath} — ${n.meanings.lifePath}.` } : null);
  add("general", palm("summary") ?? palm("overview")); add("general", tarot(["general"]));
  return INSIGHT_AREAS.map((a) => ({ ...a, points: out[a.id] ?? [], systems: [...new Set((out[a.id] ?? []).map((p) => p.system))] }));
}
