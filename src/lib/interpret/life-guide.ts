import type { Planet } from "@/lib/astro/constants";
import type { ChartResult, Placement } from "@/lib/astro/chart";
import type { DashaPeriod } from "@/lib/astro/dasha";
import { activePeriods } from "@/lib/astro/dasha";
import type { TransitSummary } from "@/lib/astro/transits";

/**
 * Life Guide — the chart told in plain words: past chapters, the present, what's coming, how each
 * area of life looks right now, and what you can do. Deterministic and grounded only in computed
 * chart facts (dasha periods, house placements and rulerships, dignity, slow transits). It follows
 * traditional Parashari readings and is phrased as guidance, never certainty.
 */

export type Tone = "supportive" | "mixed" | "demanding";
export type AreaKey = "career" | "love" | "money" | "wellbeing" | "home" | "growth";

export interface Chapter {
  lord: Planet;
  start: string;
  end: string;
  title: string;
  summary: string; // one plain sentence
  focus: string[]; // life areas this chapter touches
  tone: Tone;
}
export interface Upcoming { date: string; title: string; text: string; tone: Tone }
export interface AreaReading { key: AreaKey; label: string; tone: Tone; text: string; tip: string }
export interface Remedy {
  planet: Planet;
  why: string;
  habits: string[];
  traditional: { day: string; mantra: string; colour: string; giving: string };
  gemstoneNote: string;
}
export interface LifeGuide {
  name: string;
  headline: string;
  past: Chapter[];
  present: { chapter: Chapter; sub: Chapter | null; skyNow: string[] };
  future: Upcoming[];
  areas: AreaReading[];
  remedies: Remedy[];
  basis: "lagna" | "moon";
  caveat: string | null;
}

const THEMES: Record<Planet, { title: string; gist: string; nature: "benefic" | "malefic" | "neutral" }> = {
  Sun: { title: "Stepping into your own light", gist: "confidence, recognition and taking charge", nature: "malefic" },
  Moon: { title: "Home, heart and feelings", gist: "emotions, family, comfort and connecting with people", nature: "benefic" },
  Mars: { title: "Action, courage and drive", gist: "energy, ambition, property and getting things done", nature: "malefic" },
  Mercury: { title: "Learning, skills and communication", gist: "study, business, writing, networking and quick thinking", nature: "benefic" },
  Jupiter: { title: "Growth, wisdom and opportunity", gist: "learning, good guidance, family growth and expanding horizons", nature: "benefic" },
  Venus: { title: "Love, comfort and creativity", gist: "relationships, beauty, art, luxury and enjoying life", nature: "benefic" },
  Saturn: { title: "Hard work that builds lasting results", gist: "discipline, responsibility, patience and steady progress", nature: "malefic" },
  Rahu: { title: "Big ambitions and new territory", gist: "ambition, technology, foreign connections and unconventional paths", nature: "malefic" },
  Ketu: { title: "Letting go and looking inward", gist: "detachment, intuition, research and spiritual growth", nature: "malefic" },
};

/** What each house means in everyday language. */
const SHORT: Record<number, string> = { 1: "you and your health", 2: "money and family", 3: "courage and skills", 4: "home and peace of mind", 5: "creativity and romance", 6: "daily work and health habits", 7: "partnerships and marriage", 8: "big life changes", 9: "luck and higher learning", 10: "career and reputation", 11: "income and friendships", 12: "travel, rest and spirituality" };

const HOUSE: Record<number, { area: string; areas: AreaKey[] }> = {
  1: { area: "yourself, your health and how you come across", areas: ["wellbeing", "growth"] },
  2: { area: "money, savings, family and the way you speak", areas: ["money", "home"] },
  3: { area: "courage, skills, short trips and siblings", areas: ["career", "growth"] },
  4: { area: "home, mother, property and inner peace", areas: ["home", "wellbeing"] },
  5: { area: "creativity, romance, children and studies", areas: ["love", "growth"] },
  6: { area: "daily work, health habits, competition and loans", areas: ["career", "wellbeing"] },
  7: { area: "partnership, marriage and business deals", areas: ["love", "career"] },
  8: { area: "big changes, shared money and research", areas: ["money", "growth"] },
  9: { area: "luck, higher learning, travel and mentors", areas: ["growth", "career"] },
  10: { area: "career, reputation and public life", areas: ["career"] },
  11: { area: "income, gains, friends and fulfilled wishes", areas: ["money", "love"] },
  12: { area: "travel abroad, expenses, rest and spirituality", areas: ["growth", "money"] },
};

const AREAS: Record<AreaKey, { label: string; houses: number[]; karakas: Planet[]; tips: Record<Tone, string> }> = {
  career: { label: "Career & work", houses: [10, 6, 3], karakas: ["Sun", "Saturn", "Mercury"], tips: { supportive: "Ask for the role, pitch the idea, apply for the promotion — effort is likely to show.", mixed: "Keep delivering steadily; document your wins so they're visible when the timing improves.", demanding: "Focus on skills and reliability rather than big jumps; avoid quitting in frustration." } },
  love: { label: "Love & relationships", houses: [7, 5, 11], karakas: ["Venus", "Moon"], tips: { supportive: "A good time to meet people, commit, or deepen what you have — say what you feel.", mixed: "Small gestures matter more than big promises; listen before you react.", demanding: "Give each other space and patience; avoid decisions made in anger." } },
  money: { label: "Money & finances", houses: [2, 11, 9], karakas: ["Jupiter", "Venus"], tips: { supportive: "Good window to save, invest sensibly or start a side income.", mixed: "Budget carefully and avoid impulse buys; build an emergency fund.", demanding: "Avoid risky bets, lending large sums or new loans; protect what you have." } },
  wellbeing: { label: "Health & energy", houses: [1, 6, 8], karakas: ["Sun", "Moon"], tips: { supportive: "Energy is good — a great time to build a fitness or sleep routine that sticks.", mixed: "Keep a steady routine; rest is productive too.", demanding: "Don't push through exhaustion; regular sleep, simple food and check-ups help." } },
  home: { label: "Home & family", houses: [4, 2], karakas: ["Moon", "Jupiter"], tips: { supportive: "A warm time for family plans, home improvements or moving.", mixed: "Make time for family conversations; small fixes keep peace.", demanding: "Expect some friction at home — patience and clear communication help." } },
  growth: { label: "Learning & inner growth", houses: [9, 5, 12], karakas: ["Jupiter", "Ketu"], tips: { supportive: "Learn something new, travel, find a mentor — growth comes easily now.", mixed: "Read, reflect and journal; clarity builds slowly.", demanding: "A time to slow down, meditate and let go of what no longer fits." } },
};

const REMEDY: Record<Planet, Omit<Remedy, "planet" | "why">> = {
  Sun: { habits: ["Wake early and get morning sunlight", "Take ownership — lead one thing well", "Respect and reconnect with father figures or mentors"], traditional: { day: "Sunday", mantra: "Om Suryaya Namah", colour: "Saffron, gold", giving: "Wheat or jaggery to those in need" }, gemstoneNote: "Ruby is the traditional stone for the Sun." },
  Moon: { habits: ["Protect your sleep and keep a calm evening routine", "Spend time near water or in nature", "Call your mother or someone who nurtures you"], traditional: { day: "Monday", mantra: "Om Somaya Namah", colour: "White, silver", giving: "Rice, milk or white clothes" }, gemstoneNote: "Pearl is the traditional stone for the Moon." },
  Mars: { habits: ["Exercise regularly — channel the energy physically", "Pause before reacting when angry", "Finish one practical project you've been delaying"], traditional: { day: "Tuesday", mantra: "Om Mangalaya Namah", colour: "Red, coral", giving: "Red lentils (masoor) or help someone with physical work" }, gemstoneNote: "Red coral is the traditional stone for Mars." },
  Mercury: { habits: ["Learn a new skill or take a short course", "Write things down and double-check contracts", "Keep your word on small commitments"], traditional: { day: "Wednesday", mantra: "Om Budhaya Namah", colour: "Green", giving: "Green moong dal or books/stationery for students" }, gemstoneNote: "Emerald is the traditional stone for Mercury." },
  Jupiter: { habits: ["Find a mentor — or become one", "Read or study something meaningful each week", "Be generous with knowledge and time"], traditional: { day: "Thursday", mantra: "Om Gurave Namah", colour: "Yellow", giving: "Turmeric, chana dal or support a teacher" }, gemstoneNote: "Yellow sapphire is the traditional stone for Jupiter." },
  Venus: { habits: ["Make time for art, music or beauty", "Appreciate your partner out loud", "Keep spending on comfort within budget"], traditional: { day: "Friday", mantra: "Om Shukraya Namah", colour: "White, pastel pink", giving: "Sweets, perfume or clothes to women in need" }, gemstoneNote: "Diamond or white sapphire is the traditional stone for Venus." },
  Saturn: { habits: ["Build a fixed daily routine and keep it", "Be patient — slow progress is still progress", "Serve others: help elders, workers or the less fortunate"], traditional: { day: "Saturday", mantra: "Om Shanaye Namah", colour: "Dark blue, black", giving: "Mustard oil, black sesame or food to workers" }, gemstoneNote: "Blue sapphire is the traditional stone for Saturn and is considered the most sensitive — never wear it without careful advice." },
  Rahu: { habits: ["Limit screen time and avoid shortcuts", "Ground big ambitions in a written plan", "Stay away from intoxicants and get-rich-quick schemes"], traditional: { day: "Saturday", mantra: "Om Rahave Namah", colour: "Smoky grey", giving: "Help at an animal shelter or donate blankets" }, gemstoneNote: "Hessonite (gomed) is the traditional stone for Rahu." },
  Ketu: { habits: ["Meditate or sit quietly for a few minutes daily", "Declutter — let go of what you don't need", "Follow your intuition, but verify the facts"], traditional: { day: "Tuesday", mantra: "Om Ketave Namah", colour: "Grey, earthy tones", giving: "Feed stray dogs or support a spiritual cause" }, gemstoneNote: "Cat's eye is the traditional stone for Ketu." },
};

const year = (iso: string) => new Date(iso).getUTCFullYear();
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

function placementOf(chart: ChartResult, p: Planet): Placement {
  return chart.placements.find((x) => x.planet === p)!;
}
/** House of a planet — from the Lagna when the birth time is reliable, otherwise from the Moon. */
function houseOf(chart: ChartResult, p: Planet) {
  const pl = placementOf(chart, p);
  return pl.house ?? pl.houseFromMoon;
}
function ruledHouses(chart: ChartResult, p: Planet): number[] {
  return chart.houses ? chart.houses.filter((h) => h.lord === p).map((h) => h.house) : [];
}

/** How easy a planet's period tends to feel, from its dignity, house and nature. */
function toneOf(chart: ChartResult, p: Planet): Tone {
  const pl = placementOf(chart, p);
  const h = houseOf(chart, p);
  let s = 0;
  if (["exalted", "moolatrikona", "own"].includes(pl.dignity)) s += 2;
  if (pl.dignity === "debilitated") s -= 2;
  if ([1, 4, 5, 7, 9, 10, 11].includes(h)) s += 1;
  if ([6, 8, 12].includes(h)) s -= 1;
  if (pl.combust) s -= 1;
  if (THEMES[p].nature === "benefic") s += 1;
  const rules = ruledHouses(chart, p);
  if (rules.some((x) => [5, 9].includes(x))) s += 1;
  if (rules.length && rules.every((x) => [6, 8, 12].includes(x))) s -= 1;
  return s >= 2 ? "supportive" : s <= -1 ? "demanding" : "mixed";
}

function chapterOf(chart: ChartResult, d: DashaPeriod): Chapter {
  const birth = chart.input.utc;
  const h = houseOf(chart, d.lord);
  const rules = ruledHouses(chart, d.lord).filter((x) => x !== h);
  const t = THEMES[d.lord];
  const rulesText = rules.length ? `, and it also shapes ${list(rules.map((r) => SHORT[r]))}` : "";
  const summary = `${d.lord}'s years bring ${t.gist}. In your chart ${d.lord} sits in the area of ${HOUSE[h].area}${rulesText}.`;
  const focus = [...new Set([...HOUSE[h].areas, ...rules.flatMap((r) => HOUSE[r].areas)])].slice(0, 3).map((a) => AREAS[a].label);
  return { lord: d.lord, start: Date.parse(d.start) < Date.parse(birth) ? birth : d.start, end: d.end, title: t.title, summary, focus, tone: toneOf(chart, d.lord) };
}

/** Slow-planet transits read from the Moon sign, in everyday words. */
function skyNow(t: TransitSummary): { lines: string[]; areaNudges: Partial<Record<AreaKey, number>> } {
  const get = (p: Planet) => t.placements.find((x) => x.planet === p)!;
  const jup = get("Jupiter").houseFromMoon, sat = get("Saturn").houseFromMoon, rahu = get("Rahu").houseFromMoon;
  const lines: string[] = [];
  const nudges: Partial<Record<AreaKey, number>> = {};
  const add = (houses: number[], n: number) => houses.forEach((h) => HOUSE[h].areas.forEach((a) => { nudges[a] = (nudges[a] ?? 0) + n; }));
  if ([2, 5, 7, 9, 11].includes(jup)) { lines.push(`Jupiter, the planet of growth, is in a helpful position for you — it supports ${SHORT[jup]}.`); add([jup], 1); }
  else lines.push(`Jupiter is in your ${ordinal(jup)} sign from the Moon — growth comes through ${SHORT[jup]}, but it asks for effort rather than luck.`);
  if (t.sadeSati?.active) { lines.push(`Saturn is passing over your Moon sign (Sade Sati, ${t.sadeSati.phase} phase). It feels heavier and slower, but it rewards patience, discipline and honesty.`); nudges.wellbeing = (nudges.wellbeing ?? 0) - 1; nudges.home = (nudges.home ?? 0) - 1; }
  else if ([3, 6, 11].includes(sat)) { lines.push("Saturn is in a strong position for you — steady work now brings solid, lasting results."); add([sat], 1); nudges.career = (nudges.career ?? 0) + 1; }
  else if ([4, 8].includes(sat)) { lines.push(`Saturn is in your ${ordinal(sat)} sign from the Moon, a phase that tests ${sat === 4 ? "peace at home" : "your resilience"} — keep routines simple and don't overcommit.`); add([sat], -1); }
  else lines.push(`Saturn is in your ${ordinal(sat)} sign from the Moon, slowly shaping ${SHORT[sat]}.`);
  if ([3, 6, 11].includes(rahu)) { lines.push("Rahu is well placed for ambition — bold, new moves can work if you plan them."); add([rahu], 1); }
  return { lines, areaNudges: nudges };
}

function upcoming(chart: ChartResult, t: TransitSummary, now: Date): Upcoming[] {
  const out: Upcoming[] = [];
  const act = activePeriods(chart.dasha, now);
  // next sub-periods (antardashas) within the next ~3 years
  const subs = chart.dasha.mahadashas.flatMap((m) => m.children ?? []).filter((d) => Date.parse(d.start) > now.getTime() && Date.parse(d.start) < now.getTime() + 3 * 365.25 * 86400000).slice(0, 3);
  for (const s of subs) {
    const tone = toneOf(chart, s.lord);
    out.push({ date: s.start, title: `${s.lord} sub-period begins`, text: `From ${monthYear(s.start)} the focus shifts toward ${THEMES[s.lord].gist}, especially around ${SHORT[houseOf(chart, s.lord)]}.`, tone });
  }
  // next main chapter
  const nextMd = chart.dasha.mahadashas.find((m) => act.mahadasha && Date.parse(m.start) >= Date.parse(act.mahadasha.end));
  if (nextMd) out.push({ date: nextMd.start, title: `A new life chapter: ${nextMd.lord}`, text: `Around ${year(nextMd.start)} your next major chapter begins — "${THEMES[nextMd.lord].title}".`, tone: toneOf(chart, nextMd.lord) });
  // slow-planet sign changes
  for (const ing of t.ingresses.filter((i) => i.planet !== "Mars")) {
    const toIdx = SIGN_INDEX[ing.toSign];
    if (toIdx === undefined) continue;
    const h = ((toIdx - chart.moonSign.sign + 12) % 12) + 1;
    let tone: Tone = "mixed", text = "";
    if (ing.planet === "Jupiter") { tone = [2, 5, 7, 9, 11].includes(h) ? "supportive" : "mixed"; text = tone === "supportive" ? `Jupiter moves into a lucky position for you — a good window for ${SHORT[h]}.` : `Jupiter shifts focus to ${SHORT[h]}; growth there comes through effort.`; }
    else if (ing.planet === "Saturn") { tone = [3, 6, 11].includes(h) ? "supportive" : [12, 1, 2, 4, 8].includes(h) ? "demanding" : "mixed"; text = h === 12 ? "Saturn begins Sade Sati for your Moon sign — a slower, more serious 7½-year phase that rewards discipline and patience." : h === 1 ? "Saturn moves over your Moon sign — the most intense part of Sade Sati. Keep routines simple and lean on people you trust." : h === 2 ? "Saturn enters the final phase of Sade Sati — pressure starts to ease; focus on money discipline and kind words at home." : tone === "supportive" ? "Saturn moves into a strong spot for you — patient work starts paying off." : `Saturn moves on to ${SHORT[h]}, asking for responsibility there.`; }
    else { tone = [3, 6, 11].includes(h) ? "supportive" : "mixed"; text = `Rahu shifts your ambition and restlessness toward ${SHORT[h]}.`; }
    out.push({ date: ing.at, title: `${ing.planet} enters ${ing.toSign}`, text, tone });
  }
  return out.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(0, 6);
}

const SIGN_INDEX: Record<string, number> = { Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11 };

function areaReadings(chart: ChartResult, mdLord: Planet, adLord: Planet | null, nudges: Partial<Record<AreaKey, number>>): AreaReading[] {
  return (Object.keys(AREAS) as AreaKey[]).map((key) => {
    const a = AREAS[key];
    let s = nudges[key] ?? 0;
    const reasons: string[] = [];
    for (const [lord, w, label] of [[mdLord, 1.5, "main"], [adLord, 1, "current sub"]] as [Planet | null, number, string][]) {
      if (!lord) continue;
      const touches = a.houses.includes(houseOf(chart, lord)) || ruledHouses(chart, lord).some((h) => a.houses.includes(h)) || a.karakas.includes(lord);
      if (!touches) continue;
      const tone = toneOf(chart, lord);
      s += tone === "supportive" ? w : tone === "demanding" ? -w : 0;
      reasons.push(`your ${label}-period planet ${lord} is linked to it`);
    }
    for (const k of a.karakas) {
      const pl = placementOf(chart, k);
      if (pl.dignity === "exalted" || pl.dignity === "own") s += 0.5;
      if (pl.dignity === "debilitated") s -= 0.5;
    }
    const tone: Tone = s >= 1 ? "supportive" : s <= -1 ? "demanding" : "mixed";
    const lead = tone === "supportive" ? "Looking good right now" : tone === "demanding" ? "Needs extra care right now" : "Steady, with ups and downs";
    const transit = nudges[key] ?? 0;
    const why = reasons.length ? reasons[0] : transit > 0 ? "planets moving through the sky right now favour it" : transit < 0 ? "current planetary movements put some pressure here" : "no strong planetary focus on it at the moment";
    const text = `${lead} — ${why}.`;
    return { key, label: a.label, tone, text, tip: a.tips[tone] };
  });
}

export function lifeGuide(chart: ChartResult, transits: TransitSummary, name: string, now = new Date()): LifeGuide | null {
  const act = activePeriods(chart.dasha, now);
  if (!act.mahadasha) return null;
  const present = chapterOf(chart, act.mahadasha);
  const sub = act.antardasha ? chapterOf(chart, act.antardasha) : null;
  const past = chart.dasha.mahadashas.filter((m) => Date.parse(m.end) <= now.getTime()).map((m) => chapterOf(chart, m));
  const sky = skyNow(transits);
  const areas = areaReadings(chart, act.mahadasha.lord, act.antardasha?.lord ?? null, sky.areaNudges);

  const focus: Planet[] = [act.mahadasha.lord];
  if (act.antardasha && act.antardasha.lord !== act.mahadasha.lord) focus.push(act.antardasha.lord);
  if (transits.sadeSati?.active && !focus.includes("Saturn")) focus.push("Saturn");
  const remedies: Remedy[] = focus.map((p, i) => ({
    planet: p,
    why: i === 0 ? `${p} runs your current life chapter (until ${year(act.mahadasha!.end)}).` : p === "Saturn" && transits.sadeSati?.active && i === focus.length - 1 && act.antardasha?.lord !== "Saturn" ? "Saturn's Sade Sati is active for your Moon sign." : `${p} colours the current sub-period (until ${monthYear(act.antardasha!.end)}).`,
    ...REMEDY[p],
  }));

  const first = name.split(" ")[0];
  const mood = present.tone === "supportive" ? "a generally supportive" : present.tone === "demanding" ? "a demanding but character-building" : "a mixed, growth-oriented";
  const headline = `${first}, you're in ${mood} chapter: "${present.title}" (${year(present.start)}–${year(present.end)}).${sub ? ` Right now ${sub.lord} adds a flavour of ${THEMES[sub.lord].gist.split(",")[0]} until ${monthYear(sub.end)}.` : ""}`;

  return {
    name: first,
    headline,
    past,
    present: { chapter: present, sub, skyNow: sky.lines },
    future: upcoming(chart, transits, now),
    areas,
    remedies,
    basis: chart.lagna ? "lagna" : "moon",
    caveat: chart.confidence.dashaTimingReliable ? null : "Your birth time is approximate, so dates here can shift by months. The themes still apply.",
  };
}
