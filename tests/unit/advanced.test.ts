import { describe, expect, it } from "vitest";
import fx from "../fixtures/jhora-reference.json";
import { VARGA_RULES } from "@/lib/astro/varga";
import { ashtakavarga, AV_PLANETS } from "@/lib/astro/ashtakavarga";
import { trueNodeSidereal } from "@/lib/astro/nodes";
import { westernChart } from "@/lib/astro/western";
import { angles, bodyPosition } from "@/lib/astro/positions";
import { PLANETS } from "@/lib/astro/constants";

const arcsec = (a: number, b: number) => { let d = a - b; if (d > 180) d -= 360; if (d < -180) d += 360; return Math.abs(d) * 3600; };
const dateOf = (u: number[]) => new Date(Date.UTC(u[0], u[1] - 1, u[2]) + u[3] * 3600000);
const nearCusp = (lon: number, n: number) => { const w = 30 / n; const r = (lon % 30) % w; return r < 0.01 || w - r < 0.01; };

describe("divisional charts vs PyJHora", () => {
  for (const c of fx.cases) {
    it(`${c.id}`, () => {
      const d = dateOf(c.utc);
      const lons: Record<string, number> = Object.fromEntries(PLANETS.map((p) => [p, bodyPosition(p, d).longitude]));
      lons.Lagna = angles(d, c.lat, c.lon).ascendant;
      // PyJHora uses the true node; compare like with like.
      lons.Rahu = trueNodeSidereal(d);
      lons.Ketu = (lons.Rahu + 180) % 360;
      for (const [k, row] of Object.entries(c.vargas)) {
        for (const [body, sign] of Object.entries(row as Record<string, number>)) {
          if (nearCusp(lons[body], Number(k.slice(1)))) continue; // within 36″ of a division boundary — ephemeris noise
          expect(VARGA_RULES[k].fn(lons[body]), `${k} ${body}`).toBe(sign);
        }
      }
    });
  }
});

describe("ashtakavarga", () => {
  for (const c of fx.cases) {
    it(`${c.id} matches PyJHora and sums to 337`, () => {
      const d = dateOf(c.utc);
      const sign = (l: number) => Math.floor(l / 30);
      const s = Object.fromEntries(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].map((p) => [p, sign(bodyPosition(p as never, d).longitude)]));
      const r = ashtakavarga({ ...(s as Record<string, number>), Lagna: sign(angles(d, c.lat, c.lon).ascendant) } as Parameters<typeof ashtakavarga>[0]);
      expect(r.sav.reduce((a, b) => a + b, 0)).toBe(337);
      // PyJHora uses variant bindu tables for the Moon (from Moon, Mars, Jupiter) and Venus (from Mars);
      // VYOMIRA follows BPHS as published by B.V. Raman. Planets whose tables agree must match exactly.
      AV_PLANETS.forEach((p, i) => { if (p !== "Moon" && p !== "Venus") expect(r.bav[p], p).toEqual(c.ashtakavarga.bav[i]); });
      expect(r.totals).toEqual({ Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 });
    });
  }
});

describe("true node vs Swiss Ephemeris", () => {
  for (const c of fx.cases) it(`${c.id}`, () => expect(arcsec(trueNodeSidereal(dateOf(c.utc)), c.trueNodeSidereal)).toBeLessThan(120)); // osculating node is velocity-sensitive; observed ≤ 63″
});

describe("western tropical + Placidus vs Swiss Ephemeris", () => {
  for (const c of fx.cases) {
    it(`${c.id}`, () => {
      const w = westernChart(dateOf(c.utc), c.lat, c.lon, true);
      for (const [b, lon] of Object.entries(c.tropical)) expect(arcsec(w.positions.find((p) => p.body === b)!.longitude, lon as number), b).toBeLessThan(30);
      if (c.placidus) {
        expect(arcsec(w.ascendant!, c.placidus.asc)).toBeLessThan(30);
        expect(arcsec(w.midheaven!, c.placidus.mc)).toBeLessThan(30);
        w.cusps!.forEach((cu, i) => expect(arcsec(cu, c.placidus!.cusps[i]), `cusp ${i + 1}`).toBeLessThan(30));
      }
    });
  }
});
