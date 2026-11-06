import type { Planet } from "@/lib/astro/constants";
import type { ChartResult, Placement } from "@/lib/astro/chart";
import type { DashaPeriod } from "@/lib/astro/dasha";
import { activePeriods } from "@/lib/astro/dasha";
import type { TransitSummary } from "@/lib/astro/transits";
import { nextIngress } from "@/lib/astro/transits";
import { bodyPosition } from "@/lib/astro/positions";
import { signOf } from "@/lib/astro/math";
import { DICT, monthYear, ordinal, type AreaKey, type Lang, type Rating } from "./life-guide-i18n";

/**
 * Life Guide — the chart told in plain words, with timing.
 *
 * Every life area gets a timeline from ~12 years ago to ~12 years ahead. Each Vimshottari
 * antardasha is scored for that area by how strongly its two lords (mahadasha + antardasha) are tied
 * to the area's houses and significators (occupation, rulership, karaka) and how well placed they are
 * (dignity, house, combustion). Jupiter's and Saturn's real sign changes over the next years then
 * lift or press particular windows. Output is phrased as traditional Parashari timing — likely
 * tendencies, never certainties — and never covers death, illness diagnosis or pregnancy.
 */

export type { AreaKey, Lang, Rating } from "./life-guide-i18n";
export type Tone = "supportive" | "mixed" | "demanding";

export interface Chapter { lord: Planet; name: string; start: string; end: string; title: string; summary: string; focus: string[]; tone: Tone }
export interface Upcoming { date: string; title: string; text: string; tone: Tone }
export interface Segment { start: string; end: string; rating: Rating; md: Planet; ad: Planet; jupiter?: boolean }
export interface Window { start: string; end: string; rating: Rating; text: string; why: string }
export interface AreaReading {
  key: AreaKey;
  label: string;
  tone: Tone;
  rating: Rating;
  text: string; // prediction for now
  tip: string;
  timeline: Segment[];
  past: Window[];
  next: Window[];
}
export interface Remedy { planet: Planet; name: string; why: string; habits: string[]; traditional: { day: string; mantra: string; colour: string; giving: string }; gemstoneNote: string }
export interface LifeGuide {
  lang: Lang;
  name: string;
  headline: string;
  past: Chapter[];
  present: { chapter: Chapter; sub: Chapter | null; skyNow: string[] };
  future: Upcoming[];
  areas: AreaReading[];
  remedies: Remedy[];
  basis: "lagna" | "moon";
  caveat: string | null;
  range: { start: string; end: string };
}

/** Slow-planet sign windows (from transit ingresses), computed once per day and cached by the caller. */
export interface SignWindow { planet: "Jupiter" | "Saturn"; sign: number; start: string; end: string }

const AREA_DEF: Record<AreaKey, { houses: number[]; karakas: Planet[] }> = {
  career: { houses: [10, 6], karakas: ["Sun", "Saturn", "Mercury"] },
  business: { houses: [7, 10, 11, 3], karakas: ["Mercury", "Jupiter"] },
  love: { houses: [7, 5], karakas: ["Venus", "Moon"] },
  family: { houses: [4, 2], karakas: ["Moon", "Jupiter"] },
  money: { houses: [2, 11], karakas: ["Jupiter", "Venus"] },
  fortune: { houses: [9, 5], karakas: ["Jupiter", "Sun"] },
  health: { houses: [1, 6], karakas: ["Sun", "Moon"] },
  learning: { houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"] },
};
const AREA_KEYS = Object.keys(AREA_DEF) as AreaKey[];
const NATURE: Record<Planet, "benefic" | "malefic"> = { Sun: "malefic", Moon: "benefic", Mars: "malefic", Mercury: "benefic", Jupiter: "benefic", Venus: "benefic", Saturn: "malefic", Rahu: "malefic", Ketu: "malefic" };
const MANTRA: Record<Planet, string> = { Sun: "Om Suryaya Namah", Moon: "Om Somaya Namah", Mars: "Om Mangalaya Namah", Mercury: "Om Budhaya Namah", Jupiter: "Om Gurave Namah", Venus: "Om Shukraya Namah", Saturn: "Om Shanaye Namah", Rahu: "Om Rahave Namah", Ketu: "Om Ketave Namah" };
const MANTRA_HI: Record<Planet, string> = { Sun: "ॐ सूर्याय नमः", Moon: "ॐ सोमाय नमः", Mars: "ॐ मंगलाय नमः", Mercury: "ॐ बुधाय नमः", Jupiter: "ॐ गुरवे नमः", Venus: "ॐ शुक्राय नमः", Saturn: "ॐ शनये नमः", Rahu: "ॐ राहवे नमः", Ketu: "ॐ केतवे नमः" };
const YEAR = 365.25 * 86400000;

const pl = (c: ChartResult, p: Planet): Placement => c.placements.find((x) => x.planet === p)!;
const houseOf = (c: ChartResult, p: Planet) => pl(c, p).house ?? pl(c, p).houseFromMoon;
const ruled = (c: ChartResult, p: Planet) => (c.houses ? c.houses.filter((h) => h.lord === p).map((h) => h.house) : []);
const year = (iso: string) => new Date(iso).getUTCFullYear();

function quality(c: ChartResult, p: Planet): number {
  const x = pl(c, p), h = houseOf(c, p);
  let s = 0;
  if (["exalted", "moolatrikona", "own"].includes(x.dignity)) s += 2;
  if (x.dignity === "debilitated") s -= 2;
  if ([1, 4, 5, 7, 9, 10, 11].includes(h)) s += 1;
  if ([6, 8, 12].includes(h)) s -= 1;
  if (x.combust) s -= 1;
  if (NATURE[p] === "benefic") s += 1;
  const r = ruled(c, p);
  if (r.some((n) => [5, 9].includes(n))) s += 1;
  if (r.length && r.every((n) => [6, 8, 12].includes(n))) s -= 1;
  return s;
}
const toneOf = (c: ChartResult, p: Planet): Tone => { const q = quality(c, p); return q >= 2 ? "supportive" : q <= -1 ? "demanding" : "mixed"; };
const ratingTone = (r: Rating): Tone => (r === "strong" ? "supportive" : r === "challenging" ? "demanding" : "mixed");

/** How strongly a planet is tied to an area (0–4.5). */
function relevance(c: ChartResult, p: Planet, area: AreaKey) {
  const d = AREA_DEF[area];
  let r = 0;
  if (d.houses.includes(houseOf(c, p))) r += 2;
  r += Math.min(2, ruled(c, p).filter((h) => d.houses.includes(h)).length * 1.25);
  if (d.karakas.includes(p)) r += 0.75;
  return Math.min(4.5, r);
}

/** Jupiter / Saturn sign windows from `from` for `years`, by stepping through real ingresses. */
export function slowSignWindows(from: Date, years = 8): SignWindow[] {
  const out: SignWindow[] = [];
  for (const planet of ["Jupiter", "Saturn"] as const) {
    let t = from, sign = signOf(bodyPosition(planet, from).longitude), start = from.toISOString();
    const stop = from.getTime() + years * YEAR;
    for (let guard = 0; guard < 40 && t.getTime() < stop; guard++) {
      const n = nextIngress(planet, t, 1200);
      if (!n) break;
      out.push({ planet, sign, start, end: n.at.toISOString() });
      sign = n.toSign; start = n.at.toISOString(); t = new Date(n.at.getTime() + 86400000);
    }
    out.push({ planet, sign, start, end: new Date(stop).toISOString() });
  }
  return out;
}

function areaTimeline(c: ChartResult, area: AreaKey, from: number, to: number, windows: SignWindow[]): Segment[] {
  const subs = c.dasha.mahadashas.flatMap((m) => (m.children ?? []).map((a) => ({ md: m.lord, ad: a })));
  const segs: Segment[] = [];
  const houses = AREA_DEF[area].houses;
  const fromMoon = (sign: number) => ((sign - c.moonSign.sign + 12) % 12) + 1;
  const fromLagna = (sign: number) => (c.lagna ? ((sign - c.lagna.sign + 12) % 12) + 1 : null);
  for (const { md, ad } of subs) {
    const s = Date.parse(ad.start), e = Date.parse(ad.end);
    if (e < from || s > to) continue;
    const rMd = relevance(c, md, area), rAd = relevance(c, ad.lord, area);
    let act = 0.6 * rMd + rAd;
    let pol = (0.6 * rMd * Math.sign(quality(c, md)) + rAd * Math.sign(quality(c, ad.lord))) / Math.max(act, 1);
    // slow transits overlapping this sub-period
    let jup = false;
    for (const w of windows) {
      const ws = Date.parse(w.start), we = Date.parse(w.end);
      if (we < s || ws > e) continue;
      const overlap = (Math.min(we, e) - Math.max(ws, s)) / Math.max(1, e - s);
      if (overlap < 0.3) continue;
      const hM = fromMoon(w.sign), hL = fromLagna(w.sign);
      const hits = houses.includes(hM) || (hL !== null && houses.includes(hL));
      if (w.planet === "Jupiter" && hits) { act += 1; pol += 0.35; jup = true; }
      if (w.planet === "Saturn" && hits) { act += 0.8; pol += [3, 6, 11].includes(hM) ? 0.2 : -0.3; }
    }
    const rating: Rating = act < 1.75 ? "quiet" : act >= 2 && pol >= 0.45 ? "strong" : pol <= -0.2 ? "challenging" : "active";
    segs.push({ start: new Date(Math.max(s, from)).toISOString(), end: new Date(Math.min(e, to)).toISOString(), rating, md, ad: ad.lord, ...(jup ? { jupiter: true } : {}) });
  }
  return segs;
}

/** Merge adjacent segments with the same rating into readable windows. */
function mergeWindows(segs: Segment[]) {
  const out: (Segment & { lords: string[] })[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    // merge only within the same main period and up to ~4 years, so windows stay specific
    if (last && last.rating === s.rating && last.md === s.md && Date.parse(s.end) - Date.parse(last.start) <= 4 * YEAR) { last.end = s.end; last.lords.push(`${s.md}-${s.ad}`); last.jupiter ||= s.jupiter; }
    else out.push({ ...s, lords: [`${s.md}-${s.ad}`] });
  }
  return out;
}

export function lifeGuide(chart: ChartResult, transits: TransitSummary, name: string, now = new Date(), lang: Lang = "en", windows?: SignWindow[]): LifeGuide | null {
  const D = DICT[lang];
  const act = activePeriods(chart.dasha, now);
  if (!act.mahadasha) return null;
  const pn = (p: Planet) => D.planet[p];
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${D.t.and} ${xs[xs.length - 1]}`);
  const birth = Date.parse(chart.input.utc);
  const nowMs = now.getTime();
  const from = Math.max(birth, nowMs - 12 * YEAR), to = nowMs + 12 * YEAR;
  const sw = windows ?? slowSignWindows(now, 8);

  const chapterOf = (d: DashaPeriod): Chapter => {
    const h = houseOf(chart, d.lord);
    const rules = ruled(chart, d.lord).filter((x) => x !== h);
    const focus = AREA_KEYS.filter((k) => relevance(chart, d.lord, k) >= 2).slice(0, 3).map((k) => D.area[k]);
    return {
      lord: d.lord, name: pn(d.lord), start: Date.parse(d.start) < birth ? chart.input.utc : d.start, end: d.end, title: D.title[d.lord],
      summary: D.t.chapterSummary(pn(d.lord), D.gist[d.lord], D.house[h], rules.length ? D.t.rulesJoin(list(rules.map((r) => D.house[r]))) : ""),
      focus, tone: toneOf(chart, d.lord),
    };
  };

  const present = chapterOf(act.mahadasha);
  const sub = act.antardasha ? chapterOf(act.antardasha) : null;
  const past = chart.dasha.mahadashas.filter((m) => Date.parse(m.end) <= nowMs).map(chapterOf);

  // --- sky now (slow transits from the Moon)
  const get = (p: Planet) => transits.placements.find((x) => x.planet === p)!;
  const jup = get("Jupiter").houseFromMoon, sat = get("Saturn").houseFromMoon, rahu = get("Rahu").houseFromMoon;
  const skyNow: string[] = [];
  skyNow.push([2, 5, 7, 9, 11].includes(jup) ? D.t.jupGood(D.house[jup]) : D.t.jupOther(ordinal(lang, jup), D.house[jup]));
  if (transits.sadeSati?.active && transits.sadeSati.phase) skyNow.push(D.t.sadeSati(D.t.phase[transits.sadeSati.phase]));
  else if ([3, 6, 11].includes(sat)) skyNow.push(D.t.satGood);
  else if ([4, 8].includes(sat)) skyNow.push(D.t.satHard(ordinal(lang, sat), sat === 4 ? D.t.satHome : D.t.satResilience));
  else skyNow.push(D.t.satOther(ordinal(lang, sat), D.house[sat]));
  if ([3, 6, 11].includes(rahu)) skyNow.push(D.t.rahuGood);

  // --- per-area timelines with predictions
  const areas: AreaReading[] = AREA_KEYS.map((key) => {
    const timeline = areaTimeline(chart, key, from, to, sw);
    const cur = timeline.find((s) => Date.parse(s.start) <= nowMs && nowMs < Date.parse(s.end)) ?? timeline[0];
    const rating: Rating = cur?.rating ?? "quiet";
    const merged = mergeWindows(timeline);
    const why = (w: (typeof merged)[number]) => `${w.lords.slice(0, 2).map((l) => D.t.periodOf(pn(l.split("-")[0] as Planet), pn(l.split("-")[1] as Planet))).join(", ")}${w.jupiter ? ` · ${D.t.jupiterWindow(D.area[key])}` : ""}`;
    const toWin = (w: (typeof merged)[number]): Window => ({ start: w.start, end: w.end, rating: w.rating, text: D.predict[key][w.rating], why: why(w) });
    const notable = (w: (typeof merged)[number]) => w.rating === "strong" || w.rating === "challenging";
    const pastW = merged.filter((w) => Date.parse(w.end) <= nowMs && notable(w)).slice(-3).reverse().map(toWin);
    const nextW = merged.filter((w) => Date.parse(w.start) > nowMs && w.rating !== "quiet").slice(0, 4).map(toWin);
    return { key, label: D.area[key], tone: ratingTone(rating), rating, text: D.predict[key][rating], tip: D.tip[key][rating === "quiet" ? "active" : rating], timeline, past: pastW, next: nextW };
  });

  // --- what's coming (life-wide events)
  const future: Upcoming[] = [];
  const subs = chart.dasha.mahadashas.flatMap((m) => m.children ?? []).filter((d) => Date.parse(d.start) > nowMs && Date.parse(d.start) < nowMs + 3 * YEAR).slice(0, 3);
  for (const s of subs) future.push({ date: s.start, title: D.t.subBegins(pn(s.lord)), text: D.t.subText(monthYear(lang, s.start), D.gist[s.lord], D.house[houseOf(chart, s.lord)]), tone: toneOf(chart, s.lord) });
  const nextMd = chart.dasha.mahadashas.find((m) => Date.parse(m.start) >= Date.parse(act.mahadasha!.end));
  if (nextMd) future.push({ date: nextMd.start, title: D.t.newChapter(pn(nextMd.lord)), text: D.t.newChapterText(year(nextMd.start), D.title[nextMd.lord]), tone: toneOf(chart, nextMd.lord) });
  for (const ing of transits.ingresses.filter((i) => i.planet !== "Mars")) {
    const toIdx = DICT.en.signs.indexOf(ing.toSign);
    if (toIdx < 0) continue;
    const h = ((toIdx - chart.moonSign.sign + 12) % 12) + 1;
    let tone: Tone = "mixed", text: string;
    if (ing.planet === "Jupiter") { tone = [2, 5, 7, 9, 11].includes(h) ? "supportive" : "mixed"; text = tone === "supportive" ? D.t.jupEnterGood(D.house[h]) : D.t.jupEnterOther(D.house[h]); }
    else if (ing.planet === "Saturn") { tone = [3, 6, 11].includes(h) ? "supportive" : [12, 1, 2, 4, 8].includes(h) ? "demanding" : "mixed"; text = h === 12 ? D.t.satEnter12 : h === 1 ? D.t.satEnter1 : h === 2 ? D.t.satEnter2 : tone === "supportive" ? D.t.satEnterGood : D.t.satEnterOther(D.house[h]); }
    else { tone = [3, 6, 11].includes(h) ? "supportive" : "mixed"; text = D.t.rahuEnter(D.house[h]); }
    future.push({ date: ing.at, title: D.t.enters(pn(ing.planet), D.signs[toIdx]), text, tone });
  }
  future.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  // --- remedies for the planets running life now
  const focus: Planet[] = [act.mahadasha.lord];
  if (act.antardasha && act.antardasha.lord !== act.mahadasha.lord) focus.push(act.antardasha.lord);
  if (transits.sadeSati?.active && !focus.includes("Saturn")) focus.push("Saturn");
  const remedies: Remedy[] = focus.map((p, i) => ({
    planet: p,
    name: pn(p),
    why: i === 0 ? D.t.remedyMain(pn(p), year(act.mahadasha!.end)) : p === "Saturn" && transits.sadeSati?.active && act.antardasha?.lord !== "Saturn" ? D.t.remedySadeSati : D.t.remedySub(pn(p), monthYear(lang, act.antardasha!.end)),
    habits: D.habits[p],
    traditional: { day: D.day[p], mantra: lang === "hi" ? MANTRA_HI[p] : MANTRA[p], colour: D.colour[p], giving: D.giving[p] },
    gemstoneNote: `${D.stone[p]} · ${D.t.gemCaution}`,
  }));

  const first = name.split(" ")[0];
  const headline = D.t.headline(first, D.t.mood[present.tone], present.title, year(present.start), year(present.end)) + (sub ? D.t.headlineSub(sub.name, D.gist[sub.lord].split(",")[0], monthYear(lang, sub.end)) : "");

  return {
    lang, name: first, headline, past, present: { chapter: present, sub, skyNow }, future: future.slice(0, 6), areas, remedies,
    basis: chart.lagna ? "lagna" : "moon",
    caveat: chart.confidence.dashaTimingReliable ? null : D.t.caveat,
    range: { start: new Date(from).toISOString(), end: new Date(to).toISOString() },
  };
}
