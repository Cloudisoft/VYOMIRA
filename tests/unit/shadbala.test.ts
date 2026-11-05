import { describe, expect, it } from "vitest";
import fx from "../fixtures/jhora-reference.json";
import { shadbala, drishti, NAISARGIKA } from "@/lib/astro/shadbala";

const dateOf = (u: number[]) => new Date(Date.UTC(u[0], u[1] - 1, u[2]) + u[3] * 3600000);
type J = { sthana: number[]; dig: number[]; naisargika: number[] };

describe("Shadbala", () => {
  for (const c of fx.cases) {
    const j = (c as unknown as { shadbala?: J }).shadbala;
    if (!j) continue;
    it(`${c.id}: Sthana and Naisargika match PyJHora; Dig matches wherever PyJHora's value is valid (≤ 60)`, () => {
      const r = shadbala(dateOf(c.utc), c.lat, c.lon);
      r.forEach((row, i) => {
        // Exact match, except two documented convention differences with PyJHora:
        //  · Kendradi bala from bhava (cusp) houses in PyJHora vs whole-sign houses here → ±15/30
        //  · Moon's moolatrikona = all of Taurus in PyJHora vs BPHS 4°–20° here → ±41.25
        const d = Math.abs(row.sthana.total - j.sthana[i]);
        const ok = d < 0.5 || [15, 30, 41.25, 45].some((k) => Math.abs(d - k) < 0.05);
        expect(ok, `${row.planet} sthana ${row.sthana.total} vs ${j.sthana[i]}`).toBe(true);
        expect(row.naisargika).toBeCloseTo(j.naisargika[i], 1);
        if (j.dig[i] <= 60) expect(Math.abs(row.dig - j.dig[i]), `${row.planet} dig`).toBeLessThan(1);
        expect(row.dig).toBeGreaterThanOrEqual(0);
        expect(row.dig).toBeLessThanOrEqual(60);
        expect(row.sthana.uchcha).toBeLessThanOrEqual(60);
        expect(row.rupas).toBeCloseTo(row.total / 60, 6);
      });
    });
  }
  it("naisargika values are the BPHS constants", () => {
    expect(NAISARGIKA.Sun).toBe(60);
    expect(NAISARGIKA.Saturn).toBe(8.57);
  });
  it("sputa drishti: full on the 7th, special aspects full", () => {
    expect(drishti("Sun", 180)).toBe(60);
    expect(drishti("Mars", 95)).toBe(60);
    expect(drishti("Jupiter", 125)).toBe(60);
    expect(drishti("Saturn", 65)).toBe(60);
    expect(drishti("Venus", 15)).toBe(0);
  });
});
