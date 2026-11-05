import { NAKSHATRA_SPAN, VIMSHOTTARI_ORDER, VIMSHOTTARI_TOTAL_YEARS, type Planet } from "./constants";
import { norm360 } from "./math";

/** Convention: one dasha year = 365.25 days (Julian year). Versioned in ComputationVersion. */
export const DASHA_YEAR_DAYS = 365.25;
const YEAR_MS = DASHA_YEAR_DAYS * 86400000;

export interface DashaPeriod {
  level: 1 | 2 | 3;
  lord: Planet;
  start: string;
  end: string;
  years: number;
  children?: DashaPeriod[];
}

export interface VimshottariResult {
  birthNakshatraLord: Planet;
  balanceAtBirth: { lord: Planet; years: number; months: number; days: number; totalYears: number };
  mahadashas: DashaPeriod[];
}

const idx = (p: Planet) => VIMSHOTTARI_ORDER.findIndex((d) => d.lord === p);
const yearsOf = (p: Planet) => VIMSHOTTARI_ORDER[idx(p)].years;

export function subPeriods(parentLord: Planet, startMs: number, parentYears: number, level: 2 | 3): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let t = startMs;
  const s = idx(parentLord);
  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(s + i) % 9].lord;
    const yrs = (parentYears * yearsOf(lord)) / VIMSHOTTARI_TOTAL_YEARS;
    const end = t + yrs * YEAR_MS;
    out.push({ level, lord, start: new Date(t).toISOString(), end: new Date(end).toISOString(), years: yrs });
    t = end;
  }
  return out;
}

/**
 * Vimshottari dasha from the sidereal Moon longitude. The first mahadasha is computed in full from
 * its theoretical start (before birth) so that antardashas fall on their conventional dates.
 */
export function vimshottari(moonLon: number, birth: Date, opts: { pratyantar?: boolean } = {}): VimshottariResult {
  const lon = norm360(moonLon);
  const nak = Math.floor(lon / NAKSHATRA_SPAN);
  const traversed = (lon - nak * NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  const first = VIMSHOTTARI_ORDER[nak % 9];
  const balanceYears = first.years * (1 - traversed);
  let t = birth.getTime() - first.years * traversed * YEAR_MS;
  const s = nak % 9;
  const mahadashas: DashaPeriod[] = [];
  for (let i = 0; i < 9; i++) {
    const { lord, years } = VIMSHOTTARI_ORDER[(s + i) % 9];
    const end = t + years * YEAR_MS;
    const children = subPeriods(lord, t, years, 2);
    if (opts.pratyantar) for (const c of children) c.children = subPeriods(c.lord, Date.parse(c.start), c.years, 3);
    mahadashas.push({ level: 1, lord, start: new Date(t).toISOString(), end: new Date(end).toISOString(), years, children });
    t = end;
  }
  const y = Math.floor(balanceYears);
  const mFloat = (balanceYears - y) * 12;
  const m = Math.floor(mFloat);
  const d = Math.round((mFloat - m) * 30);
  return {
    birthNakshatraLord: first.lord,
    balanceAtBirth: { lord: first.lord, years: y, months: m, days: d, totalYears: balanceYears },
    mahadashas,
  };
}

export function activePeriods(result: VimshottariResult, at: Date) {
  const t = at.getTime();
  const inP = (p: DashaPeriod) => Date.parse(p.start) <= t && t < Date.parse(p.end);
  const md = result.mahadashas.find(inP) ?? null;
  const ad = md?.children?.find(inP) ?? null;
  const pd = ad?.children?.find(inP) ?? (ad ? subPeriods(ad.lord, Date.parse(ad.start), ad.years, 3).find(inP) ?? null : null);
  return { mahadasha: md, antardasha: ad, pratyantardasha: pd };
}
