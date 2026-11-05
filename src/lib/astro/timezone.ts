/**
 * Historical local-time → UTC conversion using the IANA tz database shipped with the runtime's ICU.
 * Detects ambiguous (repeated, e.g. DST fall-back) and nonexistent (skipped, DST spring-forward)
 * wall-clock times instead of silently guessing.
 */

export interface LocalDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second?: number;
}

export interface ResolvedInstant {
  utc: Date;
  offsetMinutes: number; // local − UTC, may be fractional for LMT-era offsets
  status: "ok" | "ambiguous" | "nonexistent";
  /** For ambiguous times: both possible instants (earlier first). */
  alternatives?: { utc: string; offsetMinutes: number }[];
  note?: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      era: "short",
    });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    fmt(tz);
    return true;
  } catch {
    return false;
  }
}

/** Offset (minutes, local − UTC) in effect in `tz` at the UTC instant `ms`. Second-precision. */
export function offsetAt(tz: string, ms: number): number {
  const parts = Object.fromEntries(fmt(tz).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  let year = Number(parts.year);
  if (parts.era === "BC" || parts.era === "B") year = 1 - year;
  const asUtc = Date.UTC(year, Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  const floored = Math.floor(ms / 1000) * 1000;
  const d = new Date(asUtc);
  if (year >= 0 && year < 100) d.setUTCFullYear(year);
  return (d.getTime() - floored) / 60000;
}

function wallMs(l: LocalDateTime) {
  const d = new Date(Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute, l.second ?? 0));
  if (l.year >= 0 && l.year < 100) d.setUTCFullYear(l.year);
  return d.getTime();
}

export function validateLocal(l: LocalDateTime): string | null {
  const ms = wallMs(l);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== l.year || d.getUTCMonth() !== l.month - 1 || d.getUTCDate() !== l.day) return "Invalid calendar date";
  if (l.hour < 0 || l.hour > 23 || l.minute < 0 || l.minute > 59) return "Invalid time";
  return null;
}

export function localToUtc(l: LocalDateTime, tz: string): ResolvedInstant {
  const wall = wallMs(l);
  const candidates = new Set<number>();
  for (const probe of [-36, -12, 0, 12, 36]) candidates.add(offsetAt(tz, wall + probe * 3600000));
  const valid: { utc: number; off: number }[] = [];
  for (const off of candidates) {
    const utc = wall - off * 60000;
    if (Math.abs(offsetAt(tz, utc) - off) < 1e-9) valid.push({ utc, off });
  }
  valid.sort((a, b) => a.utc - b.utc);
  const uniq = valid.filter((v, i) => i === 0 || v.utc !== valid[i - 1].utc);
  if (uniq.length === 1) {
    return { utc: new Date(uniq[0].utc), offsetMinutes: uniq[0].off, status: "ok" };
  }
  if (uniq.length > 1) {
    return {
      utc: new Date(uniq[0].utc),
      offsetMinutes: uniq[0].off,
      status: "ambiguous",
      alternatives: uniq.map((u) => ({ utc: new Date(u.utc).toISOString(), offsetMinutes: u.off })),
      note: "This local time occurred twice (clocks were set back). The earlier occurrence is used unless you choose otherwise.",
    };
  }
  // Nonexistent: the wall time fell in a gap. Use the offset in effect before the transition,
  // which maps the time forward past the gap (the RFC 5545 / java.time convention).
  const before = offsetAt(tz, wall - 36 * 3600000);
  return {
    utc: new Date(wall - before * 60000),
    offsetMinutes: before,
    status: "nonexistent",
    note: "This local time did not exist on this date (clocks were moved forward). Please double-check the recorded birth time.",
  };
}

export function formatOffset(min: number) {
  const sign = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = Math.floor(a % 60);
  const s = Math.round((a * 60) % 60);
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}${s ? `:${String(s).padStart(2, "0")}` : ""}`;
}
