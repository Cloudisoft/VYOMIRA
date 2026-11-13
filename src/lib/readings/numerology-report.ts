import { numerologyProfile, personalYear, parseDob, type NumerologyProfile } from "./numerology";
import { LO_SHU_ARROW, LO_SHU_MISSING, PERSONAL_YEAR, meaning } from "./numerology-meanings";
import { dedupeReport, READING_DISCLAIMER, type ReportDoc, type SectionSpec } from "./report";

export type NumerologyTier = "basic" | "detailed" | "complete";

export const NUMEROLOGY_SECTIONS: SectionSpec[] = [
  { id: "overview", title: "Numerology Overview", scope: "Who this report is for, the method used, and the single central theme from the Life Path. No number-by-number detail.", requires: ["lifePath", "method"] },
  { id: "core", title: "Your Core Numbers", scope: "A compact table-like list of each core number with its keyword and how it was calculated. No life-area advice.", requires: ["lifePath", "expression", "soulUrge", "personality", "birthday"], dependsOn: ["overview"] },
  { id: "personality", title: "Personality", scope: "Inner motivation (Soul Urge) versus outward impression (Personality number) and the Birthday gift. Do not repeat career or love advice.", requires: ["soulUrge", "personality", "birthday"], dependsOn: ["core"] },
  { id: "career", title: "Career & Work", scope: "Work style and suitable directions from Expression and Life Path only.", requires: ["expression", "lifePath"], dependsOn: ["core"] },
  { id: "relationships", title: "Relationships", scope: "Needs and patterns in close relationships from Soul Urge and Life Path only.", requires: ["soulUrge", "lifePath"], dependsOn: ["personality"] },
  { id: "strengths", title: "Strengths & Challenges", scope: "Concrete strengths and growth edges across the core numbers, without re-describing them.", requires: ["lifePath", "expression", "soulUrge"], dependsOn: ["core"] },
  { id: "year", title: "Your Personal Year", scope: "The theme of the current Personal Year and practical focus for it.", requires: ["personalYear"] },
  { id: "loshu", title: "Lo Shu Grid", scope: "The grid from the date of birth: present, missing and repeated numbers and complete planes.", requires: ["loShu"] },
  { id: "summary", title: "Final Summary", scope: "Three to five lines tying the reading together and one practical next step. No new information, no disclaimer.", requires: ["lifePath", "personalYear"], dependsOn: ["overview", "career", "relationships", "year"] },
];

export const TIER_SECTIONS: Record<NumerologyTier, string[]> = {
  basic: ["overview", "core", "personality", "summary"],
  detailed: ["overview", "core", "personality", "career", "relationships", "strengths", "year", "summary"],
  complete: ["overview", "core", "personality", "career", "relationships", "strengths", "year", "loshu", "summary"],
};

const n = (x: number) => (x === 11 || x === 22 || x === 33 ? `${x}` : `${x}`);
const calc = (compound: number, value: number) => (compound !== value ? `${compound} → ${value}` : `${value}`);

/** Facts passed to the writer (AI or rules). Everything here is computed, never generated. */
export function numerologyFacts(p: NumerologyProfile) {
  return {
    method: p.method,
    lifePath: { value: p.lifePath.value, calculation: `month ${p.lifePath.parts.month} + day ${p.lifePath.parts.day} + year ${p.lifePath.parts.year} = ${calc(p.lifePath.compound, p.lifePath.value)}`, keyword: meaning(p.lifePath.value).keyword },
    expression: { value: p.expression.value, compound: p.expression.compound, keyword: meaning(p.expression.value).keyword },
    soulUrge: { value: p.soulUrge.value, compound: p.soulUrge.compound, keyword: meaning(p.soulUrge.value).keyword },
    personality: { value: p.personality.value, compound: p.personality.compound, keyword: meaning(p.personality.value).keyword },
    birthday: { day: p.birthday.day, value: p.birthday.value },
    personalYear: { year: p.targetYear, value: p.personalYear, theme: PERSONAL_YEAR[p.personalYear] },
    loShu: { grid: p.loShu.grid.map((r) => r.map((c) => `${c.n}:${c.count}`)), missing: p.loShu.missing, repeated: p.loShu.repeated, completePlanes: p.loShu.completeArrows },
    conventions: p.conventions,
  };
}

/** Rule-based section writer — always available, never invents numbers. */
function ruleSection(id: string, p: NumerologyProfile, tier: NumerologyTier): string {
  const lp = meaning(p.lifePath.value), ex = meaning(p.expression.value), su = meaning(p.soulUrge.value), pe = meaning(p.personality.value), bd = meaning(p.birthday.value);
  const first = p.name.split(/\s+/)[0];
  switch (id) {
    case "overview":
      return `${first}, your Life Path is **${n(p.lifePath.value)} — ${lp.keyword}**, the number traditionally linked with ${lp.essence}. It is the thread the rest of this reading builds on.\n\nThis reading uses the **${p.method === "pythagorean" ? "Pythagorean" : "Chaldean"}** method for your name numbers.`;
    case "core":
      return [
        `- **Life Path ${n(p.lifePath.value)}** — ${lp.keyword}. From your date of birth: ${numerologyFacts(p).lifePath.calculation}.`,
        `- **Expression (Destiny) ${n(p.expression.value)}** — ${ex.keyword}. All letters of your name: ${calc(p.expression.compound, p.expression.value)}.`,
        `- **Soul Urge ${n(p.soulUrge.value)}** — ${su.keyword}. Vowels only: ${calc(p.soulUrge.compound, p.soulUrge.value)}.`,
        `- **Personality ${n(p.personality.value)}** — ${pe.keyword}. Consonants only: ${calc(p.personality.compound, p.personality.value)}.`,
        `- **Birthday ${p.birthday.value}** — born on day ${p.birthday.day}.`,
        `- **Personal Year ${p.personalYear}** (${p.targetYear}).`,
      ].join("\n");
    case "personality":
      return `Inwardly (Soul Urge ${n(p.soulUrge.value)}), you are moved by ${su.essence}. Outwardly (Personality ${n(p.personality.value)}), ${pe.personality.replace(/^You/, "you")}\n\nYour Birthday number ${p.birthday.value} adds a natural gift for ${bd.essence}.${p.soulUrge.value !== p.personality.value ? " The gap between what drives you and how you appear is worth knowing: others may not see your motivations unless you share them." : " What drives you and how you appear line up closely, so people usually read you accurately."}`;
    case "career":
      return `${ex.career}${p.expression.value !== p.lifePath.value ? `\n\nYour Life Path ${n(p.lifePath.value)} adds a direction: work that involves ${lp.essence} tends to feel meaningful rather than merely busy.` : ""}`;
    case "relationships":
      return `${su.love}${p.lifePath.value !== p.soulUrge.value ? `\n\nOver the long run, your Life Path ${n(p.lifePath.value)} asks for a partner who supports ${lp.essence}.` : ""}`;
    case "strengths": {
      const s = [...new Set([lp.strength, ex.strength, su.strength])];
      const c = [...new Set([lp.challenge, ex.challenge])];
      const list = (a: string[]) => a.map((x, i) => (i ? x[0].toLowerCase() + x.slice(1) : x)).join("; ");
      return `**Strengths:** ${list(s)}.\n\n**Growth edges:** ${list(c)}.`;
    }
    case "year": {
      const next = personalYear(parseDob(p.dob), p.targetYear + 1);
      return `${p.targetYear} is Personal Year **${p.personalYear}**: ${PERSONAL_YEAR[p.personalYear]}.${tier === "complete" ? `\n\nLooking ahead: ${p.targetYear + 1} is Personal Year ${next} (${PERSONAL_YEAR[next].split(" — ")[0]}), and ${p.targetYear + 2} is Personal Year ${personalYear(parseDob(p.dob), p.targetYear + 2)}.` : ""}`;
    }
    case "loshu": {
      const miss = p.loShu.missing.length ? p.loShu.missing.map((m) => `- **${m} missing** — ${LO_SHU_MISSING[m]}`).join("\n") : "- No numbers are missing.";
      const rep = p.loShu.repeated.length ? `\n\n**Repeated:** ${p.loShu.repeated.map((r) => `${r.n} appears ${r.count} times (its qualities are emphasised)`).join("; ")}.` : "";
      const arrows = p.loShu.completeArrows.length ? `\n\n**Complete planes:** ${p.loShu.completeArrows.map((a) => LO_SHU_ARROW[a]).join("; ")}.` : "";
      return `Built from the digits ${p.loShu.digits.join(" ")} of your date of birth (the grid is shown above).\n\n${miss}${rep}${arrows}`;
    }
    case "summary":
      return `Your numbers point to someone whose path is about ${lp.essence}, expressed through ${ex.essence}. For ${p.targetYear}, the practical step is simple: treat it as ${PERSONAL_YEAR[p.personalYear].split(" — ")[0]} and choose one commitment that fits that theme.`;
  }
  return "";
}

export function buildNumerologyReport(input: { name: string; dob: string; method: "pythagorean" | "chaldean"; tier: NumerologyTier; targetYear?: number }, write?: Record<string, string>): ReportDoc {
  const p = numerologyProfile(input);
  const ids = TIER_SECTIONS[input.tier];
  const specs = NUMEROLOGY_SECTIONS.filter((s) => ids.includes(s.id));
  const doc: ReportDoc = {
    title: `Numerology Report — ${p.name}`,
    subtitle: `${input.tier[0].toUpperCase()}${input.tier.slice(1)} · ${p.method === "pythagorean" ? "Pythagorean" : "Chaldean"} method`,
    sections: specs.map((s) => ({ id: s.id, title: s.title, body: (write?.[s.id]?.trim() || ruleSection(s.id, p, input.tier)), evidence: s.requires })),
    disclaimer: READING_DISCLAIMER.numerology,
    method: p.conventions,
  };
  return dedupeReport(doc);
}
