import { HOUSE_THEMES, SIGNS, type Planet } from "@/lib/astro/constants";
import type { ChartResult } from "@/lib/astro/chart";
import { activePeriods } from "@/lib/astro/dasha";
import type { TransitSummary } from "@/lib/astro/transits";
import { DIGNITY_TEXT, ORDINAL, RULES_VERSION, SIGNIFICATIONS, TOPICS, type Topic } from "./catalog";

export type Polarity = "supportive" | "challenging" | "neutral";

export interface Factor {
  id: string;
  kind: "placement" | "house-lord" | "dignity" | "yoga" | "dasha" | "transit" | "nakshatra" | "varga" | "aspect";
  statement: string; // factual chart statement (computed)
  interpretation: string; // traditional reading (rule)
  polarity: Polarity;
  weight: number; // 1-3 relevance to topic
  ruleId: string;
}

export interface TimingWindow {
  label: string;
  start: string;
  end: string;
  basis: string;
  polarity: Polarity;
}

export interface EvidencePackage {
  rulesVersion: string;
  computationVersion: string;
  topic: Topic;
  topicLabel: string;
  generatedFor: string; // ISO date context
  core: {
    lagna: string | null;
    moonSign: string;
    sunSign: string;
    nakshatra: string;
    currentMahadasha: { lord: Planet; start: string; end: string } | null;
    currentAntardasha: { lord: Planet; start: string; end: string } | null;
  };
  factors: Factor[];
  timing: TimingWindow[];
  confidence: { lagnaReliable: boolean; dashaTimingReliable: boolean; notes: string[] };
  /** Whitelist used by the validator. */
  allowed: {
    planetSign: string[]; // "Saturn|Pisces"
    vargaPlanetSign: string[];
    planetHouse: string[]; // "Saturn|7"
    nakshatras: string[];
    yogas: string[];
    dashaLords: string[];
    years: number[];
  };
}

const houseOf = (chart: ChartResult, p: Planet) => chart.placements.find((x) => x.planet === p)!;

export function buildEvidence(chart: ChartResult, topic: Topic, transits: TransitSummary | null, now = new Date()): EvidencePackage {
  const def = TOPICS[topic];
  const factors: Factor[] = [];
  const P = (p: Planet) => houseOf(chart, p);
  const useHouses = chart.confidence.housesReliable && chart.houses;
  const refName = useHouses ? "Lagna" : "Moon (Chandra Lagna)";
  const houseRef = (p: Planet) => (useHouses ? P(p).house! : P(p).houseFromMoon);

  // Core identity factors
  if (chart.lagna) {
    factors.push({
      id: "lagna",
      kind: "placement",
      statement: `Lagna (ascendant) in ${chart.lagna.signName} at ${chart.lagna.degree.toFixed(1)}°, ${chart.lagna.nakshatra} nakshatra; lagna lord ${SIGNS[chart.lagna.sign].lord}`,
      interpretation: `The rising sign frames temperament and approach to life; ${SIGNS[chart.lagna.sign].name} is ${/^[aeiou]/i.test(SIGNS[chart.lagna.sign].element) ? "an" : "a"} ${SIGNS[chart.lagna.sign].element.toLowerCase()} sign of ${SIGNS[chart.lagna.sign].modality.toLowerCase()} quality.`,
      polarity: "neutral",
      weight: topic === "general" || topic === "growth" ? 3 : 1,
      ruleId: "lagna-sign",
    });
  }
  factors.push({
    id: "moon",
    kind: "nakshatra",
    statement: `Moon in ${chart.moonSign.signName}, Janma Nakshatra ${chart.janmaNakshatra.name} pada ${chart.janmaNakshatra.pada} (nakshatra lord ${chart.janmaNakshatra.lord})`,
    interpretation: `The Moon describes the mind's habits; its nakshatra lord ${chart.janmaNakshatra.lord} also sets the starting point of the Vimshottari dasha sequence.`,
    polarity: "neutral",
    weight: topic === "general" || topic === "growth" || topic === "love" ? 3 : 1,
    ruleId: "moon-nakshatra",
  });

  // Topic houses: occupants and lords
  for (const h of def.houses) {
    const signIdx = useHouses ? (chart.lagna!.sign + h - 1) % 12 : (chart.moonSign.sign + h - 1) % 12;
    const lord = SIGNS[signIdx].lord as Planet;
    const occupants = chart.placements.filter((p) => p.sign === signIdx);
    const lp = P(lord);
    const lordHouse = houseRef(lord);
    const goodHouse = [1, 4, 5, 7, 9, 10, 11].includes(lordHouse);
    factors.push({
      id: `h${h}-lord`,
      kind: "house-lord",
      statement: `${ORDINAL[h]} house from ${refName} is ${SIGNS[signIdx].name}; its lord ${lord} sits in ${lp.signName} (${ORDINAL[lordHouse]} house)${lp.retrograde && lord !== "Rahu" && lord !== "Ketu" ? ", retrograde" : ""}`,
      interpretation: `The ${ORDINAL[h]} house (${HOUSE_THEMES[h].themes.slice(0, 3).join(", ")}) is linked by its lord to ${ORDINAL[lordHouse]}-house themes (${HOUSE_THEMES[lordHouse].themes.slice(0, 2).join(", ")}). ${goodHouse ? "Placement in a kendra, trikona or gain house is traditionally considered supportive." : [6, 8, 12].includes(lordHouse) ? "Placement in a dusthana (6, 8, 12) is traditionally read as results arriving through effort, change or inward work." : "Placement in an upachaya-type house tends to improve with time and effort."}`,
      polarity: goodHouse ? "supportive" : [6, 8, 12].includes(lordHouse) ? "challenging" : "neutral",
      weight: h === def.houses[0] ? 3 : 2,
      ruleId: "house-lord-placement",
    });
    for (const o of occupants) {
      factors.push({
        id: `h${h}-${o.planet.toLowerCase()}`,
        kind: "placement",
        statement: `${o.planet} in ${o.signName} ${o.degree.toFixed(1)}° occupies the ${ORDINAL[h]} house from ${refName}${o.retrograde && o.planet !== "Rahu" && o.planet !== "Ketu" ? " (retrograde)" : ""}${o.combust ? " (combust)" : ""}`,
        interpretation: `${o.planet} brings ${SIGNS_TONE(o.planet)} into ${HOUSE_THEMES[h].themes.slice(0, 3).join(", ")}.`,
        polarity: o.dignity === "debilitated" ? "challenging" : ["exalted", "own", "moolatrikona"].includes(o.dignity) ? "supportive" : "neutral",
        weight: 3,
        ruleId: "planet-in-house",
      });
    }
  }

  // Karakas and their dignity
  for (const k of def.karakas) {
    const p = P(k);
    const d = DIGNITY_TEXT[p.dignity];
    factors.push({
      id: `karaka-${k.toLowerCase()}`,
      kind: "dignity",
      statement: `${k} (natural significator of ${SIGNIFICATIONS[k].core.slice(0, 3).join(", ")}) in ${p.signName} ${p.degree.toFixed(1)}°, ${p.nakshatra} pada ${p.pada}, ${ORDINAL[houseRef(k)]} house from ${refName}${p.retrograde && k !== "Rahu" && k !== "Ketu" ? ", retrograde" : ""}${p.combust ? ", combust" : ""}`,
      interpretation: `${k} is ${d.text}.${p.combust ? " Being close to the Sun (combust), its significations are classically said to work less visibly." : ""}`,
      polarity: p.combust && d.polarity !== "challenging" ? "neutral" : d.polarity,
      weight: 2,
      ruleId: "karaka-dignity",
    });
  }

  // Divisional chart support
  if (def.varga) {
    const v = chart.vargas[def.varga];
    const lagnaV = v.Lagna;
    for (const k of def.karakas.slice(0, 2)) {
      const s = v[k] as number;
      factors.push({
        id: `${def.varga.toLowerCase()}-${k.toLowerCase()}`,
        kind: "varga",
        statement: `In the ${def.varga === "D9" ? "Navamsa (D9)" : "Dashamsa (D10)"}, ${k} is in ${SIGNS[s].name}${lagnaV !== null && lagnaV !== undefined ? `; ${def.varga} Lagna is ${SIGNS[lagnaV].name}` : ""}`,
        interpretation: `The ${def.varga} chart refines ${def.varga === "D9" ? "partnership matters and the inner strength of planets" : "professional direction"}; ${k}'s ${def.varga} sign is read alongside its D1 placement rather than on its own.`,
        polarity: "neutral",
        weight: 1,
        ruleId: `varga-${def.varga.toLowerCase()}`,
      });
    }
  }

  // Yogas
  for (const y of chart.yogas) {
    const rel = topic === "general" || y.category !== "mixed" || topic === "growth";
    if (!rel && y.factors.every((f) => !def.karakas.some((k) => f.includes(k)))) continue;
    factors.push({
      id: `yoga-${y.id}`,
      kind: "yoga",
      statement: `${y.name}: ${y.factors.join("; ")}`,
      interpretation: `${y.definition}${y.caveats.length ? ` Note: ${y.caveats.join(" ")}` : ""}`,
      polarity: y.category === "auspicious" ? "supportive" : y.category === "challenging" ? "challenging" : "neutral",
      weight: y.factors.some((f) => def.karakas.some((k) => f.includes(k))) ? 2 : 1,
      ruleId: `yoga:${y.id}@${y.ruleVersion}`,
    });
  }

  // Dasha
  const act = activePeriods(chart.dasha, now);
  const md = act.mahadasha;
  const ad = act.antardasha;
  const topicLords = new Set<Planet>([...def.karakas, ...def.houses.map((h) => SIGNS[useHouses ? (chart.lagna!.sign + h - 1) % 12 : (chart.moonSign.sign + h - 1) % 12].lord as Planet)]);
  if (md) {
    factors.push({
      id: "dasha-md",
      kind: "dasha",
      statement: `Current Vimshottari Mahadasha: ${md.lord} (${md.start.slice(0, 10)} → ${md.end.slice(0, 10)})${ad ? `, Antardasha: ${ad.lord} (${ad.start.slice(0, 10)} → ${ad.end.slice(0, 10)})` : ""}. ${md.lord} is in ${P(md.lord).signName}, ${ORDINAL[houseRef(md.lord)]} house from ${refName}`,
      interpretation: `A Mahadasha activates the significations of its lord (${SIGNIFICATIONS[md.lord].core.slice(0, 3).join(", ")}) and the houses it occupies and rules. ${topicLords.has(md.lord) ? `${md.lord} is directly connected to ${def.label.toLowerCase()} in this chart.` : `${md.lord} is not a primary significator for ${def.label.toLowerCase()} in this chart, so this theme is more background than foreground now.`}`,
      polarity: topicLords.has(md.lord) ? "supportive" : "neutral",
      weight: 3,
      ruleId: "dasha-activation",
    });
  }

  // Transits
  if (transits) {
    const jup = transits.placements.find((p) => p.planet === "Jupiter")!;
    const sat = transits.placements.find((p) => p.planet === "Saturn")!;
    const jGood = [2, 5, 7, 9, 11].includes(jup.houseFromMoon);
    factors.push({
      id: "transit-jupiter",
      kind: "transit",
      statement: `Transit Jupiter in ${jup.signName}${jup.retrograde ? " (retrograde)" : ""}, ${ORDINAL[jup.houseFromMoon]} from natal Moon${jup.houseFromLagna ? `, ${ORDINAL[jup.houseFromLagna]} from Lagna` : ""}`,
      interpretation: `Gochara tradition counts Jupiter's transit through the 2nd, 5th, 7th, 9th and 11th from the Moon as favorable. ${jGood ? "The current position is one of these." : "The current position is not one of these, so Jupiter's support is quieter for now."}`,
      polarity: jGood ? "supportive" : "neutral",
      weight: 2,
      ruleId: "gochara-jupiter",
    });
    const sGood = [3, 6, 11].includes(sat.houseFromMoon);
    factors.push({
      id: "transit-saturn",
      kind: "transit",
      statement: `Transit Saturn in ${sat.signName}${sat.retrograde ? " (retrograde)" : ""}, ${ORDINAL[sat.houseFromMoon]} from natal Moon${sat.houseFromLagna ? `, ${ORDINAL[sat.houseFromLagna]} from Lagna` : ""}${transits.sadeSati?.active ? ` — Sade Sati (${transits.sadeSati.phase} phase)` : ""}`,
      interpretation: sGood
        ? "Saturn transiting the 3rd, 6th or 11th from the Moon is traditionally read as productive: effort converts into results."
        : transits.sadeSati?.active
          ? "Sade Sati is traditionally a period of consolidation and responsibility — slower, but often formative."
          : "Saturn's transit here asks for patience and structure in the matching life areas.",
      polarity: sGood ? "supportive" : transits.sadeSati?.active ? "challenging" : "neutral",
      weight: 2,
      ruleId: "gochara-saturn",
    });
  }

  // Timing windows: upcoming antardashas of topic-linked lords within ~4 years.
  const timing: TimingWindow[] = [];
  const horizon = now.getTime() + 4 * 365.25 * 86400000;
  for (const m of chart.dasha.mahadashas) {
    for (const a of m.children ?? []) {
      const s = Date.parse(a.start), e = Date.parse(a.end);
      if (e < now.getTime() || s > horizon) continue;
      if (topicLords.has(a.lord) || topicLords.has(m.lord)) {
        timing.push({
          label: `${m.lord}–${a.lord} period`,
          start: a.start,
          end: a.end,
          basis: `Vimshottari ${m.lord} Mahadasha / ${a.lord} Antardasha; ${[m.lord, a.lord].filter((x, i, arr) => topicLords.has(x) && arr.indexOf(x) === i).join(" & ")} linked to ${def.label.toLowerCase()} in this chart`,
          polarity: "supportive",
        });
      }
    }
  }
  if (transits) {
    for (const ing of transits.ingresses) {
      if (ing.planet === "Mars") continue;
      timing.push({ label: `${ing.planet} enters ${ing.toSign}`, start: ing.at, end: ing.at, basis: "Sidereal sign ingress (transit)", polarity: "neutral" });
    }
  }
  timing.sort((a, b) => a.start.localeCompare(b.start));

  // Allowed entities for validation
  const planetSign = new Set<string>();
  const planetHouse = new Set<string>();
  for (const p of chart.placements) {
    planetSign.add(`${p.planet}|${p.signName}`);
    if (p.house) planetHouse.add(`${p.planet}|${p.house}`);
    planetHouse.add(`${p.planet}|${p.houseFromMoon}`);
  }
  if (transits) for (const t of transits.placements) {
    planetSign.add(`${t.planet}|${t.signName}`);
    planetHouse.add(`${t.planet}|${t.houseFromMoon}`);
    if (t.houseFromLagna) planetHouse.add(`${t.planet}|${t.houseFromLagna}`);
  }
  const vargaPlanetSign = new Set<string>();
  for (const k of ["D9", "D10"] as const) for (const [pl, s] of Object.entries(chart.vargas[k])) if (s !== null && pl !== "Lagna") vargaPlanetSign.add(`${pl}|${SIGNS[s].name}`);
  const years = new Set<number>([now.getFullYear(), now.getFullYear() + 1]);
  for (const t of timing) { years.add(Number(t.start.slice(0, 4))); years.add(Number(t.end.slice(0, 4))); }
  if (md) { years.add(Number(md.start.slice(0, 4))); years.add(Number(md.end.slice(0, 4))); }
  if (ad) { years.add(Number(ad.start.slice(0, 4))); years.add(Number(ad.end.slice(0, 4))); }
  years.add(Number(chart.input.utc.slice(0, 4)));

  factors.sort((a, b) => b.weight - a.weight);
  return {
    rulesVersion: RULES_VERSION,
    computationVersion: chart.computation.id,
    topic,
    topicLabel: def.label,
    generatedFor: now.toISOString().slice(0, 10),
    core: {
      lagna: chart.lagna?.signName ?? null,
      moonSign: chart.moonSign.signName,
      sunSign: chart.sunSign.signName,
      nakshatra: `${chart.janmaNakshatra.name} pada ${chart.janmaNakshatra.pada}`,
      currentMahadasha: md ? { lord: md.lord, start: md.start, end: md.end } : null,
      currentAntardasha: ad ? { lord: ad.lord, start: ad.start, end: ad.end } : null,
    },
    factors: factors.slice(0, 18),
    timing: timing.slice(0, 8),
    confidence: { lagnaReliable: chart.confidence.lagnaReliable, dashaTimingReliable: chart.confidence.dashaTimingReliable, notes: chart.confidence.notes },
    allowed: {
      planetSign: [...planetSign],
      vargaPlanetSign: [...vargaPlanetSign],
      planetHouse: [...planetHouse],
      nakshatras: [...new Set([chart.janmaNakshatra.name, ...chart.placements.map((p) => p.nakshatra), ...(chart.lagna ? [chart.lagna.nakshatra] : []), ...(transits?.placements.map((t) => t.nakshatra) ?? [])])],
      yogas: chart.yogas.map((y) => y.name),
      dashaLords: [...new Set(chart.dasha.mahadashas.map((m) => m.lord))],
      years: [...years].sort(),
    },
  };
}

function SIGNS_TONE(p: Planet) {
  return SIGNIFICATIONS[p].tone;
}
