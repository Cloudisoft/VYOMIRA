import { DEG, mul, mulVec, rotX, rotY, rotZ, transpose } from "./math";

/**
 * Lahiri (Chitrapaksha) ayanamsa.
 *
 * Definition used (identical to the Swiss Ephemeris SE_SIDM_LAHIRI definition):
 *   reference epoch t0 = JD 2435553.5 (TT), ayanamsa(t0) = 23.250182778° − 0.004658035° = 23.245524743°,
 *   precession model IAU 1976 (Lieske et al. 1977).
 *
 * Method: the mean vernal point of date t is precessed into the mean equator/ecliptic of t0 and its
 * ecliptic longitude there is measured. ayanamsa(t) = ayanamsa(t0) − λ(t0-frame of the date-t equinox).
 * This is a mean ayanamsa (no nutation). Sidereal longitudes are therefore computed from
 * mean-equinox-of-date tropical longitudes.
 */
export const LAHIRI = { id: "lahiri-iau1976", t0: 2435553.5, ayanT0: 23.245524743 } as const;

const ASEC = DEG / 3600;

/** IAU 1976 precession matrix from J2000 mean equator to the mean equator of date (T centuries TT). */
function precessionMatrix(T: number) {
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) * ASEC;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) * ASEC;
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) * ASEC;
  return mul(rotZ(-z), mul(rotY(theta), rotZ(-zeta)));
}

/** IAU 1976 mean obliquity (degrees). */
export function meanObliquity1976(T: number) {
  return (84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T ** 3) / 3600;
}

export function lahiriAyanamsa(jdTT: number): number {
  const T = (jdTT - 2451545.0) / 36525;
  const T0 = (LAHIRI.t0 - 2451545.0) / 36525;
  // vernal point of date, in the mean equatorial frame of date
  const vDate = [1, 0, 0];
  const vJ2000 = mulVec(transpose(precessionMatrix(T)), vDate);
  const vT0 = mulVec(precessionMatrix(T0), vJ2000);
  const ecl = mulVec(rotX(meanObliquity1976(T0) * DEG), vT0);
  const lon = Math.atan2(ecl[1], ecl[0]) / DEG;
  return LAHIRI.ayanT0 - lon;
}
