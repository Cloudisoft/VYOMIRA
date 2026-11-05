import { describe, expect, it } from "vitest";
import { vimshottari, activePeriods } from "@/lib/astro/dasha";
import { navamsaSign, dashamsaSign } from "@/lib/astro/varga";
import { NAKSHATRA_SPAN } from "@/lib/astro/constants";

const YEAR = 365.25 * 86400000;

describe("Vimshottari dasha", () => {
  const birth = new Date("2000-01-01T00:00:00Z");
  it("Moon at 0° Aries (start of Ashwini) gives a full 7-year Ketu balance", () => {
    const r = vimshottari(0, birth);
    expect(r.balanceAtBirth.lord).toBe("Ketu");
    expect(r.balanceAtBirth.totalYears).toBeCloseTo(7, 10);
    expect(r.mahadashas[0].start).toBe(birth.toISOString());
  });
  it("Moon halfway through Rohini gives 5 years of Moon dasha remaining", () => {
    const r = vimshottari(3 * NAKSHATRA_SPAN + NAKSHATRA_SPAN / 2, birth);
    expect(r.balanceAtBirth.lord).toBe("Moon");
    expect(r.balanceAtBirth.totalYears).toBeCloseTo(5, 10);
  });
  it("the nine mahadashas total 120 years and are contiguous", () => {
    const r = vimshottari(123.456, birth);
    const total = (Date.parse(r.mahadashas[8].end) - Date.parse(r.mahadashas[0].start)) / YEAR;
    expect(total).toBeCloseTo(120, 6);
    for (let i = 1; i < 9; i++) expect(r.mahadashas[i].start).toBe(r.mahadashas[i - 1].end);
  });
  it("antardashas start with the mahadasha lord and exactly fill the mahadasha", () => {
    const r = vimshottari(200, birth);
    for (const m of r.mahadashas) {
      expect(m.children![0].lord).toBe(m.lord);
      expect(m.children![0].start).toBe(m.start);
      expect(Math.abs(Date.parse(m.children![8].end) - Date.parse(m.end))).toBeLessThan(5);
    }
  });
  it("finds active periods including pratyantardasha", () => {
    const r = vimshottari(200, birth);
    const a = activePeriods(r, new Date("2010-06-01T00:00:00Z"));
    expect(a.mahadasha && a.antardasha && a.pratyantardasha).toBeTruthy();
  });
});

describe("divisional charts", () => {
  it("Navamsa: movable signs start from themselves, fixed from 9th, dual from 5th", () => {
    expect(navamsaSign(0.5)).toBe(0); // Aries → Aries
    expect(navamsaSign(30.5)).toBe(9); // Taurus → Capricorn
    expect(navamsaSign(60.5)).toBe(6); // Gemini → Libra
    expect(navamsaSign(29.9)).toBe(8); // Aries last pada → Sagittarius
    expect(navamsaSign(359.9)).toBe(11); // Pisces end → Pisces
  });
  it("Dashamsa: odd signs from themselves, even signs from the 9th", () => {
    expect(dashamsaSign(0.5)).toBe(0); // Aries → Aries
    expect(dashamsaSign(30.5)).toBe(9); // Taurus → Capricorn
    expect(dashamsaSign(29.5)).toBe(9); // Aries 10th part → Capricorn
    expect(dashamsaSign(59.5)).toBe(6); // Taurus 10th part → Libra
  });
});
