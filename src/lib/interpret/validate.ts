import { NAKSHATRAS, PLANETS, SIGNS } from "@/lib/astro/constants";
import type { EvidencePackage } from "./evidence";

/**
 * Layer 5: verify that every factual astrological claim in generated text is present in the
 * evidence package. Conservative by design — anything that looks like an unsupported placement,
 * house, nakshatra, yoga, dasha or year is reported, and the caller regenerates or falls back.
 */
export interface Violation {
  kind: "placement" | "house" | "nakshatra" | "yoga" | "dasha" | "year" | "guardrail";
  text: string;
}

const SIGN_NAMES = SIGNS.map((s) => s.name);
const SIGN_ALIASES: Record<string, string> = Object.fromEntries(SIGNS.flatMap((s) => [[s.name.toLowerCase(), s.name], [s.sanskrit.toLowerCase(), s.name]]));
const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const PLANET_RE = `(${PLANETS.join("|")})`;
const SIGN_RE = `(${[...SIGN_NAMES, ...SIGNS.map((s) => s.sanskrit)].join("|")})`;

const GUARDRAIL_PATTERNS: [RegExp, string][] = [
  [/\b(guarantee[ds]?|certainly will|will certainly|definitely will|will definitely|100\s?%|99\s?%|without (a|any) doubt|it is certain)\b/i, "certainty claim"],
  [/\b(you will die|death will|fatal|terminal illness|your death)\b/i, "death prediction"],
  [/\b(you will (get|become) pregnant|you will (have|conceive) a (baby|child))\b/i, "pregnancy prediction"],
  [/\b(buy|wear|purchase|recommend)\b[^.\n]{0,40}\b(gem|gemstone|ruby|emerald|sapphire|yantra|pearl|coral|hessonite|cat'?s eye|rudraksha)/i, "remedy/gem sales"],
  [/\b(invest (your money )?in (stocks?|shares|crypto|bitcoin|gold|property|real estate|mutual funds?)|buy (shares|stocks?|crypto)|stock tips?)\b/i, "financial advice"],
];

export function validateText(text: string, ev: EvidencePackage): Violation[] {
  const v: Violation[] = [];
  const allowedPS = new Set(ev.allowed.planetSign);
  const allowedPH = new Set(ev.allowed.planetHouse);

  // "Saturn in Pisces", "Saturn is placed in Pisces", "Saturn transiting Pisces"
  const ps = new RegExp(`${PLANET_RE}(?:'s)?\\s+(?:is\\s+|was\\s+|sits\\s+|placed\\s+|now\\s+)?(?:placed\\s+|located\\s+|transiting\\s+|moving\\s+)?(?:in(?:to)?|through)\\s+(?:the\\s+sign\\s+(?:of\\s+)?)?${SIGN_RE}\\b`, "gi");
  const allowedVarga = new Set(ev.allowed.vargaPlanetSign);
  for (const m of text.matchAll(ps)) {
    const planet = cap(m[1]);
    const sign = SIGN_ALIASES[m[2].toLowerCase()];
    // Divisional-chart statements ("In the Navamsa (D9), Venus is in Scorpio") are checked against varga positions.
    const ctx = text.slice(Math.max(0, (m.index ?? 0) - 60), m.index);
    const isVarga = /navamsa|dashamsa|\bD9\b|\bD10\b|divisional/i.test(ctx);
    const ok = isVarga ? allowedVarga.has(`${planet}|${sign}`) : allowedPS.has(`${planet}|${sign}`);
    if (!ok) v.push({ kind: "placement", text: m[0] });
  }
  // "Mars in the 10th house", "Mars in your tenth house"
  const ph = new RegExp(`${PLANET_RE}[^.\\n]{0,30}?\\bin\\s+(?:the|your)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+house|${PLANET_RE}[^.\\n]{0,30}?\\bin\\s+(?:the|your)\\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+house`, "gi");
  for (const m of text.matchAll(ph)) {
    const planet = cap(m[1] ?? m[3]);
    const house = m[2] ? Number(m[2]) : ORD[(m[4] ?? "").toLowerCase()];
    if (!house || house < 1 || house > 12 || !allowedPH.has(`${planet}|${house}`)) v.push({ kind: "house", text: m[0] });
  }
  // Nakshatras mentioned must be in evidence.
  for (const n of NAKSHATRAS) {
    if (new RegExp(`\\b${n}\\b`, "i").test(text) && !ev.allowed.nakshatras.includes(n)) v.push({ kind: "nakshatra", text: n });
  }
  // Yogas: any "<Name> Yoga" must be known.
  for (const m of text.matchAll(/\b([A-Z][a-z]+(?:[- ][A-Z][a-z]+)?)\s+Yoga\b/g)) {
    const name = m[1];
    const known = ev.allowed.yogas.some((y) => y.toLowerCase().includes(name.toLowerCase()));
    if (!known) v.push({ kind: "yoga", text: m[0] });
  }
  // Mahadasha/Antardasha lords must be real dasha lords; current ones must match.
  for (const m of text.matchAll(new RegExp(`${PLANET_RE}\\s+(Mahadasha|Antardasha|dasha)`, "gi"))) {
    if (!ev.allowed.dashaLords.includes(cap(m[1]))) v.push({ kind: "dasha", text: m[0] });
    if (/current/i.test(text.slice(Math.max(0, (m.index ?? 0) - 25), m.index)) && /maha/i.test(m[2]) && ev.core.currentMahadasha && cap(m[1]) !== ev.core.currentMahadasha.lord) {
      v.push({ kind: "dasha", text: m[0] });
    }
  }
  // Years (1900–2199) must appear in evidence.
  for (const m of text.matchAll(/\b(19\d{2}|20\d{2}|21\d{2})\b/g)) {
    if (!ev.allowed.years.includes(Number(m[1]))) v.push({ kind: "year", text: m[1] });
  }
  v.push(...validateHindi(text, ev));
  for (const [re, label] of GUARDRAIL_PATTERNS) if (re.test(text)) v.push({ kind: "guardrail", text: label });
  for (const [re, label] of HI_GUARDRAILS) if (re.test(text)) v.push({ kind: "guardrail", text: label });
  return v;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
export { SIGN_NAMES };

// ---------- Hindi (Devanagari) claims ----------
const HI_PLANETS: Record<string, string> = { "सूर्य": "Sun", "चंद्रमा": "Moon", "चंद्र": "Moon", "चन्द्र": "Moon", "मंगल": "Mars", "बुध": "Mercury", "बृहस्पति": "Jupiter", "गुरु": "Jupiter", "शुक्र": "Venus", "शनि": "Saturn", "राहु": "Rahu", "केतु": "Ketu" };
const HI_SIGNS: Record<string, string> = { "मेष": "Aries", "वृषभ": "Taurus", "वृष": "Taurus", "मिथुन": "Gemini", "कर्क": "Cancer", "सिंह": "Leo", "कन्या": "Virgo", "तुला": "Libra", "वृश्चिक": "Scorpio", "धनु": "Sagittarius", "मकर": "Capricorn", "कुंभ": "Aquarius", "कुम्भ": "Aquarius", "मीन": "Pisces" };
const HI_ORD: Record<string, number> = { "प्रथम": 1, "पहले": 1, "पहला": 1, "द्वितीय": 2, "दूसरे": 2, "तृतीय": 3, "तीसरे": 3, "चतुर्थ": 4, "चौथे": 4, "पंचम": 5, "पांचवें": 5, "पाँचवें": 5, "षष्ठ": 6, "छठे": 6, "सप्तम": 7, "सातवें": 7, "अष्टम": 8, "आठवें": 8, "नवम": 9, "नौवें": 9, "दशम": 10, "दसवें": 10, "एकादश": 11, "ग्यारहवें": 11, "द्वादश": 12, "बारहवें": 12 };
const alt = (o: Record<string, unknown>) => Object.keys(o).sort((a, b) => b.length - a.length).join("|");
const HI_GUARDRAILS: [RegExp, string][] = [
  [/(निश्चित रूप से होगा|गारंटी|100\s?%|पक्का होगा)/, "certainty claim"],
  [/(मृत्यु होगी|आपकी मृत्यु|मौत होगी)/, "death prediction"],
  [/(रत्न|नीलम|पुखराज|माणिक|पन्ना).{0,20}(पहनें|पहनिए|खरीदें)/, "remedy/gem sales"],
];

function validateHindi(text: string, ev: EvidencePackage): Violation[] {
  if (!/[\u0900-\u097F]/.test(text)) return [];
  const v: Violation[] = [];
  const ps = new Set(ev.allowed.planetSign), vps = new Set(ev.allowed.vargaPlanetSign), ph = new Set(ev.allowed.planetHouse);
  // Split into clauses so a planet is only paired with a sign/house in the same clause.
  for (const clause of text.split(/[।\n.;!?]|,\s*(?:जो|और|जबकि)/)) {
    const planets = [...clause.matchAll(new RegExp(`(${alt(HI_PLANETS)})`, "g"))];
    if (!planets.length) continue;
    const isVarga = /नवांश|नवमांश|दशमांश|D9|D10/.test(clause);
    for (const sm of clause.matchAll(new RegExp(`(${alt(HI_SIGNS)})\\s*(?:राशि|में)`, "g"))) {
      const sign = HI_SIGNS[sm[1]];
      // nearest preceding planet in the clause
      const before = planets.filter((p) => (p.index ?? 0) < (sm.index ?? 0));
      if (!before.length) continue;
      const planet = HI_PLANETS[before[before.length - 1][1]];
      const ok = isVarga ? vps.has(`${planet}|${sign}`) : ps.has(`${planet}|${sign}`);
      if (!ok) v.push({ kind: "placement", text: `${before[before.length - 1][1]} … ${sm[1]}` });
    }
    for (const hm of clause.matchAll(new RegExp(`(${alt(HI_ORD)}|(\\d{1,2})(?:वें|वां|वे))\\s*भाव`, "g"))) {
      const house = hm[2] ? Number(hm[2]) : HI_ORD[hm[1]];
      const before = planets.filter((p) => (p.index ?? 0) < (hm.index ?? 0));
      if (!before.length) continue;
      const planet = HI_PLANETS[before[before.length - 1][1]];
      if (!ph.has(`${planet}|${house}`)) v.push({ kind: "house", text: `${before[before.length - 1][1]} … ${hm[0]}` });
    }
    for (const dm of clause.matchAll(new RegExp(`(${alt(HI_PLANETS)})\\s*(?:की)?\\s*महादशा`, "g"))) {
      const planet = HI_PLANETS[dm[1]];
      if (/वर्तमान|चल रही|अभी/.test(clause) && ev.core.currentMahadasha && planet !== ev.core.currentMahadasha.lord) v.push({ kind: "dasha", text: dm[0] });
    }
  }
  return v;
}
