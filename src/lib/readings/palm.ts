import { rs } from "./strings";
import type { RLang } from "./lang";

export const LINE_IDS = ["life", "head", "heart", "fate", "sun", "mercury"] as const;
export const MOUNT_IDS = ["jupiter", "saturn", "sun", "mercury", "venus", "moon", "mars_upper", "mars_lower"] as const;
export const LINE_FEATURES = ["fork", "break", "chain", "island", "branch_up", "branch_down", "star", "cross", "joined_life_line"] as const;

export interface PalmLine { line: (typeof LINE_IDS)[number]; visibility: "clear" | "faint" | "not_visible"; length: "short" | "medium" | "long" | "unclear"; shape: "straight" | "curved" | "wavy" | "unclear"; features: (typeof LINE_FEATURES)[number][]; observation: string }
export interface PalmMount { mount: (typeof MOUNT_IDS)[number]; prominence: "prominent" | "average" | "flat" | "unclear"; observation: string }
export interface PalmHand { side: "left" | "right"; isPalm: boolean; palmShape: { type: "earth" | "air" | "fire" | "water" | "unclear"; basis: string }; lines: PalmLine[]; mounts: PalmMount[] }

export const PALM_TIER_IDS: Record<string, string[]> = {
  basic: ["overview", "personality", "summary"],
  detailed: ["overview", "personality", "career", "relationships", "strengths", "summary"],
  complete: ["overview", "personality", "career", "relationships", "strengths", "development", "summary"],
};
export const PALM_SCOPE: Record<string, string> = {
  overview: "Palm shape and the overall character of the visible major lines.",
  personality: "Temperament traditionally associated with the observed shape, head and heart lines.",
  career: "Work style traditionally read from the head line, fate/sun lines (only if visible) and observed mounts.",
  relationships: "Emotional style read from the heart line and Venus mount (only if observed).",
  strengths: "Strengths suggested by the observed features, without re-describing them.",
  development: "Growth areas and, if both hands were provided, how the non-dominant (inherited) and dominant (developed) hands differ.",
  summary: "3–4 sentences tying the reading together and one practical suggestion; no new observations.",
};

const FEAT: Record<RLang, Record<string, string>> = {
  en: { fork: "fork", break: "break", chain: "chained section", island: "island", branch_up: "rising branch", branch_down: "falling branch", star: "star", cross: "cross", joined_life_line: "begins joined to the life line" },
  hi: { fork: "द्विशाखा", break: "टूटन", chain: "जंजीरनुमा भाग", island: "द्वीप", branch_up: "ऊपर जाती शाखा", branch_down: "नीचे जाती शाखा", star: "तारा", cross: "क्रॉस", joined_life_line: "जीवन रेखा से जुड़कर शुरू होती है" },
  hinglish: { fork: "fork (do shaakha)", break: "break (toot)", chain: "chain jaisa hissa", island: "island", branch_up: "upar jaati shaakha", branch_down: "neeche jaati shaakha", star: "star", cross: "cross", joined_life_line: "life line se jud kar shuru hoti hai" },
};
const LEN: Record<RLang, Record<string, string>> = {
  en: { short: "short", medium: "medium length", long: "long", unclear: "" }, hi: { short: "छोटी", medium: "मध्यम लंबाई", long: "लंबी", unclear: "" }, hinglish: { short: "chhoti", medium: "medium lambai", long: "lambi", unclear: "" },
};
const SHAPE: Record<RLang, Record<string, string>> = {
  en: { straight: "straight", curved: "curved", wavy: "wavy", unclear: "" }, hi: { straight: "सीधी", curved: "घुमावदार", wavy: "लहरदार", unclear: "" }, hinglish: { straight: "seedhi", curved: "ghumaavdaar", wavy: "lehardaar", unclear: "" },
};
export const MOUNT_NAME: Record<RLang, Record<string, string>> = {
  en: { jupiter: "Jupiter", saturn: "Saturn", sun: "Sun (Apollo)", mercury: "Mercury", venus: "Venus", moon: "Moon (Luna)", mars_upper: "Upper Mars", mars_lower: "Lower Mars" },
  hi: { jupiter: "गुरु पर्वत", saturn: "शनि पर्वत", sun: "सूर्य पर्वत", mercury: "बुध पर्वत", venus: "शुक्र पर्वत", moon: "चंद्र पर्वत", mars_upper: "ऊपरी मंगल", mars_lower: "निचला मंगल" },
  hinglish: { jupiter: "Guru parvat (Jupiter)", saturn: "Shani parvat (Saturn)", sun: "Surya parvat (Sun)", mercury: "Budh parvat (Mercury)", venus: "Shukra parvat (Venus)", moon: "Chandra parvat (Moon)", mars_upper: "Upar ka Mangal", mars_lower: "Neeche ka Mangal" },
};
const PROM: Record<RLang, Record<string, string>> = {
  en: { prominent: "prominent", average: "average", flat: "flat", unclear: "" }, hi: { prominent: "उभरा हुआ", average: "सामान्य", flat: "सपाट", unclear: "" }, hinglish: { prominent: "ubhra hua", average: "normal", flat: "sapaat", unclear: "" },
};

/** Deterministic "what we can see" block, built only from recorded observations. */
export function palmObservations(hands: PalmHand[], dominant: string, lang: RLang = "en") {
  const S = rs(lang);
  return hands.map((h) => {
    const head = `**${h.side === "left" ? S.left : S.right} ${S.hand}${h.side === dominant ? ` (${S.dominantTag})` : ""}** — ${S.palmShape}: ${S.shapes[h.palmShape.type] ?? h.palmShape.type}${h.palmShape.type !== "unclear" && h.palmShape.basis ? ` (${h.palmShape.basis})` : ""}.`;
    const lines = LINE_IDS.map((id) => {
      const l = h.lines.find((x) => x.line === id);
      if (!l || l.visibility === "not_visible") return `- **${S.lines[id]}:** ${S.vis.not_visible}`;
      const desc = [S.vis[l.visibility], LEN[lang][l.length], SHAPE[lang][l.shape], ...l.features.map((f) => FEAT[lang][f])].filter(Boolean).join(", ");
      return `- **${S.lines[id]}:** ${desc}${l.observation ? ` — ${l.observation}` : ""}`;
    });
    const mounts = h.mounts.filter((m) => m.prominence !== "unclear");
    const mline = mounts.length ? `\n- **${S.mounts}:** ${mounts.map((m) => `${MOUNT_NAME[lang][m.mount] ?? m.mount} — ${PROM[lang][m.prominence]}`).join("; ")}` : "";
    return `${head}\n\n${lines.join("\n")}${mline}`;
  }).join("\n\n");
}

/** Lines that are not visible in ANY provided hand — no section may interpret them. */
export function invisibleEverywhere(hands: PalmHand[]) {
  return LINE_IDS.filter((id) => hands.every((h) => { const l = h.lines.find((x) => x.line === id); return !l || l.visibility === "not_visible"; }));
}
