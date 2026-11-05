import { KENDRAS, SIGNS, type Planet } from "./constants";
import type { ChartResult } from "./chart";

/**
 * Yoga rule catalog. Each rule is a precise, documented definition (BPHS / Phaladeepika as
 * commonly applied). Cancellation conditions (bhanga) are NOT evaluated unless stated, and the
 * result says so — we never present a yoga as more certain than its rule.
 */
export const YOGA_RULES_VERSION = "yogas-1.0.0";

export interface YogaResult {
  id: string;
  name: string;
  category: "auspicious" | "challenging" | "mixed";
  ruleVersion: string;
  definition: string;
  factors: string[];
  requiresBirthTime: boolean;
  caveats: string[];
}

const benefics: Planet[] = ["Jupiter", "Venus", "Mercury"];

export function detectYogas(chart: ChartResult): YogaResult[] {
  const out: YogaResult[] = [];
  const P = Object.fromEntries(chart.placements.map((p) => [p.planet, p])) as Record<Planet, ChartResult["placements"][number]>;
  const moonSign = P.Moon.sign;
  const fromMoon = (pl: Planet) => ((P[pl].sign - moonSign + 12) % 12) + 1;
  const add = (y: Omit<YogaResult, "ruleVersion">) => out.push({ ...y, ruleVersion: YOGA_RULES_VERSION });

  // Gaja Kesari — Jupiter in a kendra (1/4/7/10) from the Moon.
  if (chart.confidence.moonSignStable && KENDRAS.includes(fromMoon("Jupiter"))) {
    add({
      id: "gaja-kesari",
      name: "Gaja Kesari Yoga",
      category: "auspicious",
      definition: "Jupiter occupies a kendra (1st, 4th, 7th or 10th) counted from the Moon.",
      factors: [`Jupiter in ${P.Jupiter.signName}, house ${fromMoon("Jupiter")} from the Moon in ${P.Moon.signName}`],
      requiresBirthTime: false,
      caveats: ["Strength depends on Jupiter's and the Moon's dignity; not evaluated numerically."],
    });
  }

  // Budha-Aditya — Sun and Mercury in the same sign.
  if (P.Sun.sign === P.Mercury.sign) {
    add({
      id: "budha-aditya",
      name: "Budha-Aditya Yoga",
      category: "auspicious",
      definition: "The Sun and Mercury occupy the same sign.",
      factors: [`Sun and Mercury together in ${P.Sun.signName}`],
      requiresBirthTime: false,
      caveats: P.Mercury.combust ? ["Mercury is combust (close to the Sun), which classical texts say moderates this yoga."] : [],
    });
  }

  // Chandra-Mangala — Moon and Mars in the same sign.
  if (chart.confidence.moonSignStable && P.Moon.sign === P.Mars.sign) {
    add({
      id: "chandra-mangala",
      name: "Chandra-Mangala Yoga",
      category: "mixed",
      definition: "The Moon and Mars occupy the same sign.",
      factors: [`Moon and Mars together in ${P.Moon.signName}`],
      requiresBirthTime: false,
      caveats: [],
    });
  }

  // Sunapha / Anapha / Durudhara / Kemadruma — planets (excluding Sun, Rahu, Ketu) in 2nd/12th from Moon.
  if (chart.confidence.moonSignStable) {
    const considered: Planet[] = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const second = considered.filter((p) => fromMoon(p) === 2);
    const twelfth = considered.filter((p) => fromMoon(p) === 12);
    if (second.length && twelfth.length) {
      add({
        id: "durudhara",
        name: "Durudhara Yoga",
        category: "auspicious",
        definition: "Planets other than the Sun, Rahu and Ketu occupy both the 2nd and 12th signs from the Moon.",
        factors: [`2nd from Moon: ${second.join(", ")}`, `12th from Moon: ${twelfth.join(", ")}`],
        requiresBirthTime: false,
        caveats: [],
      });
    } else if (second.length) {
      add({
        id: "sunapha",
        name: "Sunapha Yoga",
        category: "auspicious",
        definition: "A planet other than the Sun, Rahu and Ketu occupies the 2nd sign from the Moon.",
        factors: [`2nd from Moon: ${second.join(", ")}`],
        requiresBirthTime: false,
        caveats: [],
      });
    } else if (twelfth.length) {
      add({
        id: "anapha",
        name: "Anapha Yoga",
        category: "auspicious",
        definition: "A planet other than the Sun, Rahu and Ketu occupies the 12th sign from the Moon.",
        factors: [`12th from Moon: ${twelfth.join(", ")}`],
        requiresBirthTime: false,
        caveats: [],
      });
    } else {
      add({
        id: "kemadruma",
        name: "Kemadruma Yoga (basic definition)",
        category: "challenging",
        definition: "No planet other than the Sun, Rahu and Ketu occupies the 2nd or 12th sign from the Moon.",
        factors: ["2nd and 12th signs from the Moon are unoccupied by the five tara grahas"],
        requiresBirthTime: false,
        caveats: [
          "Classical texts list many cancellation conditions (e.g. planets in kendras from Lagna or Moon). These are not evaluated here, and this combination is very common.",
        ],
      });
    }
  }

  // House-based yogas require a reliable Lagna.
  if (chart.lagna && chart.houses) {
    const mahapurusha: Record<string, [Planet, string]> = {
      ruchaka: ["Mars", "Ruchaka"],
      bhadra: ["Mercury", "Bhadra"],
      hamsa: ["Jupiter", "Hamsa"],
      malavya: ["Venus", "Malavya"],
      sasa: ["Saturn", "Sasa"],
    };
    for (const [id, [pl, nm]] of Object.entries(mahapurusha)) {
      const p = P[pl];
      if (p.house && KENDRAS.includes(p.house) && (p.dignity === "own" || p.dignity === "exalted" || p.dignity === "moolatrikona")) {
        add({
          id,
          name: `${nm} Yoga (Pancha Mahapurusha)`,
          category: "auspicious",
          definition: `${pl} in its own or exaltation sign while occupying a kendra (1st, 4th, 7th or 10th) from the Lagna.`,
          factors: [`${pl} in ${p.signName} (${p.dignity}), house ${p.house}`],
          requiresBirthTime: true,
          caveats: [],
        });
      }
    }

    // Kendra–Trikona Raja Yoga by conjunction.
    const lordOf = (h: number) => chart.houses![h - 1].lord;
    const kendraLords = new Set([1, 4, 7, 10].map(lordOf));
    const trikonaLords = new Set([1, 5, 9].map(lordOf));
    const pairs = new Set<string>();
    for (const k of kendraLords) for (const t of trikonaLords) {
      if (k === t) continue;
      if (P[k].sign === P[t].sign) {
        const key = [k, t].sort().join("+");
        if (pairs.has(key)) continue;
        pairs.add(key);
        add({
          id: `raja-kendra-trikona-${key.toLowerCase()}`,
          name: "Raja Yoga (Kendra–Trikona conjunction)",
          category: "auspicious",
          definition: "A lord of a kendra (1, 4, 7, 10) and a lord of a trikona (1, 5, 9) occupy the same sign.",
          factors: [`${k} (kendra lord) and ${t} (trikona lord) together in ${P[k].signName}, house ${P[k].house}`],
          requiresBirthTime: true,
          caveats: ["Only conjunction is evaluated; mutual aspect and sign exchange variants are not."],
        });
      }
    }
    // Yogakaraka: a single planet ruling both a kendra and a trikona (other than the 1st).
    for (const pl of ["Mars", "Venus", "Saturn"] as Planet[]) {
      const ruled = chart.houses.filter((h) => h.lord === pl).map((h) => h.house);
      if (ruled.some((h) => [4, 7, 10].includes(h)) && ruled.some((h) => [5, 9].includes(h))) {
        add({
          id: `yogakaraka-${pl.toLowerCase()}`,
          name: `${pl} as Yogakaraka`,
          category: "auspicious",
          definition: "One planet rules both a kendra (4, 7, 10) and a trikona (5, 9) from the Lagna.",
          factors: [`${pl} rules houses ${ruled.join(" and ")} for ${SIGNS[chart.lagna.sign].name} Lagna; placed in house ${P[pl].house}`],
          requiresBirthTime: true,
          caveats: [],
        });
      }
    }

    // Viparita Raja Yoga — lord of 6/8/12 placed in another of 6/8/12.
    const names: Record<number, string> = { 6: "Harsha", 8: "Sarala", 12: "Vimala" };
    for (const h of [6, 8, 12]) {
      const lord = lordOf(h);
      const at = P[lord].house!;
      if ([6, 8, 12].includes(at) && at !== h) {
        add({
          id: `viparita-${names[h].toLowerCase()}`,
          name: `${names[h]} Yoga (Viparita Raja)`,
          category: "mixed",
          definition: "The lord of a dusthana (6, 8, 12) occupies another dusthana.",
          factors: [`${lord}, lord of house ${h}, placed in house ${at}`],
          requiresBirthTime: true,
          caveats: ["Traditionally read as gains that come through difficulty or reversal; not a guarantee of outcomes."],
        });
      }
    }
  }
  // Benefic flag usage keeps the list exported for interpretation layer.
  void benefics;
  return out;
}
