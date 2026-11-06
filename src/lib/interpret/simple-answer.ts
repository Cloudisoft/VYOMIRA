import type { Topic } from "./catalog";
import type { LifeGuide, AreaReading } from "./life-guide";
import { monthYear, type AreaKey, type Lang } from "./life-guide-i18n";

/**
 * A plain-language, predictive AURA answer built from the Life Guide (no AI model needed).
 * Used whenever AI generation is off, unavailable or fails fact-checking — in the user's language.
 */
const TOPIC_AREAS: Record<Topic, AreaKey[]> = {
  career: ["career", "business"],
  love: ["love"],
  marriage: ["love", "family"],
  wealth: ["money", "business"],
  education: ["learning"],
  growth: ["fortune", "learning"],
  general: ["career", "love", "money", "health"],
};

/** Extra keywords for areas the topic detector doesn't know about. */
const EXTRA: [RegExp, AreaKey][] = [
  [/business|startup|company|dhandha|vyapar|व्यापार|बिज़नेस|धंधा/i, "business"],
  [/family|home|house|ghar|parivaar|परिवार|घर|mother|father|maa|papa/i, "family"],
  [/luck|fortune|bhagya|किस्मत|भाग्य|kismat/i, "fortune"],
  [/health|energy|sehat|स्वास्थ्य|सेहत/i, "health"],
];

const L: Record<Lang, { short: string; now: string; when: string; nothing: string; doNow: string; habits: string; chapter: string; deeper: string; aiOff: string; caveat: string }> = {
  en: { short: "In short", now: "Right now", when: "Best and careful windows ahead", nothing: "No major shifts in the next few years — a steady stretch.", doNow: "What you can do", habits: "Helpful habits right now", chapter: "Your current life chapter", deeper: "Open your Life Guide for the full timeline of every life area.", aiOff: "Want a conversational, personalised explanation? Turn on AI explanations above — it takes one tap.", caveat: "Traditional Vedic timing — tendencies, not certainties." },
  hi: { short: "संक्षेप में", now: "अभी", when: "आगे के अच्छे और सावधानी वाले समय", nothing: "अगले कुछ वर्षों में कोई बड़ा बदलाव नहीं — स्थिर समय।", doNow: "आप क्या करें", habits: "अभी के लिए उपयोगी आदतें", chapter: "आपका वर्तमान जीवन-अध्याय", deeper: "हर क्षेत्र की पूरी समयरेखा के लिए अपनी जीवन मार्गदर्शिका खोलें।", aiOff: "बातचीत जैसा, व्यक्तिगत विस्तार चाहिए? ऊपर AI व्याख्या चालू करें — बस एक टैप।", caveat: "पारंपरिक वैदिक समय-संकेत — प्रवृत्तियाँ, निश्चितताएँ नहीं।" },
  hinglish: { short: "Short mein", now: "Abhi", when: "Aage ke achhe aur dhyan rakhne wale time", nothing: "Agle kuch saalon mein koi bada badlaav nahi — stable time.", doNow: "Aap kya karein", habits: "Abhi ke liye helpful aadatein", chapter: "Aapka current life chapter", deeper: "Har area ki poori timeline ke liye apni Life Guide kholiye.", aiOff: "Baat-cheet jaisa, personal explanation chahiye? Upar AI explanation on kijiye — bas ek tap.", caveat: "Paramparik Vedic timing — tendencies, certainties nahi." },
};

export function simpleAnswer(guide: LifeGuide, topic: Topic, question: string, lang: Lang, opts: { aiOff?: boolean } = {}): string {
  const T = L[lang];
  const extra = EXTRA.filter(([re]) => re.test(question)).map(([, k]) => k);
  const keys = new Set<AreaKey>(topic === "general" && extra.length ? extra : [...extra, ...TOPIC_AREAS[topic]]);
  const areas = guide.areas.filter((a) => keys.has(a.key)).slice(0, 3);
  const block = (a: AreaReading) => {
    const windows = a.next.slice(0, 3).map((w) => `- **${monthYear(lang, w.start)} – ${monthYear(lang, w.end)}:** ${w.text}`);
    return [`### ${a.label}`, `**${T.now}:** ${a.text}`, "", `**${T.when}:**`, ...(windows.length ? windows : [`- ${T.nothing}`]), "", `**${T.doNow}:** ${a.tip}`].join("\n");
  };
  const remedy = guide.remedies[0];
  return [
    `**${T.short}:** ${guide.headline.replace(/^[^,]*,\s*/, "")}`,
    "",
    ...areas.map(block).join("\n\n").split("\n"),
    "",
    `**${T.chapter}:** ${guide.present.chapter.title} (${new Date(guide.present.chapter.start).getUTCFullYear()}–${new Date(guide.present.chapter.end).getUTCFullYear()}). ${guide.present.skyNow[0] ?? ""}`,
    "",
    `**${T.habits}:** ${remedy ? remedy.habits.slice(0, 2).join("; ") : ""}`,
    "",
    `_${T.caveat} ${T.deeper}${opts.aiOff ? ` ${T.aiOff}` : ""}_`,
  ].join("\n");
}
