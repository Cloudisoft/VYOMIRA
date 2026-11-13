/**
 * The 78-card tarot deck (traditional Rider–Waite–Smith structure and meanings; card artwork is
 * VYOMIRA's own, drawn in code — see components/readings/TarotCard.tsx). Spreads and positions.
 */
export type Suit = "major" | "wands" | "cups" | "swords" | "pentacles";
export interface TarotCard { id: string; name: string; suit: Suit; rank: number; upright: string; reversed: string; element?: string }

const MAJORS: [string, string, string][] = [
  ["The Fool", "new beginnings, spontaneity, a leap of faith", "recklessness, hesitation, fear of the unknown"],
  ["The Magician", "skill, willpower, resources ready to use", "scattered focus, untapped potential, manipulation"],
  ["The High Priestess", "intuition, inner knowing, what is unspoken", "ignoring intuition, secrets, disconnection"],
  ["The Empress", "nurture, abundance, creativity", "dependence, creative block, neglecting self-care"],
  ["The Emperor", "structure, authority, stability", "rigidity, control, lack of discipline"],
  ["The Hierophant", "tradition, guidance, shared values", "challenging convention, personal beliefs"],
  ["The Lovers", "union, values-based choice, harmony", "imbalance, misaligned values, indecision"],
  ["The Chariot", "determination, direction, momentum", "lack of direction, scattered effort, obstacles"],
  ["Strength", "courage, patience, gentle control", "self-doubt, low energy, raw emotion"],
  ["The Hermit", "reflection, solitude, inner guidance", "isolation, withdrawal, avoiding introspection"],
  ["Wheel of Fortune", "cycles, turning points, change", "resisting change, setbacks, breaking cycles"],
  ["Justice", "fairness, truth, cause and effect", "imbalance, avoiding accountability"],
  ["The Hanged Man", "pause, surrender, new perspective", "stalling, resistance, indecision"],
  ["Death", "endings, transformation, transition", "resisting change, stagnation"],
  ["Temperance", "balance, moderation, patience", "excess, imbalance, haste"],
  ["The Devil", "attachment, habits, material focus", "release, breaking free, reclaiming power"],
  ["The Tower", "sudden change, revelation, upheaval", "averted disaster, fear of change"],
  ["The Star", "hope, renewal, calm faith", "discouragement, lost faith"],
  ["The Moon", "uncertainty, dreams, the unconscious", "clarity returning, released fear"],
  ["The Sun", "joy, success, vitality", "temporary clouds, low enthusiasm"],
  ["Judgement", "reflection, awakening, a calling", "self-doubt, ignoring the call"],
  ["The World", "completion, integration, achievement", "unfinished business, seeking closure"],
];

const SUIT_INFO: Record<Exclude<Suit, "major">, { element: string; theme: string }> = {
  wands: { element: "Fire", theme: "energy, ambition and creative drive" },
  cups: { element: "Water", theme: "emotions, relationships and intuition" },
  swords: { element: "Air", theme: "thoughts, decisions and conflict" },
  pentacles: { element: "Earth", theme: "work, money, health and the material world" },
};

const RANK_NAMES = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

const MINOR: Record<Exclude<Suit, "major">, [string, string][]> = {
  wands: [
    ["inspiration, a new venture, creative spark", "delays, lack of motivation"],
    ["planning, future vision, decisions", "fear of the unknown, poor planning"],
    ["expansion, foresight, progress", "obstacles, frustration with delays"],
    ["celebration, stability, homecoming", "transition, lack of support"],
    ["competition, conflict, differing views", "avoiding conflict, inner tension"],
    ["recognition, victory, confidence", "self-doubt, delayed recognition"],
    ["standing your ground, perseverance", "overwhelm, giving up"],
    ["swift action, movement, news", "delays, frustration, waiting"],
    ["resilience, persistence, last stretch", "exhaustion, defensiveness"],
    ["burden, responsibility, hard work", "delegating, release of burdens"],
    ["enthusiasm, exploration, a message", "lack of direction, procrastination"],
    ["energy, passion, adventure", "haste, impulsiveness"],
    ["confidence, warmth, determination", "insecurity, demanding behaviour"],
    ["vision, leadership, boldness", "impulsiveness, high expectations"],
  ],
  cups: [
    ["new feelings, compassion, openness", "emotional block, repressed feelings"],
    ["partnership, mutual attraction, unity", "imbalance, broken communication"],
    ["friendship, celebration, community", "overindulgence, isolation"],
    ["contemplation, apathy, reevaluation", "new awareness, acceptance"],
    ["loss, regret, grief", "acceptance, moving on"],
    ["nostalgia, childhood memories, innocence", "living in the past, release"],
    ["choices, imagination, wishful thinking", "clarity, focused choices"],
    ["walking away, seeking deeper meaning", "fear of change, staying stuck"],
    ["contentment, satisfaction, gratitude", "dissatisfaction, materialism"],
    ["harmony, family, emotional fulfilment", "misalignment, strained relationships"],
    ["creative opportunity, curiosity, a message of feeling", "emotional immaturity, creative block"],
    ["romance, charm, following the heart", "moodiness, unrealistic expectations"],
    ["compassion, calm, emotional security", "insecurity, co-dependence"],
    ["emotional balance, diplomacy, kindness", "emotional manipulation, moodiness"],
  ],
  swords: [
    ["clarity, breakthrough, truth", "confusion, miscommunication"],
    ["difficult choice, stalemate", "indecision, information overload"],
    ["heartbreak, sorrow, painful truth", "recovery, forgiveness"],
    ["rest, recovery, contemplation", "restlessness, burnout"],
    ["conflict, winning at a cost", "reconciliation, making amends"],
    ["transition, moving on, calmer waters", "unfinished business, resistance"],
    ["strategy, discretion, going alone", "coming clean, rethinking approach"],
    ["feeling trapped, self-limiting beliefs", "release, new perspective"],
    ["anxiety, worry, sleepless thoughts", "hope, reaching out"],
    ["an ending, hitting bottom, release", "recovery, regeneration"],
    ["curiosity, new ideas, vigilance", "scattered thoughts, gossip"],
    ["ambition, fast action, directness", "haste, unfocused energy"],
    ["clear boundaries, independence, honesty", "coldness, harsh judgement"],
    ["intellectual authority, truth, clarity", "misuse of power, manipulation"],
  ],
  pentacles: [
    ["new financial or work opportunity, prosperity", "missed opportunity, poor planning"],
    ["balancing priorities, adaptability", "overcommitment, disorganisation"],
    ["teamwork, skill, collaboration", "lack of teamwork, mediocrity"],
    ["saving, security, control", "greed, over-protectiveness"],
    ["hardship, insecurity, feeling left out", "recovery, support arriving"],
    ["generosity, giving and receiving", "debt, strings attached"],
    ["patience, long-term investment", "impatience, poor returns"],
    ["skill-building, diligence, craft", "perfectionism, lack of focus"],
    ["self-sufficiency, comfort, reward", "over-investment in work, setbacks"],
    ["legacy, family wealth, long-term security", "financial strain, loss of stability"],
    ["learning, ambition, a practical opportunity", "lack of progress, procrastination"],
    ["hard work, routine, reliability", "boredom, stagnation"],
    ["practicality, nurturing, security", "imbalance between work and home"],
    ["abundance, security, leadership", "greed, stubbornness"],
  ],
};

export const DECK: TarotCard[] = [
  ...MAJORS.map(([name, upright, reversed], i) => ({ id: `major-${i}`, name, suit: "major" as const, rank: i, upright, reversed })),
  ...(Object.keys(MINOR) as Exclude<Suit, "major">[]).flatMap((suit) =>
    MINOR[suit].map(([upright, reversed], i) => ({ id: `${suit}-${i + 1}`, name: `${RANK_NAMES[i]} of ${suit[0].toUpperCase()}${suit.slice(1)}`, suit, rank: i + 1, upright, reversed, element: SUIT_INFO[suit].element })),
  ),
];

export const CARD = Object.fromEntries(DECK.map((c) => [c.id, c])) as Record<string, TarotCard>;
export const suitTheme = (s: Suit) => (s === "major" ? "a major life theme" : SUIT_INFO[s].theme);

export type SpreadId = "single" | "three" | "five" | "celtic";
export const SPREADS: Record<SpreadId, { name: string; positions: { id: string; label: string; meaning: string }[] }> = {
  single: { name: "Single Card", positions: [{ id: "focus", label: "Your card", meaning: "the core energy around your question" }] },
  three: { name: "Past · Present · Future", positions: [
    { id: "past", label: "Past", meaning: "what has shaped the situation" },
    { id: "present", label: "Present", meaning: "where things stand now" },
    { id: "future", label: "Future", meaning: "the direction things are moving if nothing changes" },
  ] },
  five: { name: "Five-Card Guidance", positions: [
    { id: "situation", label: "Situation", meaning: "the heart of the matter" },
    { id: "challenge", label: "Challenge", meaning: "what stands in the way" },
    { id: "hidden", label: "Hidden influence", meaning: "what is working beneath the surface" },
    { id: "guidance", label: "Guidance", meaning: "advice for how to act" },
    { id: "direction", label: "Direction", meaning: "where this path is heading" },
  ] },
  celtic: { name: "Celtic Cross", positions: [
    { id: "present", label: "Present", meaning: "the current situation" },
    { id: "challenge", label: "Challenge", meaning: "what crosses you" },
    { id: "foundation", label: "Foundation", meaning: "the root of the matter" },
    { id: "past", label: "Recent past", meaning: "what is passing away" },
    { id: "conscious", label: "Conscious goal", meaning: "what you are aiming for" },
    { id: "near", label: "Near future", meaning: "what is approaching" },
    { id: "self", label: "Yourself", meaning: "your attitude and position" },
    { id: "environment", label: "Environment", meaning: "people and influences around you" },
    { id: "hopes", label: "Hopes & fears", meaning: "what you hope for or fear" },
    { id: "outcome", label: "Likely outcome", meaning: "where things lead on the current path" },
  ] },
};

export const TAROT_CATEGORIES = ["general", "career", "love", "finance", "growth"] as const;
export type TarotCategory = (typeof TAROT_CATEGORIES)[number];
export const TAROT_CATEGORY_LABEL: Record<TarotCategory, string> = { general: "General guidance", career: "Career", love: "Love & relationships", finance: "Money & finance", growth: "Personal growth" };

/** How many face-down cards the user chooses from. */
export const PICK_POOL = 22;

export interface DrawnCard { position: string; cardId: string; reversed: boolean; pickIndex: number }

/**
 * Fisher–Yates shuffle with an injected integer RNG (crypto.randomInt on the server).
 * Orientation is decided at shuffle time, so a card's orientation can't depend on which slot is picked.
 */
export function shuffleDeck(randInt: (maxExclusive: number) => number) {
  const ids = DECK.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id) => ({ id, reversed: randInt(2) === 1 }));
}

/** Map the user's picks (indexes into the face-down pool) to cards and spread positions. */
export function resolvePicks(deck: { id: string; reversed: boolean }[], spread: SpreadId, picks: number[]): DrawnCard[] {
  const pos = SPREADS[spread].positions;
  if (picks.length !== pos.length) throw new Error(`Choose exactly ${pos.length} card${pos.length > 1 ? "s" : ""}`);
  if (new Set(picks).size !== picks.length) throw new Error("Each card can be chosen only once");
  if (picks.some((p) => !Number.isInteger(p) || p < 0 || p >= Math.min(PICK_POOL, deck.length))) throw new Error("Invalid card choice");
  return picks.map((pi, i) => ({ position: pos[i].id, cardId: deck[pi].id, reversed: deck[pi].reversed, pickIndex: pi }));
}

// ── Localisation helpers (English data lives above; Hindi/Hinglish in tarot-i18n.ts) ──
import { CARD_MEANING, POSITION, SPREAD_NAME, SUIT_NAME, SUIT_THEME, TOPIC_LABEL } from "./tarot-i18n";
import type { RLang } from "./lang";

export const cardMeaning = (id: string, reversed: boolean, lang: RLang = "en") => {
  if (lang === "en") return reversed ? CARD[id].reversed : CARD[id].upright;
  const m = CARD_MEANING[lang][id];
  return reversed ? m[1] : m[0];
};
export const suitThemeL = (s: Suit, lang: RLang = "en") => (s === "major" ? "" : SUIT_THEME[lang][s]);
export const suitNameL = (s: Suit, lang: RLang = "en") => (s === "major" ? "" : SUIT_NAME[lang][s]);
export const spreadName = (id: SpreadId, lang: RLang = "en") => SPREAD_NAME[lang][id];
export const topicLabel = (c: TarotCategory, lang: RLang = "en") => TOPIC_LABEL[lang][c];
export function positionL(spread: SpreadId, pos: string, lang: RLang = "en") {
  const p = SPREADS[spread].positions.find((x) => x.id === pos)!;
  if (lang === "en") return { label: p.label, meaning: p.meaning };
  const [label, meaning] = POSITION[lang][pos] ?? [p.label, p.meaning];
  return { label, meaning };
}
