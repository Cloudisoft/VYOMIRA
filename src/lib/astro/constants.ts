/**
 * Static Vedic reference tables. Every table here is a documented convention, not a computation.
 * Sources: Brihat Parashara Hora Shastra (BPHS) as commonly rendered in modern Parashari practice.
 */

export const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_INFO: Record<Planet, { hi: string; abbr: string; glyph: string }> = {
  Sun: { hi: "सूर्य", abbr: "Su", glyph: "☉" },
  Moon: { hi: "चंद्र", abbr: "Mo", glyph: "☽" },
  Mars: { hi: "मंगल", abbr: "Ma", glyph: "♂" },
  Mercury: { hi: "बुध", abbr: "Me", glyph: "☿" },
  Jupiter: { hi: "गुरु", abbr: "Ju", glyph: "♃" },
  Venus: { hi: "शुक्र", abbr: "Ve", glyph: "♀" },
  Saturn: { hi: "शनि", abbr: "Sa", glyph: "♄" },
  Rahu: { hi: "राहु", abbr: "Ra", glyph: "☊" },
  Ketu: { hi: "केतु", abbr: "Ke", glyph: "☋" },
};

export const SIGNS = [
  { name: "Aries", sanskrit: "Mesha", hi: "मेष", lord: "Mars", element: "Fire", modality: "Movable" },
  { name: "Taurus", sanskrit: "Vrishabha", hi: "वृषभ", lord: "Venus", element: "Earth", modality: "Fixed" },
  { name: "Gemini", sanskrit: "Mithuna", hi: "मिथुन", lord: "Mercury", element: "Air", modality: "Dual" },
  { name: "Cancer", sanskrit: "Karka", hi: "कर्क", lord: "Moon", element: "Water", modality: "Movable" },
  { name: "Leo", sanskrit: "Simha", hi: "सिंह", lord: "Sun", element: "Fire", modality: "Fixed" },
  { name: "Virgo", sanskrit: "Kanya", hi: "कन्या", lord: "Mercury", element: "Earth", modality: "Dual" },
  { name: "Libra", sanskrit: "Tula", hi: "तुला", lord: "Venus", element: "Air", modality: "Movable" },
  { name: "Scorpio", sanskrit: "Vrishchika", hi: "वृश्चिक", lord: "Mars", element: "Water", modality: "Fixed" },
  { name: "Sagittarius", sanskrit: "Dhanu", hi: "धनु", lord: "Jupiter", element: "Fire", modality: "Dual" },
  { name: "Capricorn", sanskrit: "Makara", hi: "मकर", lord: "Saturn", element: "Earth", modality: "Movable" },
  { name: "Aquarius", sanskrit: "Kumbha", hi: "कुंभ", lord: "Saturn", element: "Air", modality: "Fixed" },
  { name: "Pisces", sanskrit: "Meena", hi: "मीन", lord: "Jupiter", element: "Water", modality: "Dual" },
] as const satisfies ReadonlyArray<{ name: string; sanskrit: string; hi: string; lord: Planet; element: string; modality: string }>;
export type SignName = (typeof SIGNS)[number]["name"];

/** 27 nakshatras of 13°20' each, with Vimshottari lords (cycle starting Ketu at Ashwini). */
export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
] as const;
export type NakshatraName = (typeof NAKSHATRAS)[number];

export const VIMSHOTTARI_ORDER: ReadonlyArray<{ lord: Planet; years: number }> = [
  { lord: "Ketu", years: 7 },
  { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 },
  { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 },
  { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 },
];
export const VIMSHOTTARI_TOTAL_YEARS = 120;

export const NAKSHATRA_SPAN = 360 / 27; // 13°20'
export const PADA_SPAN = NAKSHATRA_SPAN / 4; // 3°20'

/** Sign index (0 = Aries). Exaltation degree within sign per BPHS. */
export const EXALTATION: Partial<Record<Planet, { sign: number; degree: number }>> = {
  Sun: { sign: 0, degree: 10 },
  Moon: { sign: 1, degree: 3 },
  Mars: { sign: 9, degree: 28 },
  Mercury: { sign: 5, degree: 15 },
  Jupiter: { sign: 3, degree: 5 },
  Venus: { sign: 11, degree: 27 },
  Saturn: { sign: 6, degree: 20 },
};

export const OWN_SIGNS: Partial<Record<Planet, number[]>> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

/** Moolatrikona ranges [sign, fromDeg, toDeg) — BPHS convention as commonly used. */
export const MOOLATRIKONA: Partial<Record<Planet, [number, number, number]>> = {
  Sun: [4, 0, 20],
  Moon: [1, 4, 20],
  Mars: [0, 0, 12],
  Mercury: [5, 16, 20],
  Jupiter: [8, 0, 10],
  Venus: [6, 0, 15],
  Saturn: [10, 0, 20],
};

/** Special Parashari graha drishti, as house offsets counted inclusively (7 = opposite house). */
export const SPECIAL_ASPECTS: Partial<Record<Planet, number[]>> = {
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
};

export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
] as const;

export const YOGAS_PANCHANG = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula",
  "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana",
  "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
] as const;

export const KARANAS_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"] as const;

export const VARAS = [
  { name: "Ravivara", en: "Sunday", lord: "Sun" },
  { name: "Somavara", en: "Monday", lord: "Moon" },
  { name: "Mangalavara", en: "Tuesday", lord: "Mars" },
  { name: "Budhavara", en: "Wednesday", lord: "Mercury" },
  { name: "Guruvara", en: "Thursday", lord: "Jupiter" },
  { name: "Shukravara", en: "Friday", lord: "Venus" },
  { name: "Shanivara", en: "Saturday", lord: "Saturn" },
] as const satisfies ReadonlyArray<{ name: string; en: string; lord: Planet }>;

export const HOUSE_THEMES: Record<number, { name: string; themes: string[] }> = {
  1: { name: "Tanu Bhava", themes: ["self", "body", "temperament", "vitality", "outlook"] },
  2: { name: "Dhana Bhava", themes: ["accumulated resources", "family", "speech", "values"] },
  3: { name: "Sahaja Bhava", themes: ["courage", "initiative", "siblings", "communication", "skills"] },
  4: { name: "Sukha Bhava", themes: ["home", "mother", "inner contentment", "property", "foundations"] },
  5: { name: "Putra Bhava", themes: ["creativity", "learning", "children", "intelligence", "romance"] },
  6: { name: "Ripu Bhava", themes: ["work routines", "service", "obstacles", "competition", "health habits"] },
  7: { name: "Kalatra Bhava", themes: ["partnership", "marriage", "contracts", "public dealings"] },
  8: { name: "Ayur Bhava", themes: ["transformation", "shared resources", "research", "the hidden"] },
  9: { name: "Dharma Bhava", themes: ["higher learning", "teachers", "philosophy", "fortune", "long journeys"] },
  10: { name: "Karma Bhava", themes: ["career", "public role", "reputation", "action"] },
  11: { name: "Labha Bhava", themes: ["gains", "networks", "aspirations", "elder siblings"] },
  12: { name: "Vyaya Bhava", themes: ["expenditure", "retreat", "foreign lands", "spiritual release", "rest"] },
};

export const KENDRAS = [1, 4, 7, 10];
export const TRIKONAS = [1, 5, 9];
export const DUSTHANAS = [6, 8, 12];
