import { describe, expect, it } from "vitest";
import fx from "../fixtures/swisseph-lahiri.json";
import { angles, bodyPosition, timeContext } from "@/lib/astro/positions";
import type { Planet } from "@/lib/astro/constants";

/**
 * Numerical regression against independently generated Swiss Ephemeris (Moshier) reference values
 * (scripts/reference/generate_se_fixtures.py). Tolerances are arcseconds.
 */
const TOL_PLANET = 30;
const TOL_ASC = 30;
const TOL_AYAN = 2;
const diffArcsec = (a: number, b: number) => {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return Math.abs(d) * 3600;
};

describe("ephemeris vs Swiss Ephemeris reference", () => {
  for (const c of fx.cases) {
    const [y, m, d, h] = c.utc;
    const date = new Date(Date.UTC(y, m - 1, d) + h * 3600000);
    it(`${c.id} — ${c.note}`, () => {
      expect(diffArcsec(timeContext(date).ayanamsa, c.ayanamsa)).toBeLessThan(TOL_AYAN);
      for (const [planet, ref] of Object.entries(c.planets) as [Planet, { lon: number; speed: number }][]) {
        const b = bodyPosition(planet, date);
        expect(diffArcsec(b.longitude, ref.lon), `${planet} longitude`).toBeLessThan(TOL_PLANET);
        if (planet !== "Rahu" && Math.abs(ref.speed) > 0.01) expect(b.retrograde, `${planet} retrograde`).toBe(ref.speed < 0);
      }
      expect(diffArcsec(angles(date, c.lat, c.lon).ascendant, c.ascendant), "ascendant").toBeLessThan(TOL_ASC);
    });
  }

  it("Ketu is exactly opposite Rahu", () => {
    const d = new Date("2001-05-05T05:05:00Z");
    expect(diffArcsec(bodyPosition("Ketu", d).longitude, (bodyPosition("Rahu", d).longitude + 180) % 360)).toBeLessThan(0.001);
  });
});
