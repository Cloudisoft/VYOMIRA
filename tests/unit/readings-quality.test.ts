import { describe, expect, it } from "vitest";
import { randomInt } from "node:crypto";
import { buildNumerologyReport, TIER_SECTIONS } from "@/lib/readings/numerology-report";
import { buildTarotReport } from "@/lib/readings/tarot-report";
import { CARD, DECK, resolvePicks, shuffleDeck, SPREADS, TAROT_CATEGORIES, type SpreadId } from "@/lib/readings/tarot";
import { CARD_MEANING, POSITION } from "@/lib/readings/tarot-i18n";
import { meaning, PERSONAL_YEAR, LO_SHU_MISSING } from "@/lib/readings/numerology-meanings";
import { assertNoRepetition, dedupeReport, repeatedPhrases, type ReportDoc } from "@/lib/readings/report";
import { invisibleEverywhere, palmObservations, type PalmHand } from "@/lib/readings/palm";
import type { RLang } from "@/lib/readings/lang";

const LANGS: RLang[] = ["en", "hi", "hinglish"];
const NAMES = ["Priya Sharma", "Rahul Verma", "Aisha Khan", "John Smith", "Meera Nair", "Arjun Reddy", "Lynn Wyld", "Zoë O'Brien", "Sita Devi", "Vikram Singh Rathore"];
const text = (d: ReportDoc) => d.sections.map((s) => `${s.title}\n${s.body}`).join("\n");
const devanagari = /[ऀ-ॿ]/;

function checkDoc(d: ReportDoc, lang: RLang) {
  expect(() => assertNoRepetition(d)).not.toThrow();
  expect(repeatedPhrases(d, 8)).toEqual([]);
  const t = text(d) + d.disclaimer + d.method.join(" ");
  expect(t).not.toMatch(/undefined|NaN|\[object|null/);
  if (lang === "hi") { expect(t).toMatch(devanagari); expect(d.disclaimer).toMatch(devanagari); }
  else expect(t.replace(/[“”—·→×]/g, "")).not.toMatch(devanagari);
}

describe("translation completeness", () => {
  it("every card has Hindi and Hinglish upright and reversed meanings", () => {
    for (const l of ["hi", "hinglish"] as const) for (const c of DECK) {
      const m = CARD_MEANING[l][c.id];
      expect(m, `${l} ${c.id}`).toBeDefined();
      expect(m[0].length > 3 && m[1].length > 3).toBe(true);
      expect(m[0]).not.toBe(m[1]);
    }
    expect(Object.keys(CARD_MEANING.hi)).toHaveLength(78);
  });
  it("every spread position is translated", () => {
    for (const l of ["hi", "hinglish"] as const) for (const s of Object.values(SPREADS)) for (const p of s.positions) expect(POSITION[l][p.id], `${l} ${p.id}`).toBeDefined();
  });
  it("every number meaning, personal year and Lo Shu note exists in all languages", () => {
    for (const l of LANGS) {
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) for (const [k, v] of Object.entries(meaning(n, l))) expect(v, `${l} ${n} ${k}`).toBeTruthy();
      for (let n = 1; n <= 9; n++) { expect(PERSONAL_YEAR[l][n][0]).toBeTruthy(); expect(LO_SHU_MISSING[l][n]).toBeTruthy(); }
    }
  });
  it("within one number, no two fields say the same thing", () => {
    for (const l of LANGS) for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
      const vals = Object.values(meaning(n, l));
      expect(new Set(vals).size).toBe(vals.length);
    }
  });
});

describe("numerology reports — every tier, method and language, many people", () => {
  for (const lang of LANGS) {
    it(`${lang}: no repeated sentences or 8-word phrases`, () => {
      let n = 0;
      for (const name of NAMES) for (let k = 0; k < 6; k++) {
        const dob = `${1950 + randomInt(60)}-${String(1 + randomInt(12)).padStart(2, "0")}-${String(1 + randomInt(28)).padStart(2, "0")}`;
        for (const tier of ["basic", "detailed", "complete"] as const) for (const method of ["pythagorean", "chaldean"] as const) {
          const d = buildNumerologyReport({ name, dob, method, tier, targetYear: 2026, lang });
          expect(d.sections.map((s) => s.id)).toEqual(TIER_SECTIONS[tier]);
          checkDoc(d, lang);
          n++;
        }
      }
      expect(n).toBe(360);
    });
  }
  it("the report numbers match the engine exactly", () => {
    const d = buildNumerologyReport({ name: "John Smith", dob: "1990-07-15", method: "pythagorean", tier: "complete", targetYear: 2026, lang: "hi" });
    const core = d.sections.find((s) => s.id === "core")!.body;
    expect(core).toMatch(/\*\*मूलांक-पथ \(लाइफ़ पाथ\) 5\*\*/);
    expect(core).toMatch(/44 → 8/);
    expect(core).toMatch(/29 → 11/);
  });
});

describe("tarot reports — every spread, topic and language, random draws", () => {
  for (const lang of LANGS) for (const spread of Object.keys(SPREADS) as SpreadId[]) {
    it(`${lang} / ${spread}: interprets only drawn cards, no repetition`, () => {
      const need = SPREADS[spread].positions.length;
      for (let k = 0; k < 40; k++) {
        const deck = shuffleDeck(randomInt);
        const picks: number[] = [];
        while (picks.length < need) { const x = randomInt(22); if (!picks.includes(x)) picks.push(x); }
        const cards = resolvePicks(deck, spread, picks);
        const category = TAROT_CATEGORIES[k % 5];
        const d = buildTarotReport(cards, spread, { category, question: k % 2 ? "Should I change teams this year?" : "" }, lang);
        checkDoc(d, lang);
        const all = text(d);
        const drawn = new Set(cards.map((c) => CARD[c.cardId].name));
        for (const c of DECK) if (!drawn.has(c.name) && (c.name.startsWith("The ") || c.name.includes(" of "))) expect(all.includes(c.name), `${c.name} not drawn`).toBe(false);
        for (const c of cards) expect(all).toContain(CARD[c.cardId].name);
      }
    });
  }
});

describe("sentence-level de-duplication", () => {
  it("drops a sentence repeated inside a later paragraph but keeps the new sentences", () => {
    const d = dedupeReport({ title: "t", disclaimer: "d", method: [], sections: [
      { id: "a", title: "A", body: "Your Life Path points to independence and fresh starts in every part of life." },
      { id: "b", title: "B", body: "A new idea about how you work best with clear ownership. Your Life Path points to independence and fresh starts in every part of life." },
    ] });
    expect(d.sections[1].body).toBe("A new idea about how you work best with clear ownership.");
  });
});

describe("palm observations", () => {
  const hand: PalmHand = { side: "right", isPalm: true, palmShape: { type: "earth", basis: "square palm, short fingers" }, mounts: [{ mount: "venus", prominence: "prominent", observation: "" }, { mount: "moon", prominence: "unclear", observation: "" }],
    lines: [{ line: "life", visibility: "clear", length: "long", shape: "curved", features: [], observation: "wide arc" }, { line: "head", visibility: "faint", length: "medium", shape: "straight", features: ["joined_life_line"], observation: "" }, { line: "heart", visibility: "clear", length: "long", shape: "curved", features: ["fork"], observation: "" }, { line: "fate", visibility: "not_visible", length: "unclear", shape: "unclear", features: [], observation: "" }, { line: "sun", visibility: "not_visible", length: "unclear", shape: "unclear", features: [], observation: "" }, { line: "mercury", visibility: "not_visible", length: "unclear", shape: "unclear", features: [], observation: "" }] };
  it("lists every line, marks invisible ones, and never invents a mount", () => {
    for (const lang of LANGS) {
      const t = palmObservations([hand], "right", lang);
      expect(t.split("\n").filter((l) => l.startsWith("- **")).length).toBe(7);
      expect(t).not.toMatch(/Moon|चंद्र|Chandra/);
    }
    expect(palmObservations([hand], "right", "en")).toMatch(/Fate line:\*\* not clearly visible/);
    expect(palmObservations([hand], "right", "hi")).toMatch(/भाग्य रेखा:\*\* इस फ़ोटो में स्पष्ट नहीं दिखती/);
    expect(invisibleEverywhere([hand])).toEqual(["fate", "sun", "mercury"]);
    expect(invisibleEverywhere([hand, { ...hand, side: "left", lines: hand.lines.map((l) => (l.line === "fate" ? { ...l, visibility: "faint" as const } : l)) }])).toEqual(["sun", "mercury"]);
  });
});
