import { RULES_VERSION } from "./catalog";
import { YOGA_RULES_VERSION } from "@/lib/astro/yogas";

/** Human-readable registry of every rule id the evidence builder can cite. Seeded into InterpretationRule. */
export const RULE_REGISTRY: { key: string; version: string; category: string; title: string; body: string; sources: string[] }[] = [
  { key: "lagna-sign", version: RULES_VERSION, category: "identity", title: "Lagna sign", body: "The rising sign frames temperament; element and modality of the sign are reported.", sources: ["BPHS ch. 4"] },
  { key: "moon-nakshatra", version: RULES_VERSION, category: "identity", title: "Moon and Janma Nakshatra", body: "Moon sign describes mental habits; nakshatra lord starts the Vimshottari sequence.", sources: ["BPHS ch. 46"] },
  { key: "house-lord-placement", version: RULES_VERSION, category: "houses", title: "House lord placement", body: "A house's lord placed in kendra/trikona/11th is read as supportive; in 6/8/12 as results through effort or change; elsewhere as improving with effort.", sources: ["BPHS ch. 24"] },
  { key: "planet-in-house", version: RULES_VERSION, category: "houses", title: "Planet in house", body: "A planet brings its significations into the themes of the house it occupies; dignity sets polarity.", sources: ["BPHS ch. 3, 11–23"] },
  { key: "karaka-dignity", version: RULES_VERSION, category: "dignity", title: "Significator dignity", body: "Exalted, moolatrikona and own-sign placements are supportive; debilitation challenging; combustion moderates.", sources: ["BPHS ch. 3"] },
  { key: "varga-d9", version: RULES_VERSION, category: "varga", title: "Navamsa reference", body: "D9 position of the topic's significators is cited alongside D1; not scored independently.", sources: ["BPHS ch. 6"] },
  { key: "varga-d10", version: RULES_VERSION, category: "varga", title: "Dashamsa reference", body: "D10 position of career significators is cited alongside D1; not scored independently.", sources: ["BPHS ch. 6"] },
  { key: "dasha-activation", version: RULES_VERSION, category: "timing", title: "Dasha activation", body: "A Mahadasha activates its lord's significations and the houses it occupies and rules; topic relevance when the lord rules/signifies the topic houses.", sources: ["BPHS ch. 46–51"] },
  { key: "gochara-jupiter", version: RULES_VERSION, category: "transit", title: "Jupiter gochara", body: "Jupiter transiting the 2nd, 5th, 7th, 9th or 11th from the natal Moon is traditionally favourable.", sources: ["Phaladeepika ch. 26"] },
  { key: "gochara-saturn", version: RULES_VERSION, category: "transit", title: "Saturn gochara & Sade Sati", body: "Saturn transiting the 3rd, 6th or 11th from the Moon is productive; 12th/1st/2nd is Sade Sati.", sources: ["Phaladeepika ch. 26"] },
  ...["gaja-kesari", "budha-aditya", "chandra-mangala", "sunapha", "anapha", "durudhara", "kemadruma", "ruchaka", "bhadra", "hamsa", "malavya", "sasa", "raja-kendra-trikona", "yogakaraka", "viparita"].map((k) => ({ key: `yoga:${k}`, version: YOGA_RULES_VERSION, category: "yoga", title: k.replace(/-/g, " "), body: "See src/lib/astro/yogas.ts for the exact definition evaluated.", sources: ["BPHS ch. 34–41", "Phaladeepika ch. 6"] })),
];
