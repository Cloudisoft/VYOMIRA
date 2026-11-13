import { numerologyProfile, personalYear, parseDob, type NumerologyProfile } from "./numerology";
import { LO_SHU_ARROW, LO_SHU_MISSING, PERSONAL_YEAR, meaning } from "./numerology-meanings";
import { dedupeReport, type ReportDoc, type SectionSpec } from "./report";
import { rs } from "./strings";
import type { RLang } from "./lang";

export type NumerologyTier = "basic" | "detailed" | "complete";

export const NUMEROLOGY_SECTIONS: SectionSpec[] = [
  { id: "overview", title: "Numerology Overview", scope: "Who this report is for, the method used, and the central theme of the Life Path. No number-by-number detail.", requires: ["lifePath", "method"] },
  { id: "core", title: "Your Core Numbers", scope: "A compact list of each core number with its keyword and how it was calculated. No life-area advice.", requires: ["lifePath", "expression", "soulUrge", "personality", "birthday"], dependsOn: ["overview"] },
  { id: "personality", title: "Personality", scope: "Inner motivation (Soul Urge) versus outward impression (Personality number) and the Birthday gift. Do not repeat career or love advice.", requires: ["soulUrge", "personality", "birthday"], dependsOn: ["core"] },
  { id: "career", title: "Career & Work", scope: "Work style and suitable directions from Expression and Life Path only.", requires: ["expression", "lifePath"], dependsOn: ["core"] },
  { id: "relationships", title: "Relationships", scope: "Needs and patterns in close relationships from Soul Urge and Life Path only.", requires: ["soulUrge", "lifePath"], dependsOn: ["personality"] },
  { id: "strengths", title: "Strengths & Challenges", scope: "Concrete strengths and growth edges across the core numbers, without re-describing them.", requires: ["lifePath", "expression", "soulUrge"], dependsOn: ["core"] },
  { id: "year", title: "Your Personal Year", scope: "The theme of the current Personal Year and practical focus for it.", requires: ["personalYear"] },
  { id: "loshu", title: "Lo Shu Grid", scope: "The grid from the date of birth: present, missing and repeated numbers and complete planes.", requires: ["loShu"] },
  { id: "summary", title: "Final Summary", scope: "Two to four sentences tying the reading together and one practical next step. No new information, no disclaimer, and do not reuse sentences from earlier sections.", requires: ["lifePath", "personalYear"], dependsOn: ["overview", "career", "relationships", "year"] },
];

export const TIER_SECTIONS: Record<NumerologyTier, string[]> = {
  basic: ["overview", "core", "personality", "summary"],
  detailed: ["overview", "core", "personality", "career", "relationships", "strengths", "year", "summary"],
  complete: ["overview", "core", "personality", "career", "relationships", "strengths", "year", "loshu", "summary"],
};

const calc = (compound: number, value: number) => (compound !== value ? `${compound} → ${value}` : `${value}`);

const L = {
  en: { lp: "Life Path", ex: "Expression (Destiny)", su: "Soul Urge", pe: "Personality", bd: "Birthday", py: "Personal Year", m: "month", d: "day", y: "year", fromDob: "From your date of birth", all: "All letters of your name", vow: "Vowels only", con: "Consonants only", born: "born on day", str: "Strengths", grow: "Growth edges", rep: "Repeated", planes: "Complete planes", noMissing: "No numbers are missing.", missing: "missing" },
  hi: { lp: "मूलांक-पथ (लाइफ़ पाथ)", ex: "भाग्यांक (एक्सप्रेशन)", su: "आत्मांक (सोल अर्ज)", pe: "व्यक्तित्व अंक", bd: "जन्मदिन अंक", py: "व्यक्तिगत वर्ष", m: "महीना", d: "दिन", y: "वर्ष", fromDob: "जन्मतिथि से", all: "नाम के सभी अक्षर", vow: "केवल स्वर", con: "केवल व्यंजन", born: "जन्म का दिन", str: "शक्तियाँ", grow: "विकास के क्षेत्र", rep: "दोहराए गए अंक", planes: "पूर्ण तल", noMissing: "कोई अंक अनुपस्थित नहीं है।", missing: "अनुपस्थित" },
  hinglish: { lp: "Life Path", ex: "Expression (Destiny)", su: "Soul Urge", pe: "Personality number", bd: "Birthday number", py: "Personal Year", m: "month", d: "din", y: "saal", fromDob: "Janm-tithi se", all: "Naam ke saare letters", vow: "Sirf vowels", con: "Sirf consonants", born: "janm ka din", str: "Taaqat", grow: "Growth ke area", rep: "Dohraaye gaye numbers", planes: "Poore planes", noMissing: "Koi number gaayab nahi hai.", missing: "gaayab" },
} as const;

/** Facts passed to the writer (AI or rules). Everything here is computed, never generated. */
export function numerologyFacts(p: NumerologyProfile, lang: RLang = "en") {
  return {
    method: p.method,
    lifePath: { value: p.lifePath.value, calculation: `${p.lifePath.parts.month} + ${p.lifePath.parts.day} + ${p.lifePath.parts.year} = ${calc(p.lifePath.compound, p.lifePath.value)}`, keyword: meaning(p.lifePath.value, lang).keyword },
    expression: { value: p.expression.value, compound: p.expression.compound, keyword: meaning(p.expression.value, lang).keyword },
    soulUrge: { value: p.soulUrge.value, compound: p.soulUrge.compound, keyword: meaning(p.soulUrge.value, lang).keyword },
    personality: { value: p.personality.value, compound: p.personality.compound, keyword: meaning(p.personality.value, lang).keyword },
    birthday: { day: p.birthday.day, value: p.birthday.value },
    personalYear: { year: p.targetYear, value: p.personalYear, theme: PERSONAL_YEAR[lang][p.personalYear].join(": ") },
    loShu: { missing: p.loShu.missing, repeated: p.loShu.repeated, completePlanes: p.loShu.completeArrows },
  };
}

const lower = (a: string[]) => a.map((x, i) => (i ? x[0].toLowerCase() + x.slice(1) : x)).join("; ");

/** Rule-based section writer — always available, never invents numbers, never reuses a sentence. */
export function ruleSection(id: string, p: NumerologyProfile, tier: NumerologyTier, lang: RLang = "en"): string {
  const lp = meaning(p.lifePath.value, lang), ex = meaning(p.expression.value, lang), su = meaning(p.soulUrge.value, lang), pe = meaning(p.personality.value, lang), bd = meaning(p.birthday.value, lang);
  const T = L[lang], S = rs(lang);
  const first = p.name.split(/\s+/)[0];
  const method = S.methodName[p.method];
  const LP = p.lifePath.value, PY = p.personalYear, Y = p.targetYear;
  const dob = parseDob(p.dob);
  switch (id) {
    case "overview":
      return {
        en: `${first}, your Life Path is **${LP} — ${lp.keyword}**. Traditionally it is the number of ${lp.essence}, and it is the thread the rest of this reading builds on.\n\nYour name numbers are calculated with the **${method}**.`,
        hi: `${first}, आपका मूलांक-पथ **${LP} — ${lp.keyword}** है। परंपरा में यह ${lp.essence} का अंक है, और यही इस रीडिंग का मुख्य सूत्र है।\n\nनाम के अंक **${method}** से निकाले गए हैं।`,
        hinglish: `${first}, aapka Life Path **${LP} — ${lp.keyword}** hai. Parampara mein yeh ${lp.essence} ka number hai, aur yahi is reading ka main dhaaga hai.\n\nNaam ke numbers **${method}** se nikaale gaye hain.`,
      }[lang];
    case "core":
      return [
        `- **${T.lp} ${LP}** — ${lp.keyword}. ${T.fromDob}: ${T.m} ${p.lifePath.parts.month} + ${T.d} ${p.lifePath.parts.day} + ${T.y} ${p.lifePath.parts.year} = ${calc(p.lifePath.compound, LP)}.`,
        `- **${T.ex} ${p.expression.value}** — ${ex.keyword}. ${T.all}: ${calc(p.expression.compound, p.expression.value)}.`,
        `- **${T.su} ${p.soulUrge.value}** — ${su.keyword}. ${T.vow}: ${calc(p.soulUrge.compound, p.soulUrge.value)}.`,
        `- **${T.pe} ${p.personality.value}** — ${pe.keyword}. ${T.con}: ${calc(p.personality.compound, p.personality.value)}.`,
        `- **${T.bd} ${p.birthday.value}** — ${T.born} ${p.birthday.day}.`,
        `- **${T.py} ${PY}** (${Y}).`,
      ].join("\n");
    case "personality": {
      const same = p.soulUrge.value === p.personality.value;
      return {
        en: `What moves you inwardly (Soul Urge ${p.soulUrge.value}) is ${su.inner}. Outwardly (Personality ${p.personality.value}), people tend to experience you as ${pe.outer}.\n\nYour Birthday number ${p.birthday.value} brings a particular gift: ${bd.gift}.${same ? " Your inner drive and outer manner match closely, so people usually read you accurately." : " Because your inner drive and outer manner differ, others may not see your motivations unless you share them."}`,
        hi: `भीतर से आपको प्रेरित करती है (आत्मांक ${p.soulUrge.value}) ${su.inner}। बाहर से (व्यक्तित्व अंक ${p.personality.value}) लोग आपको ऐसे अनुभव करते हैं: ${pe.outer}।\n\nजन्मदिन अंक ${p.birthday.value} एक विशेष गुण देता है: ${bd.gift}।${same ? " आपकी भीतरी प्रेरणा और बाहरी व्यवहार मेल खाते हैं, इसलिए लोग आपको सही समझते हैं।" : " भीतरी प्रेरणा और बाहरी व्यवहार अलग होने के कारण, जब तक आप स्वयं न बताएँ, लोग आपकी प्रेरणाएँ नहीं समझ पाते।"}`,
        hinglish: `Andar se aapko prerit karti hai (Soul Urge ${p.soulUrge.value}) ${su.inner}. Bahar se (Personality ${p.personality.value}) log aapko aise mehsoos karte hain: ${pe.outer}.\n\nBirthday number ${p.birthday.value} ek khaas gun deta hai: ${bd.gift}.${same ? " Aapki andar ki prerna aur bahar ka vyavhaar milte-julte hain, isliye log aapko sahi samajhte hain." : " Andar ki prerna aur bahar ka vyavhaar alag hone se, jab tak aap khud na batayein, log aapki prernayein nahi samajh paate."}`,
      }[lang];
    }
    case "career": {
      const w = p.expression.value !== LP ? lp.work : ex.work;
      return {
        en: `${ex.career}\n\n${p.expression.value !== LP ? `Your Life Path ${LP} adds a direction` : "Because your Expression and Life Path share the same number, the message is doubled"}: work tends to feel meaningful when ${w}.`,
        hi: `${ex.career}\n\n${p.expression.value !== LP ? `मूलांक-पथ ${LP} इसमें दिशा जोड़ता है` : "भाग्यांक और मूलांक-पथ एक ही होने से यह संदेश दोगुना हो जाता है"}: काम तब सार्थक लगता है जब ${w}।`,
        hinglish: `${ex.career}\n\n${p.expression.value !== LP ? `Life Path ${LP} ismein disha jodta hai` : "Expression aur Life Path ek hi hone se yeh message double ho jaata hai"}: kaam tab meaningful lagta hai jab ${w}.`,
      }[lang];
    }
    case "relationships":
      return {
        en: `${su.love}\n\nOver the long run, your Life Path ${LP} asks for ${lp.partner}.`,
        hi: `${su.love}\n\nलंबे समय में मूलांक-पथ ${LP} रिश्ते में ${lp.partner} माँगता है।`,
        hinglish: `${su.love}\n\nLambe samay mein Life Path ${LP} rishte mein ${lp.partner} maangta hai.`,
      }[lang];
    case "strengths": {
      const nums = [...new Set([LP, p.expression.value, p.soulUrge.value])];
      const s = nums.map((n) => meaning(n, lang).strength);
      const c = [...new Set([LP, p.expression.value])].map((n) => meaning(n, lang).challenge);
      return `**${T.str}:** ${lower(s)}.\n\n**${T.grow}:** ${lower(c)}.`;
    }
    case "year": {
      const [title, detail] = PERSONAL_YEAR[lang][PY];
      const n1 = personalYear(dob, Y + 1), n2 = personalYear(dob, Y + 2);
      const ahead = tier !== "complete" ? "" : {
        en: `\n\nLooking ahead: ${Y + 1} is Personal Year ${n1} (${PERSONAL_YEAR.en[n1][0]}), and ${Y + 2} is Personal Year ${n2} (${PERSONAL_YEAR.en[n2][0]}).`,
        hi: `\n\nआगे: ${Y + 1} व्यक्तिगत वर्ष ${n1} (${PERSONAL_YEAR.hi[n1][0]}) है, और ${Y + 2} व्यक्तिगत वर्ष ${n2} (${PERSONAL_YEAR.hi[n2][0]})।`,
        hinglish: `\n\nAage: ${Y + 1} Personal Year ${n1} (${PERSONAL_YEAR.hinglish[n1][0]}) hai, aur ${Y + 2} Personal Year ${n2} (${PERSONAL_YEAR.hinglish[n2][0]}).`,
      }[lang];
      return {
        en: `${Y} is Personal Year **${PY}** — ${title}: ${detail}.${ahead}`,
        hi: `${Y} आपका व्यक्तिगत वर्ष **${PY}** है — ${title}: ${detail}।${ahead}`,
        hinglish: `${Y} aapka Personal Year **${PY}** hai — ${title}: ${detail}.${ahead}`,
      }[lang];
    }
    case "loshu": {
      const miss = p.loShu.missing.length ? p.loShu.missing.map((m) => `- **${m} ${T.missing}** — ${LO_SHU_MISSING[lang][m]}`).join("\n") : `- ${T.noMissing}`;
      const rep = p.loShu.repeated.length ? `\n\n**${T.rep}:** ${p.loShu.repeated.map((r) => `${r.n} (×${r.count})`).join(", ")} — ${{ en: "the qualities of these numbers are emphasised in you.", hi: "इन अंकों के गुण आपमें अधिक प्रबल माने जाते हैं।", hinglish: "in numbers ke gun aapmein zyada prabal maane jaate hain." }[lang]}` : "";
      const arrows = p.loShu.completeArrows.length ? `\n\n**${T.planes}:** ${p.loShu.completeArrows.map((a) => LO_SHU_ARROW[lang][a]).join("; ")}.` : "";
      const intro = { en: `Built from the digits ${p.loShu.digits.join(" ")} of your date of birth (the grid is shown above).`, hi: `आपकी जन्मतिथि के अंकों ${p.loShu.digits.join(" ")} से बना (ग्रिड ऊपर दिखाया गया है)।`, hinglish: `Aapki janm-tithi ke digits ${p.loShu.digits.join(" ")} se bana (grid upar dikhaya gaya hai).` }[lang];
      return `${intro}\n\n${miss}${rep}${arrows}`;
    }
    case "summary":
      return {
        en: `Taken together, your path is about ${lp.path}, using the strengths of ${ex.keyword.replace(/^The /, "the ")}. For ${Y}, one practical step: choose a single commitment that suits Personal Year ${PY}, and give it your steady attention.`,
        hi: `कुल मिलाकर आपका मार्ग है — ${lp.path}, और इसमें ${ex.keyword} की शक्तियाँ आपकी सहायक हैं। ${Y} के लिए एक व्यावहारिक कदम: व्यक्तिगत वर्ष ${PY} के अनुरूप एक प्रतिबद्धता चुनें और उस पर नियमित ध्यान दें।`,
        hinglish: `Kul milakar aapka raasta hai — ${lp.path}, aur ismein ${ex.keyword} ki taaqat aapki madad karti hai. ${Y} ke liye ek practical kadam: Personal Year ${PY} ke hisaab se ek commitment chuniye aur us par regular dhyaan dijiye.`,
      }[lang];
  }
  return "";
}

export function buildNumerologyReport(input: { name: string; dob: string; method: "pythagorean" | "chaldean"; tier: NumerologyTier; targetYear?: number; lang?: RLang }, write?: Record<string, string>): ReportDoc {
  const lang = input.lang ?? "en";
  const S = rs(lang);
  const p = numerologyProfile(input);
  const ids = TIER_SECTIONS[input.tier];
  const doc: ReportDoc = {
    title: S.numTitle(p.name),
    subtitle: `${S.tier[input.tier]} · ${S.methodName[p.method]}`,
    sections: ids.map((id) => ({ id, title: S.numSections[id as keyof typeof S.numSections], body: write?.[id]?.trim() || ruleSection(id, p, input.tier, lang), evidence: NUMEROLOGY_SECTIONS.find((s) => s.id === id)?.requires })),
    disclaimer: S.disclaimer.numerology,
    method: S.numConv(p.method, p.targetYear, p.conventions[1].includes("counted as a vowel")),
  };
  return dedupeReport(doc);
}
