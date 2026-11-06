import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { transitSummary } from "@/lib/astro/transits";
import { activePeriods } from "@/lib/astro/dasha";
import { lifeGuide, slowSignWindows } from "@/lib/interpret/life-guide";

const now = new Date("2026-11-05T12:00:00Z");
const exact = computeChart({ local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi", precision: "exact" });
const unknownTime = computeChart({ local: { year: 1995, month: 3, day: 2, hour: 12, minute: 0 }, timeZone: "Asia/Kolkata", latitude: 19.076, longitude: 72.8777, placeLabel: "Mumbai", precision: "unknown" });
const tr = transitSummary(exact, now, true);
const windows = slowSignWindows(now, 8);

describe("life guide", () => {
  const g = lifeGuide(exact, tr, "Asha Verma", now, "en", windows)!;

  it("tells past, present and future from the real dasha sequence", () => {
    const act = activePeriods(exact.dasha, now);
    expect(g.present.chapter.lord).toBe(act.mahadasha!.lord);
    expect(g.present.sub?.lord).toBe(act.antardasha!.lord);
    for (const p of g.past) expect(Date.parse(p.end)).toBeLessThanOrEqual(now.getTime());
    for (const f of g.future) expect(Date.parse(f.date)).toBeGreaterThan(now.getTime());
    expect(g.headline).toContain("Asha");
  });

  it("gives every life area a dated timeline with past and upcoming windows", () => {
    expect(g.areas.map((a) => a.key).sort()).toEqual(["business", "career", "family", "fortune", "health", "learning", "love", "money"]);
    for (const a of g.areas) {
      expect(a.timeline.length).toBeGreaterThan(5);
      // contiguous, ordered, inside the range
      for (let i = 1; i < a.timeline.length; i++) expect(Date.parse(a.timeline[i].start)).toBeGreaterThanOrEqual(Date.parse(a.timeline[i - 1].start));
      expect(Date.parse(a.timeline[0].start)).toBeGreaterThanOrEqual(Date.parse(g.range.start) - 1);
      for (const w of a.next) { expect(Date.parse(w.start)).toBeGreaterThan(now.getTime()); expect(w.text.length).toBeGreaterThan(20); expect(w.why).toMatch(/period/); }
      for (const w of a.past) expect(Date.parse(w.end)).toBeLessThanOrEqual(now.getTime());
      expect(["strong", "active", "challenging", "quiet"]).toContain(a.rating);
    }
    expect(g.areas.some((a) => a.next.length > 0)).toBe(true);
  });

  it("ratings vary across a chart's life (not all positive)", () => {
    const kinds = new Set(g.areas.flatMap((a) => a.timeline.map((s) => s.rating)));
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });

  it("suggests remedies for the planets running the current period", () => {
    expect(g.remedies[0].planet).toBe(activePeriods(exact.dasha, now).mahadasha!.lord);
    for (const r of g.remedies) { expect(r.habits.length).toBeGreaterThanOrEqual(3); expect(r.traditional.mantra).toMatch(/^Om /); }
  });

  it("speaks Hindi in Devanagari and Hinglish in Roman script", () => {
    const hi = lifeGuide(exact, tr, "Asha Verma", now, "hi", windows)!;
    const hg = lifeGuide(exact, tr, "Asha Verma", now, "hinglish", windows)!;
    const deva = /[ऀ-ॿ]/;
    for (const s of [hi.headline, hi.areas[0].label, hi.areas[0].text, hi.areas[0].tip, hi.present.skyNow[0], hi.remedies[0].habits[0]]) expect(s).toMatch(deva);
    expect(hi.remedies[0].traditional.mantra).toMatch(/^ॐ/);
    for (const s of [hg.headline, hg.areas[0].label, hg.areas[0].text, hg.present.skyNow[0], hg.remedies[0].habits[0]]) expect(s).not.toMatch(deva);
    expect(hg.headline).toMatch(/chapter mein/);
    // same timing in every language
    expect(hi.areas.map((a) => a.rating)).toEqual(g.areas.map((a) => a.rating));
  });

  it("uses plain language (no untranslated jargon in the headline and summaries)", () => {
    const text = [g.headline, g.present.chapter.summary, ...g.areas.map((a) => a.text)].join(" ");
    expect(text).not.toMatch(/mahadasha|antardasha|bhava|karaka|lagna/i);
  });

  it("works without a birth time (reads houses from the Moon and warns about dates)", () => {
    const u = lifeGuide(unknownTime, transitSummary(unknownTime, now, true), "Ravi", now, "en", windows)!;
    expect(u.basis).toBe("moon");
    expect(u.caveat).toBeTruthy();
    expect(u.areas).toHaveLength(8);
  });

  it("slow-planet windows are contiguous real ingresses", () => {
    for (const p of ["Jupiter", "Saturn"]) {
      const w = windows.filter((x) => x.planet === p);
      expect(w.length).toBeGreaterThan(p === "Jupiter" ? 5 : 2);
      for (let i = 1; i < w.length; i++) expect(w[i].start).toBe(w[i - 1].end);
    }
  });
});
