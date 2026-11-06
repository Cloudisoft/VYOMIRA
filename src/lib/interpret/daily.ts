import { NAKSHATRAS, SIGNS, TITHIS, VARAS } from "@/lib/astro/constants";
import type { ChartResult } from "@/lib/astro/chart";
import { nakshatraOf } from "@/lib/astro/chart";
import { bodyPosition } from "@/lib/astro/positions";
import { norm360, signOf } from "@/lib/astro/math";
import { localToUtc, offsetAt } from "@/lib/astro/timezone";
import { ORDINAL } from "./catalog";

/** Tara Bala: the 9-fold count from Janma Nakshatra to the day's nakshatra (classical muhurta rule). */
const TARAS = [
  { name: "Janma", quality: "mixed", note: "the day's Moon returns to your birth star — traditionally a day for steadiness rather than new ventures" },
  { name: "Sampat", quality: "favorable", note: "traditionally associated with gains and resourcefulness" },
  { name: "Vipat", quality: "challenging", note: "traditionally a day to double-check plans and avoid needless risk" },
  { name: "Kshema", quality: "favorable", note: "traditionally associated with wellbeing and security" },
  { name: "Pratyak", quality: "challenging", note: "traditionally read as resistance — patience pays" },
  { name: "Sadhana", quality: "favorable", note: "traditionally supportive of effort and accomplishment" },
  { name: "Naidhana", quality: "challenging", note: "traditionally a day for rest and caution rather than launches" },
  { name: "Mitra", quality: "favorable", note: "traditionally friendly and cooperative" },
  { name: "Parama Mitra", quality: "favorable", note: "traditionally the most supportive of the nine taras" },
] as const;

const MOON_GOOD = [1, 3, 6, 7, 10, 11];
const HOUSE_HINT: Record<number, string> = {
  1: "attention turns to yourself — energy, appearance, how you show up",
  2: "family, finances and words carry extra weight",
  3: "a good moment for messages, short trips and initiative",
  4: "home and inner comfort ask for attention",
  5: "creativity, learning and play are highlighted",
  6: "routines, health habits and clearing tasks go well",
  7: "partners and one-to-one conversations come forward",
  8: "an inward, private mood — research and reflection suit it",
  9: "teachers, ideas and the bigger picture are highlighted",
  10: "work and visibility are in focus",
  11: "friends, networks and gains are highlighted",
  12: "rest, retreat and letting go are favoured",
};

export interface DailyInsight {
  date: string;
  timeZone: string;
  moon: { sign: string; nakshatra: string; houseFromMoon: number; favorable: boolean; hint: string };
  tara: { name: string; quality: string; note: string; count: number };
  tithi: string;
  vara: string;
  text: string;
  basis: string[];
}

function at(chart: ChartResult, when: Date, tz: string): DailyInsight {
  const moon = bodyPosition("Moon", when).longitude;
  const sun = bodyPosition("Sun", when).longitude;
  const nak = nakshatraOf(moon);
  const s = signOf(moon);
  const h = ((s - chart.moonSign.sign + 12) % 12) + 1;
  const count = ((nak.index - chart.janmaNakshatra.index + 27) % 27) + 1;
  const tara = TARAS[(count - 1) % 9];
  const elong = norm360(moon - sun);
  const ti = Math.floor(elong / 12) + 1;
  const tithi = `${ti <= 15 ? "Shukla" : "Krishna"} ${ti === 15 ? "Purnima" : ti === 30 ? "Amavasya" : TITHIS[(ti - 1) % 15]}`;
  const local = new Date(when.getTime() + offsetAt(tz, when.getTime()) * 60000);
  const vara = VARAS[local.getUTCDay()];
  const favorable = MOON_GOOD.includes(h);
  const text = `The Moon moves through ${SIGNS[s].name} in ${nak.name} — the ${ORDINAL[h]} sign from your natal Moon, where ${HOUSE_HINT[h]}. ${favorable ? "Classical gochara counts this position as supportive." : "Classical gochara counts this position as one to move through gently."} Your Tara Bala today is ${tara.name}: ${tara.note}.`;
  return {
    date: local.toISOString().slice(0, 10),
    timeZone: tz,
    moon: { sign: SIGNS[s].name, nakshatra: nak.name, houseFromMoon: h, favorable, hint: HOUSE_HINT[h] },
    tara: { name: tara.name, quality: tara.quality, note: tara.note, count },
    tithi,
    vara: `${vara.name} (${vara.en})`,
    text,
    basis: [`Transit Moon ${SIGNS[s].name} ${(moon % 30).toFixed(1)}°, ${nak.name} pada ${nak.pada}`, `Natal Moon ${chart.moonSign.signName}, Janma Nakshatra ${chart.janmaNakshatra.name}`, `Tara count ${count} → ${tara.name}`, "Calculated for the moment shown, in your local timezone"],
  };
}

export function dailyInsight(chart: ChartResult, tz: string, now = new Date()) {
  return at(chart, now, tz);
}

/** 14-day calendar evaluated at 06:00 local time each day. */
export function cosmicCalendar(chart: ChartResult, tz: string, days = 14, now = new Date()) {
  const off = offsetAt(tz, now.getTime());
  const local = new Date(now.getTime() + off * 60000);
  const out: DailyInsight[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + i));
    const inst = localToUtc({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: 6, minute: 0 }, tz).utc;
    out.push(at(chart, inst, tz));
  }
  return out;
}
export { NAKSHATRAS };

/* ---------------- Localised daily text (Hindi / Hinglish) ---------------- */
type DLang = "en" | "hi" | "hinglish";
const HINT_HI: Record<number, string> = { 1: "ध्यान आप पर रहेगा — ऊर्जा, रूप-रंग और आपकी उपस्थिति", 2: "परिवार, धन और वाणी का महत्व बढ़ेगा", 3: "संदेश, छोटी यात्राओं और पहल के लिए अच्छा समय", 4: "घर और मन के सुकून पर ध्यान दें", 5: "रचनात्मकता, पढ़ाई और मनोरंजन पर ज़ोर", 6: "दिनचर्या, सेहत की आदतें और अधूरे काम निपटाना अच्छा रहेगा", 7: "साथी और आमने-सामने की बातचीत आगे रहेगी", 8: "मन भीतर की ओर — शोध और चिंतन के लिए उपयुक्त", 9: "गुरु, विचार और बड़ी तस्वीर पर ज़ोर", 10: "काम और प्रतिष्ठा केंद्र में", 11: "मित्र, नेटवर्क और लाभ पर ज़ोर", 12: "विश्राम, एकांत और छोड़ने का समय" };
const HINT_HG: Record<number, string> = { 1: "dhyan aap par rahega — energy, look aur aapki presence", 2: "parivaar, paisa aur vaani ka mahatva badhega", 3: "messages, chhoti yatra aur pehal ke liye achha time", 4: "ghar aur mann ke sukoon par dhyan dijiye", 5: "creativity, padhai aur masti par zor", 6: "routine, health habits aur pending kaam nipatana achha rahega", 7: "partner aur aamne-saamne ki baat-cheet aage rahegi", 8: "mann andar ki taraf — research aur soch-vichaar ke liye sahi", 9: "guru, ideas aur badi picture par zor", 10: "kaam aur reputation focus mein", 11: "dost, network aur faayde par zor", 12: "aaram, ekaant aur chhodne ka time" };
const TARA_HI = ["आपका जन्म-नक्षत्र — नए काम के बजाय स्थिरता का दिन", "लाभ और साधनों से जुड़ा शुभ दिन", "योजनाएँ दोबारा जाँचें और बेवजह जोखिम से बचें", "कुशलता और सुरक्षा से जुड़ा शुभ दिन", "रुकावट जैसा दिन — धैर्य फल देगा", "मेहनत और उपलब्धि के लिए सहायक दिन", "नई शुरुआत के बजाय विश्राम और सावधानी का दिन", "मैत्रीपूर्ण और सहयोगी दिन", "नौ ताराओं में सबसे शुभ दिन"];
const TARA_HG = ["aapka janam-nakshatra — naye kaam ke bajaay sthirta ka din", "laabh aur resources se juda shubh din", "plans dobara check kijiye aur bekaar risk se bachiye", "kushalta aur suraksha se juda shubh din", "rukavat jaisa din — dhairya phal dega", "mehnat aur achievement ke liye supportive din", "nayi shuruaat ke bajaay aaram aur savdhaani ka din", "dostana aur sahyog wala din", "nau taraon mein sabse shubh din"];
const SIGN_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const SIGN_HG = ["Mesh", "Vrishabh", "Mithun", "Kark", "Singh", "Kanya", "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbh", "Meen"];

/** The day's insight sentence in the user's language (same facts as `text`). */
export function dailyTextL(d: DailyInsight, lang: DLang): string {
  if (lang === "en") return d.text;
  const si = SIGNS.findIndex((s) => s.name === d.moon.sign);
  const ti = TARAS.findIndex((t) => t.name === d.tara.name);
  const h = d.moon.houseFromMoon;
  if (lang === "hi") return `आज चंद्रमा ${SIGN_HI[si]} राशि में, ${d.moon.nakshatra} नक्षत्र में है — आपकी जन्म-राशि से ${h}वीं राशि, जहाँ ${HINT_HI[h]}। ${d.moon.favorable ? "पारंपरिक गोचर इस स्थिति को शुभ मानता है।" : "पारंपरिक गोचर के अनुसार इस स्थिति में सहजता से चलें।"} आज आपका तारा बल ${d.tara.name} है: ${TARA_HI[ti]}।`;
  return `Aaj Chandrama ${SIGN_HG[si]} rashi mein, ${d.moon.nakshatra} nakshatra mein hai — aapki janam-rashi se ${h}vi rashi, jahan ${HINT_HG[h]}. ${d.moon.favorable ? "Paramparik gochar is position ko shubh maanta hai." : "Paramparik gochar ke hisaab se is position mein aaram se chaliye."} Aaj aapka Tara Bala ${d.tara.name} hai: ${TARA_HG[ti]}.`;
}
