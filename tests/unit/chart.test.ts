import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";

const base = { timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi" };

describe("computeChart", () => {
  const exact = computeChart({ ...base, local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, precision: "exact" });
  it("records conventions, UTC instant and versions", () => {
    expect(exact.computation.id).toMatch(/^vyomira-astro-/);
    expect(exact.computation.ayanamsa).toBe("lahiri-iau1976");
    expect(exact.input.utc).toBe("1990-08-15T05:00:00.000Z");
    expect(exact.confidence.lagnaReliable).toBe(true);
  });
  it("has 12 whole-sign houses starting at the Lagna sign", () => {
    expect(exact.houses).toHaveLength(12);
    expect(exact.houses![0].sign).toBe(exact.lagna!.sign);
    for (const p of exact.placements) expect(p.house).toBe(((p.sign - exact.lagna!.sign + 12) % 12) + 1);
  });
  it("nakshatra and pada are consistent with longitude", () => {
    for (const p of exact.placements) {
      expect(p.nakshatraIndex).toBe(Math.floor(p.longitude / (360 / 27)));
      expect(p.pada).toBeGreaterThanOrEqual(1);
      expect(p.pada).toBeLessThanOrEqual(4);
    }
  });
  it("never shows an ascendant or houses when birth time is unknown", () => {
    const u = computeChart({ ...base, local: { year: 1990, month: 8, day: 15, hour: 0, minute: 0 }, precision: "unknown" });
    expect(u.lagna).toBeNull();
    expect(u.houses).toBeNull();
    expect(u.placements.every((p) => p.house === null)).toBe(true);
    expect(u.vargas.D9.Lagna).toBeNull();
    expect(u.yogas.every((y) => !y.requiresBirthTime)).toBe(true);
    expect(u.confidence.dashaTimingReliable).toBe(false);
  });
  it("withholds Lagna when an approximate window crosses a sign boundary", () => {
    // ±120 minutes always spans more than one rising sign in Delhi
    const a = computeChart({ ...base, local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, precision: "approximate", uncertaintyMinutes: 120 });
    expect(a.confidence.lagnaReliable).toBe(false);
    expect(a.lagna).toBeNull();
  });
  it("flags ambiguous local times and lets the user choose the occurrence", () => {
    const l = { timeZone: "Europe/London", latitude: 51.5, longitude: -0.12, placeLabel: "London", precision: "exact" as const, local: { year: 2019, month: 10, day: 27, hour: 1, minute: 30 } };
    expect(computeChart(l).input.timeResolution).toBe("ambiguous");
    expect(computeChart(l).input.utc).toBe("2019-10-27T00:30:00.000Z");
    expect(computeChart({ ...l, fold: 1 }).input.utc).toBe("2019-10-27T01:30:00.000Z");
  });
  it("is deterministic", () => {
    const again = computeChart({ ...base, local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, precision: "exact" }, new Date(exact.computation.calculatedAt));
    expect(again).toEqual(exact);
  });
});
