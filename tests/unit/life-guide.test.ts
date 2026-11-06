import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { transitSummary } from "@/lib/astro/transits";
import { activePeriods } from "@/lib/astro/dasha";
import { lifeGuide } from "@/lib/interpret/life-guide";

const now = new Date("2026-11-05T12:00:00Z");
const exact = computeChart({ local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi", precision: "exact" });
const unknownTime = computeChart({ local: { year: 1995, month: 3, day: 2, hour: 12, minute: 0 }, timeZone: "Asia/Kolkata", latitude: 19.076, longitude: 72.8777, placeLabel: "Mumbai", precision: "unknown" });

describe("life guide", () => {
  const g = lifeGuide(exact, transitSummary(exact, now, true), "Asha Verma", now)!;

  it("tells past, present and future from the real dasha sequence", () => {
    const act = activePeriods(exact.dasha, now);
    expect(g.present.chapter.lord).toBe(act.mahadasha!.lord);
    expect(g.present.sub?.lord).toBe(act.antardasha!.lord);
    for (const p of g.past) expect(Date.parse(p.end)).toBeLessThanOrEqual(now.getTime());
    expect(g.future.length).toBeGreaterThan(0);
    for (const f of g.future) expect(Date.parse(f.date)).toBeGreaterThan(now.getTime());
    expect(g.headline).toContain("Asha");
  });

  it("rates every life area and gives a practical tip", () => {
    expect(g.areas.map((a) => a.key).sort()).toEqual(["career", "growth", "home", "love", "money", "wellbeing"]);
    for (const a of g.areas) { expect(["supportive", "mixed", "demanding"]).toContain(a.tone); expect(a.tip.length).toBeGreaterThan(20); }
  });

  it("suggests remedies for the planets running the current period", () => {
    const act = activePeriods(exact.dasha, now);
    expect(g.remedies[0].planet).toBe(act.mahadasha!.lord);
    for (const r of g.remedies) { expect(r.habits.length).toBeGreaterThanOrEqual(3); expect(r.traditional.mantra).toMatch(/^Om /); }
  });

  it("uses plain language (no untranslated jargon in the headline and summaries)", () => {
    const text = [g.headline, g.present.chapter.summary, ...g.areas.map((a) => a.text)].join(" ");
    expect(text).not.toMatch(/mahadasha|antardasha|bhava|karaka|lagna/i);
  });

  it("works without a birth time (reads houses from the Moon and warns about dates)", () => {
    const u = lifeGuide(unknownTime, transitSummary(unknownTime, now, true), "Ravi", now)!;
    expect(u.basis).toBe("moon");
    expect(u.caveat).toBeTruthy();
    expect(u.areas).toHaveLength(6);
  });
});
