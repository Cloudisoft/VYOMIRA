import { describe, expect, it } from "vitest";
import { randomInt } from "node:crypto";
import { CARD, DECK, resolvePicks, shuffleDeck, SPREADS } from "@/lib/readings/tarot";

describe("tarot deck", () => {
  it("has all 78 unique cards: 22 majors and 14 per suit", () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
    expect(DECK.filter((c) => c.suit === "major")).toHaveLength(22);
    for (const s of ["wands", "cups", "swords", "pentacles"]) expect(DECK.filter((c) => c.suit === s)).toHaveLength(14);
    expect(CARD["major-0"].name).toBe("The Fool");
    expect(CARD["cups-14"].name).toBe("King of Cups");
    expect(DECK.every((c) => c.upright && c.reversed)).toBe(true);
  });
  it("spreads have the documented positions", () => {
    expect(SPREADS.single.positions).toHaveLength(1);
    expect(SPREADS.three.positions.map((p) => p.label)).toEqual(["Past", "Present", "Future"]);
    expect(SPREADS.five.positions.map((p) => p.id)).toEqual(["situation", "challenge", "hidden", "guidance", "direction"]);
    expect(SPREADS.celtic.positions).toHaveLength(10);
  });
});

describe("tarot shuffle and picks", () => {
  it("shuffle is a permutation with orientations", () => {
    const d = shuffleDeck(randomInt);
    expect(d).toHaveLength(78);
    expect(new Set(d.map((x) => x.id)).size).toBe(78);
    expect(d.every((x) => typeof x.reversed === "boolean")).toBe(true);
  });
  it("is deterministic given the RNG (so picks map to recorded cards)", () => {
    const seq = (seed: number) => { let s = seed; return (n: number) => { s = (s * 1103515245 + 12345) % 2147483648; return s % n; }; };
    expect(shuffleDeck(seq(7))).toEqual(shuffleDeck(seq(7)));
  });
  it("is roughly uniform", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) { const top = shuffleDeck(randomInt)[0].id; counts[top] = (counts[top] ?? 0) + 1; }
    expect(Object.keys(counts).length).toBeGreaterThan(70);
    expect(Math.max(...Object.values(counts))).toBeLessThan(140); // expected ≈ 51
  });
  it("resolves picks to positions and rejects bad picks", () => {
    const d = shuffleDeck(randomInt);
    const r = resolvePicks(d, "three", [5, 0, 21]);
    expect(r.map((x) => x.position)).toEqual(["past", "present", "future"]);
    expect(r[0].cardId).toBe(d[5].id);
    expect(r[2].reversed).toBe(d[21].reversed);
    expect(() => resolvePicks(d, "three", [1, 1, 2])).toThrow();
    expect(() => resolvePicks(d, "three", [1, 2])).toThrow();
    expect(() => resolvePicks(d, "single", [22])).toThrow();
  });
});
