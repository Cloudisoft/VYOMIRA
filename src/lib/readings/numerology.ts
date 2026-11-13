/**
 * Deterministic numerology engine. No AI involved: every number here is reproducible from the
 * name and date of birth, and covered by unit tests (tests/unit/numerology.test.ts).
 *
 * Conventions (stated in every report):
 * - Pythagorean (default): A–I = 1–9, J–R = 1–9, S–Z = 1–8. Master numbers 11, 22, 33 are kept.
 * - Chaldean: traditional Chaldean table (no letter has 9). Name totals are shown as a compound
 *   number and reduced to a single digit; master numbers are not kept for name numbers.
 * - Vowels are A E I O U. Y is treated as a consonant.
 * - Life Path reduces month, day and year separately, then reduces their sum (masters kept).
 * - Personal Year = reduce(month) + reduce(day) + reduce(target year), reduced to 1–9.
 * - Lo Shu grid uses the non-zero digits of the full date of birth (DD MM YYYY).
 */
export type NumerologyMethod = "pythagorean" | "chaldean";

const PYTH: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c, i) => { PYTH[c] = (i % 9) + 1; });

const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
export const MASTER = new Set([11, 22, 33]);

export const digitSum = (n: number) => String(Math.abs(Math.trunc(n))).split("").reduce((s, d) => s + Number(d), 0);

/** Reduce to a single digit; optionally stop at master numbers 11/22/33. */
export function reduce(n: number, keepMasters = true): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9 && !(keepMasters && MASTER.has(x))) x = digitSum(x);
  return x;
}

/** Uppercase A–Z only (accents stripped, other characters dropped). */
export function normalizeName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
}

export function letterValue(ch: string, method: NumerologyMethod) {
  return (method === "chaldean" ? CHALDEAN : PYTH)[ch] ?? 0;
}

export interface NameNumber { compound: number; value: number; letters: { ch: string; v: number }[] }

function nameNumber(name: string, method: NumerologyMethod, filter: (ch: string) => boolean): NameNumber {
  const letters = normalizeName(name).split("").filter(filter).map((ch) => ({ ch, v: letterValue(ch, method) }));
  const compound = letters.reduce((s, l) => s + l.v, 0);
  return { compound, value: reduce(compound, method === "pythagorean"), letters };
}

export interface DateParts { year: number; month: number; day: number }

export function parseDob(dob: string): DateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) throw new Error("Date of birth must be YYYY-MM-DD");
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) throw new Error("Invalid date of birth");
  return { year, month, day };
}

export function lifePath(d: DateParts) {
  const parts = { month: reduce(d.month), day: reduce(d.day), year: reduce(d.year) };
  return { parts, compound: parts.month + parts.day + parts.year, value: reduce(parts.month + parts.day + parts.year) };
}

export function birthdayNumber(d: DateParts) {
  return { day: d.day, value: reduce(d.day) };
}

export function personalYear(d: DateParts, targetYear: number) {
  return reduce(reduce(d.month, false) + reduce(d.day, false) + reduce(targetYear, false), false);
}

/** Lo Shu magic square layout (rows top→bottom). */
export const LO_SHU_LAYOUT = [[4, 9, 2], [3, 5, 7], [8, 1, 6]] as const;

export function loShu(d: DateParts) {
  const digits = `${String(d.day).padStart(2, "0")}${String(d.month).padStart(2, "0")}${d.year}`.split("").map(Number).filter((x) => x > 0);
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  digits.forEach((x) => { counts[x]++; });
  const missing = Object.keys(counts).map(Number).filter((k) => counts[k] === 0);
  const repeated = Object.keys(counts).map(Number).filter((k) => counts[k] > 1).map((n) => ({ n, count: counts[n] }));
  const planes = {
    mental: [4, 9, 2], emotional: [3, 5, 7], practical: [8, 1, 6],
    thought: [4, 3, 8], will: [9, 5, 1], action: [2, 7, 6],
  } as const;
  const completeArrows = (Object.keys(planes) as (keyof typeof planes)[]).filter((k) => planes[k].every((n) => counts[n] > 0));
  const emptyArrows = (Object.keys(planes) as (keyof typeof planes)[]).filter((k) => planes[k].every((n) => counts[n] === 0));
  return { digits, counts, missing, repeated, completeArrows, emptyArrows, grid: LO_SHU_LAYOUT.map((r) => r.map((n) => ({ n, count: counts[n] }))) };
}

export interface NumerologyProfile {
  method: NumerologyMethod;
  name: string;
  dob: string;
  targetYear: number;
  lifePath: ReturnType<typeof lifePath>;
  expression: NameNumber;
  soulUrge: NameNumber;
  personality: NameNumber;
  birthday: ReturnType<typeof birthdayNumber>;
  personalYear: number;
  loShu: ReturnType<typeof loShu>;
  conventions: string[];
}

export function numerologyProfile(input: { name: string; dob: string; method?: NumerologyMethod; targetYear?: number }): NumerologyProfile {
  const method = input.method ?? "pythagorean";
  if (!normalizeName(input.name)) throw new Error("Name must contain letters");
  const d = parseDob(input.dob);
  const targetYear = input.targetYear ?? new Date().getUTCFullYear();
  return {
    method,
    name: input.name.trim(),
    dob: input.dob,
    targetYear,
    lifePath: lifePath(d),
    expression: nameNumber(input.name, method, () => true),
    soulUrge: nameNumber(input.name, method, (c) => VOWELS.has(c)),
    personality: nameNumber(input.name, method, (c) => !VOWELS.has(c)),
    birthday: birthdayNumber(d),
    personalYear: personalYear(d, targetYear),
    loShu: loShu(d),
    conventions: [
      method === "pythagorean" ? "Pythagorean letter values (A–I = 1–9, J–R = 1–9, S–Z = 1–8); master numbers 11, 22 and 33 are kept." : "Chaldean letter values (no letter carries 9); name totals are shown as compound numbers and reduced to one digit.",
      "Vowels are A, E, I, O, U; Y is treated as a consonant.",
      "Life Path reduces the month, day and year separately and then reduces their sum.",
      `Personal Year is calculated for ${targetYear}.`,
      "The Lo Shu grid uses the non-zero digits of your full date of birth.",
    ],
  };
}
