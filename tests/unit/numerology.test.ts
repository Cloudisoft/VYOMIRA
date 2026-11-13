import { describe, expect, it } from "vitest";
import { digitSum, letterValue, lifePath, loShu, normalizeName, numerologyProfile, parseDob, personalYear, reduce } from "@/lib/readings/numerology";

describe("numerology: reduction", () => {
  it("reduces to a single digit and keeps masters by default", () => {
    expect(digitSum(1987)).toBe(25);
    expect(reduce(44)).toBe(8);
    expect(reduce(29)).toBe(11);
    expect(reduce(38)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
    expect(reduce(22, false)).toBe(4);
    expect(reduce(9)).toBe(9);
    expect(reduce(0)).toBe(0);
  });
  it("normalises names (accents, spaces, punctuation)", () => {
    expect(normalizeName("Zoë O'Brien-Smith")).toBe("ZOEOBRIENSMITH");
  });
});

describe("numerology: letter tables", () => {
  it("Pythagorean values", () => {
    expect(["A", "I", "J", "R", "S", "Z"].map((c) => letterValue(c, "pythagorean"))).toEqual([1, 9, 1, 9, 1, 8]);
  });
  it("Chaldean values — no letter is 9", () => {
    expect(["A", "F", "O", "Z", "U", "E"].map((c) => letterValue(c, "chaldean"))).toEqual([1, 8, 7, 7, 6, 5]);
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") expect(letterValue(c, "chaldean")).toBeLessThan(9);
  });
});

describe("numerology: dates", () => {
  it("validates DOB", () => {
    expect(parseDob("1990-07-15")).toEqual({ year: 1990, month: 7, day: 15 });
    expect(() => parseDob("1990-02-30")).toThrow();
    expect(() => parseDob("15/07/1990")).toThrow();
  });
  it("Life Path reduces components separately", () => {
    expect(lifePath(parseDob("1990-07-15")).value).toBe(5);
    expect(lifePath(parseDob("1987-11-29")).value).toBe(11); // 11 + 11 + 7 = 29 → 11
    expect(lifePath(parseDob("1975-04-29")).value).toBe(1); // 4 + 11 + 22 = 37 → 10 → 1
  });
  it("Personal Year", () => {
    expect(personalYear(parseDob("1990-07-15"), 2026)).toBe(5);
    expect(personalYear(parseDob("1987-11-29"), 2026)).toBe(5); // 2 + 2 + 1 = 5
  });
  it("Lo Shu grid counts, missing and repeated numbers", () => {
    const g = loShu(parseDob("1990-07-15"));
    expect(g.digits).toEqual([1, 5, 7, 1, 9, 9]);
    expect(g.missing).toEqual([2, 3, 4, 6, 8]);
    expect(g.repeated).toEqual([{ n: 1, count: 2 }, { n: 9, count: 2 }]);
    expect(g.completeArrows).toContain("will");
    expect(g.grid[0].map((c) => c.n)).toEqual([4, 9, 2]);
  });
});

describe("numerology: full profile", () => {
  it("Pythagorean JOHN SMITH", () => {
    const p = numerologyProfile({ name: "John Smith", dob: "1990-07-15", targetYear: 2026 });
    expect(p.method).toBe("pythagorean");
    expect(p.expression.compound).toBe(44);
    expect(p.expression.value).toBe(8);
    expect(p.soulUrge.value).toBe(6);
    expect(p.personality.compound).toBe(29);
    expect(p.personality.value).toBe(11);
    expect(p.birthday).toEqual({ day: 15, value: 6 });
    expect(p.lifePath.value).toBe(5);
    expect(p.personalYear).toBe(5);
  });
  it("Chaldean JOHN SMITH", () => {
    const p = numerologyProfile({ name: "John Smith", dob: "1990-07-15", method: "chaldean", targetYear: 2026 });
    expect(p.expression.compound).toBe(35);
    expect(p.expression.value).toBe(8);
    expect(p.soulUrge.compound).toBe(8); // O7 + I1
    expect(p.personality.compound).toBe(27);
    expect(p.personality.value).toBe(9);
    expect(p.conventions[0]).toMatch(/Chaldean/);
  });
  it("Chaldean does not keep master numbers for names", () => {
    const p = numerologyProfile({ name: "Kkkkkkkkkkk", dob: "1990-07-15", method: "chaldean" }); // 11 × 2 = 22
    expect(p.expression.compound).toBe(22);
    expect(p.expression.value).toBe(4);
  });
  it("is deterministic", () => {
    const a = numerologyProfile({ name: "Priya Sharma", dob: "1995-03-08", targetYear: 2026 });
    const b = numerologyProfile({ name: "Priya Sharma", dob: "1995-03-08", targetYear: 2026 });
    expect(a).toEqual(b);
  });
  it("rejects names without letters", () => {
    expect(() => numerologyProfile({ name: "123", dob: "1990-07-15" })).toThrow();
  });
});

import { buildNumerologyReport, TIER_SECTIONS } from "@/lib/readings/numerology-report";
import { assertNoRepetition, dedupeReport } from "@/lib/readings/report";

describe("numerology report", () => {
  for (const tier of ["basic", "detailed", "complete"] as const) {
    for (const method of ["pythagorean", "chaldean"] as const) {
      it(`${tier}/${method} has the right sections and no repetition`, () => {
        const r = buildNumerologyReport({ name: "Priya Sharma", dob: "1995-03-08", method, tier, targetYear: 2026 });
        expect(r.sections.map((s) => s.id)).toEqual(TIER_SECTIONS[tier]);
        expect(r.subtitle).toMatch(method === "pythagorean" ? /Pythagorean/ : /Chaldean/);
        expect(() => assertNoRepetition(r)).not.toThrow();
        expect(r.sections.every((s) => !/interpretive practice/.test(s.body))).toBe(true);
      });
    }
  }
  it("dedupe removes repeated paragraphs, filler intros and stray disclaimers", () => {
    const para = "Your Life Path is 5, the number traditionally linked with freedom, change and experience in every area.";
    const d = dedupeReport({ title: "t", disclaimer: "d", method: [], sections: [
      { id: "a", title: "A", body: para },
      { id: "b", title: "B", body: `In this section we will explore your career in detail and depth.\n\n${para}\n\nA genuinely new paragraph about career choices and work style here.` },
      { id: "c", title: "C", body: "Remember, numerology is an interpretive practice and not a substitute for professional advice." },
      { id: "summary", title: "S", body: "In summary, this is a closing paragraph that wraps everything up neatly." },
    ] });
    expect(d.sections.map((s) => s.id)).toEqual(["a", "b", "summary"]);
    expect(d.sections[1].body).toBe("A genuinely new paragraph about career choices and work style here.");
    expect(d.validation?.removed.length).toBe(3);
    expect(() => assertNoRepetition(d)).not.toThrow();
  });
});
