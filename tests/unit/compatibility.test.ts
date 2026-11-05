import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { ashtakoota } from "@/lib/astro/compatibility";

const span = 360 / 27, pada = span / 4;
const moon = (nak: number, p: number) => ({ moonLon: nak * span + (p - 0.5) * pada, nakshatraStable: true });

describe("Ashtakoota", () => {
  it("scores within 0..36 for every nakshatra-pada pair and each koota within its max", () => {
    for (let a = 0; a < 108; a++) for (let b = 0; b < 108; b++) {
      const r = ashtakoota(moon(Math.floor(a / 4), (a % 4) + 1), moon(Math.floor(b / 4), (b % 4) + 1));
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(36);
      for (const k of r.kootas) { expect(k.score).toBeGreaterThanOrEqual(0); expect(k.score).toBeLessThanOrEqual(k.max); }
    }
  });
  it("same nakshatra & pada: Nadi 0, Bhakoot 7, Gana 6, Yoni 4", () => {
    const r = ashtakoota(moon(3, 2), moon(3, 2));
    const s = Object.fromEntries(r.kootas.map((k) => [k.name, k.score]));
    expect(s).toMatchObject({ Nadi: 0, Bhakoot: 7, Gana: 6, Yoni: 4, "Graha Maitri": 5 });
  });
  it("Bhakoot 0 for 6/8 Moon signs", () => {
    const r = ashtakoota({ moonLon: 15, nakshatraStable: true }, { moonLon: 7 * 30 + 15, nakshatraStable: true }); // Aries / Scorpio = 1/8
    expect(r.kootas.find((k) => k.name === "Bhakoot")!.score).toBe(0);
  });

  /** Cross-check with PyJHora's precomputed table for kootas whose conventions coincide (Gana, Nadi).
   * Bhakoot is excluded: PyJHora's table scores some 6/8 pairs (e.g. Cancer/Aquarius) as 7; we keep the classical rule. */
  const csv = "tests/fixtures/pyjhora-north-compat.csv";
  it.runIf(fs.existsSync(csv))("agrees with PyJHora on Gana and Nadi for all 11,664 pairs", () => {
    const rows = fs.readFileSync(csv, "utf8").trim().split("\n").map((l) => l.split(",").map(Number));
    let n = 0;
    for (const [bn, bp, gn, gp, , , gana, , , , , nadi] of rows) {
      const r = ashtakoota(moon(gn - 1, gp), moon(bn - 1, bp)); // CSV is boy,girl → our (bride, groom)
      const s = Object.fromEntries(r.kootas.map((k) => [k.name, k.score]));
      expect([s.Gana, s.Nadi], `${bn}.${bp} × ${gn}.${gp}`).toEqual([gana, nadi]);
      n++;
    }
    expect(n).toBe(11664);
  });
});
