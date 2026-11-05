import type { Planet } from "@/lib/astro/constants";

/**
 * Interpretive rule catalog (Layer 2). Versioned; every factor emitted by the evidence builder
 * cites one of these rule ids. Significations follow standard Parashari karakatva lists
 * (BPHS ch. 3 & 11–24 as commonly summarized). Wording is original and deliberately framed as
 * traditional interpretation, not prediction.
 */
export const RULES_VERSION = "interp-1.0.0";

export const SIGNIFICATIONS: Record<Planet, { core: string[]; tone: string }> = {
  Sun: { core: ["identity", "authority", "purpose", "father figures", "visibility"], tone: "a drive to lead and be recognized" },
  Moon: { core: ["mind", "emotions", "nurture", "mother", "public mood"], tone: "emotional sensitivity and the need for security" },
  Mars: { core: ["energy", "courage", "competition", "property", "technical skill"], tone: "initiative, decisiveness and heat" },
  Mercury: { core: ["intellect", "speech", "trade", "analysis", "learning"], tone: "curiosity, adaptability and communication" },
  Jupiter: { core: ["wisdom", "teachers", "growth", "ethics", "children"], tone: "expansion, guidance and faith" },
  Venus: { core: ["relationships", "beauty", "comfort", "arts", "agreements"], tone: "harmony, pleasure and refinement" },
  Saturn: { core: ["discipline", "endurance", "service", "structure", "time"], tone: "patience, responsibility and slow, durable results" },
  Rahu: { core: ["ambition", "the unconventional", "foreign influences", "technology", "obsession"], tone: "hunger for the new and unfamiliar" },
  Ketu: { core: ["detachment", "intuition", "research", "spirituality", "past skills"], tone: "inwardness and letting go" },
};

export type Topic = "general" | "career" | "love" | "marriage" | "wealth" | "education" | "growth";

export const TOPICS: Record<Topic, { label: string; houses: number[]; karakas: Planet[]; varga?: "D9" | "D10"; keywords: string[] }> = {
  general: { label: "Overall chart", houses: [1, 4, 7, 10], karakas: ["Sun", "Moon"], keywords: [] },
  career: { label: "Career & profession", houses: [10, 6, 2, 11], karakas: ["Sun", "Saturn", "Mercury"], varga: "D10", keywords: ["career", "job", "work", "profession", "business", "promotion", "office", "naukri", "kaam", "नौकरी", "करियर", "व्यापार"] },
  love: { label: "Love & relationships", houses: [5, 7, 11], karakas: ["Venus", "Moon"], keywords: ["love", "relationship", "partner", "dating", "romance", "crush", "pyaar", "प्रेम", "प्यार", "रिश्ता"] },
  marriage: { label: "Marriage & partnership", houses: [7, 2, 4], karakas: ["Venus", "Jupiter"], varga: "D9", keywords: ["marriage", "spouse", "wife", "husband", "wedding", "shaadi", "vivah", "शादी", "विवाह"] },
  wealth: { label: "Wealth & resources", houses: [2, 11, 5, 9], karakas: ["Jupiter", "Venus"], keywords: ["money", "wealth", "finance", "income", "savings", "property", "paisa", "dhan", "धन", "पैसा"] },
  education: { label: "Education & learning", houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], keywords: ["study", "education", "exam", "college", "learning", "degree", "padhai", "पढ़ाई", "शिक्षा"] },
  growth: { label: "Personal growth", houses: [1, 9, 12, 5], karakas: ["Moon", "Jupiter", "Ketu"], keywords: ["growth", "purpose", "spiritual", "meaning", "self", "transit", "inner", "आध्यात्मिक"] },
};

export function detectTopic(q: string): Topic {
  const s = q.toLowerCase();
  let best: Topic = "general";
  let score = 0;
  for (const [t, def] of Object.entries(TOPICS) as [Topic, (typeof TOPICS)[Topic]][]) {
    const n = def.keywords.filter((k) => s.includes(k)).length;
    if (n > score) {
      best = t;
      score = n;
    }
  }
  return best;
}

export const DIGNITY_TEXT: Record<string, { polarity: "supportive" | "challenging" | "neutral"; text: string }> = {
  exalted: { polarity: "supportive", text: "exalted — classically at its strongest expression" },
  moolatrikona: { polarity: "supportive", text: "in its moolatrikona sign — functioning with clarity and confidence" },
  own: { polarity: "supportive", text: "in its own sign — comfortable and self-directed" },
  debilitated: { polarity: "challenging", text: "debilitated — its themes classically need conscious effort to mature" },
  neutral: { polarity: "neutral", text: "in a neutral sign — colored by the sign lord's condition" },
};

export const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
