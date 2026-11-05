import * as A from "astronomy-engine";
import { lahiriAyanamsa } from "./ayanamsa";
import { DEG, norm360 } from "./math";
import type { Planet } from "./constants";

/**
 * Astronomical layer. Uses Astronomy Engine (MIT licence, Don Cross) — VSOP87-derived planetary
 * theory and the NAO/Brown lunar theory, with light-time and aberration corrections.
 * Typical accuracy is better than 1 arcminute for the planets and Moon across 1700–2200.
 * Values are regression-tested against Swiss Ephemeris reference fixtures (tests/fixtures).
 */
export const EPHEMERIS = {
  id: "astronomy-engine",
  version: "2.1.19",
  notes: "Geocentric apparent positions (light-time + aberration). Mean lunar node (Meeus 47.7).",
} as const;

const BODIES: Partial<Record<Planet, A.Body>> = {
  Sun: A.Body.Sun,
  Moon: A.Body.Moon,
  Mars: A.Body.Mars,
  Mercury: A.Body.Mercury,
  Jupiter: A.Body.Jupiter,
  Venus: A.Body.Venus,
  Saturn: A.Body.Saturn,
};

export interface TimeContext {
  date: Date;
  time: A.AstroTime;
  jdUT: number;
  jdTT: number;
  /** nutation in longitude, degrees */
  dpsi: number;
  trueObliquity: number;
  ayanamsa: number;
}

export function timeContext(date: Date): TimeContext {
  const time = A.MakeTime(date);
  const tilt = A.e_tilt(time);
  const jdUT = time.ut + 2451545.0;
  const jdTT = time.tt + 2451545.0;
  return {
    date,
    time,
    jdUT,
    jdTT,
    dpsi: tilt.dpsi / 3600,
    trueObliquity: tilt.tobl,
    ayanamsa: lahiriAyanamsa(jdTT),
  };
}

/** Tropical longitude referred to the mean equinox of date (nutation removed). */
function tropicalMeanLongitude(planet: Planet, ctx: TimeContext): { lon: number; lat: number } {
  if (planet === "Rahu" || planet === "Ketu") {
    const T = (ctx.jdTT - 2451545.0) / 36525;
    const omega = norm360(
      125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000,
    );
    return { lon: planet === "Rahu" ? omega : norm360(omega + 180), lat: 0 };
  }
  const body = BODIES[planet]!;
  const vec = A.GeoVector(body, ctx.time, true);
  const ecl = A.Ecliptic(vec); // true ecliptic & equinox of date
  return { lon: norm360(ecl.elon - ctx.dpsi), lat: ecl.elat };
}

export function siderealLongitude(planet: Planet, ctx: TimeContext): number {
  return norm360(tropicalMeanLongitude(planet, ctx).lon - ctx.ayanamsa);
}

export interface BodyPosition {
  planet: Planet;
  longitude: number; // sidereal
  tropicalLongitude: number;
  latitude: number;
  speed: number; // deg/day, sidereal
  retrograde: boolean;
}

export function bodyPosition(planet: Planet, date: Date): BodyPosition {
  const ctx = timeContext(date);
  const { lon, lat } = tropicalMeanLongitude(planet, ctx);
  const h = 1 / 24; // one hour, in days
  const before = siderealLongitude(planet, timeContext(new Date(date.getTime() - h * 86400000)));
  const after = siderealLongitude(planet, timeContext(new Date(date.getTime() + h * 86400000)));
  let diff = after - before;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const speed = diff / (2 * h);
  return {
    planet,
    longitude: norm360(lon - ctx.ayanamsa),
    tropicalLongitude: lon,
    latitude: lat,
    speed,
    // The mean nodes always move backward; for them retrogression is definitional.
    retrograde: planet === "Rahu" || planet === "Ketu" ? true : speed < 0,
  };
}

/** Sidereal ascendant and midheaven for a geographic location. */
export function angles(date: Date, latitude: number, longitude: number) {
  const ctx = timeContext(date);
  const gast = A.SiderealTime(ctx.time); // hours, apparent
  const ramc = norm360(gast * 15 + longitude) * DEG;
  const eps = ctx.trueObliquity * DEG;
  const phi = latitude * DEG;
  const ascTrue = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / DEG;
  const mcTrue = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG;
  const toSid = (x: number) => norm360(x - ctx.dpsi - ctx.ayanamsa);
  return { ascendant: toSid(ascTrue), midheaven: toSid(mcTrue), ayanamsa: ctx.ayanamsa, ctx };
}

/** Most recent sunrise at or before `date` for the observer (null in polar day/night). */
export function previousSunrise(date: Date, latitude: number, longitude: number): Date | null {
  const obs = new A.Observer(latitude, longitude, 0);
  let start = A.MakeTime(new Date(date.getTime() - 1.5 * 86400000));
  let last: Date | null = null;
  for (let i = 0; i < 4; i++) {
    const r = A.SearchRiseSet(A.Body.Sun, obs, +1, start, 2);
    if (!r) return last;
    if (r.date.getTime() > date.getTime()) return last;
    last = r.date;
    start = r.AddDays(0.01);
  }
  return last;
}
