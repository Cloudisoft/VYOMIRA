import { CARD, cardMeaning, positionL, spreadName, suitNameL, suitThemeL, topicLabel, type DrawnCard, type SpreadId, type Suit, type TarotCategory } from "./tarot";
import { dedupeReport, type ReportDoc, type ReportSection } from "./report";
import { rs } from "./strings";
import type { RLang } from "./lang";

const REV: Record<RLang, string> = { en: ", reversed", hi: " (उल्टा)", hinglish: " (ulta)" };

const FRAMES: Record<RLang, ((x: { name: string; label: string; pm: string; meaning: string }) => string)[]> = {
  en: [
    (x) => `**${x.name}** sits in the ${x.label} position (${x.pm}). Traditionally it points to ${x.meaning}.`,
    (x) => `For ${x.label} — ${x.pm} — you drew **${x.name}**, a card associated with ${x.meaning}.`,
    (x) => `${x.label}: **${x.name}**. Here it speaks of ${x.meaning}, in the context of ${x.pm}.`,
  ],
  hi: [
    (x) => `**${x.name}** ${x.label} स्थान पर है (${x.pm})। परंपरा में यह ${x.meaning} की ओर संकेत करता है।`,
    (x) => `${x.label} के लिए — ${x.pm} — आपने **${x.name}** चुना, जो ${x.meaning} से जुड़ा कार्ड है।`,
    (x) => `${x.label}: **${x.name}**। यहाँ यह ${x.pm} के संदर्भ में ${x.meaning} की बात करता है।`,
  ],
  hinglish: [
    (x) => `**${x.name}** ${x.label} position par hai (${x.pm}). Parampara mein yeh ${x.meaning} ki taraf ishaara karta hai.`,
    (x) => `${x.label} ke liye — ${x.pm} — aapne **${x.name}** chuna, jo ${x.meaning} se juda card hai.`,
    (x) => `${x.label}: **${x.name}**. Yahan yeh ${x.pm} ke context mein ${x.meaning} ki baat karta hai.`,
  ],
};

const MAJOR_NOTE: Record<RLang, string> = {
  en: " As a Major Arcana card, it marks a significant life theme rather than a passing mood.",
  hi: " मेजर आर्काना कार्ड होने से यह किसी क्षणिक भाव के बजाय जीवन के किसी महत्वपूर्ण विषय की ओर इशारा करता है।",
  hinglish: " Major Arcana card hone se yeh kisi chhote mood ke bajaay zindagi ke ek bade theme ki taraf ishaara karta hai.",
};
const SUIT_NOTE: Record<RLang, (suit: string, theme: string) => string> = {
  en: (s, t) => ` The ${s} suit adds a focus on ${t}.`,
  hi: (s, t) => ` ${s} सूट ${t} पर ध्यान जोड़ता है।`,
  hinglish: (s, t) => ` ${s} suit ${t} par focus jodta hai.`,
};
const SUIT_LEAN: Record<RLang, Record<string, string>> = {
  en: { wands: "action and initiative are where things move", cups: "feelings and connection carry the story", swords: "thinking and decisions are where the work is", pentacles: "practical matters such as work, money and routine carry the weight" },
  hi: { wands: "कर्म और पहल से बात आगे बढ़ती है", cups: "भावनाएँ और जुड़ाव कहानी को आगे ले जाते हैं", swords: "सोच और निर्णय ही असली काम हैं", pentacles: "काम, धन और दिनचर्या जैसे व्यावहारिक विषय भारी हैं" },
  hinglish: { wands: "action aur pehal se baat aage badhti hai", cups: "bhavnayein aur judaav kahani ko aage le jaate hain", swords: "soch aur faisle hi asli kaam hain", pentacles: "kaam, paisa aur routine jaise practical vishay bhaari hain" },
};

/** Rule-based tarot text: one entry per section id. Never names a card that wasn't drawn. */
export function tarotRuleSections(cards: DrawnCard[], spread: SpreadId, input: { category: TarotCategory; question?: string }, lang: RLang = "en") {
  const out: Record<string, string> = {};
  const seenSuits = new Set<Suit>();
  let majorNoted = false;
  cards.forEach((c, i) => {
    const card = CARD[c.cardId];
    const p = positionL(spread, c.position, lang);
    let extra = "";
    if (card.suit === "major") { if (!majorNoted) { extra = MAJOR_NOTE[lang]; majorNoted = true; } }
    else if (!seenSuits.has(card.suit)) { extra = SUIT_NOTE[lang](suitNameL(card.suit, lang), suitThemeL(card.suit, lang)); seenSuits.add(card.suit); }
    out[c.position] = FRAMES[lang][i % 3]({ name: `${card.name}${c.reversed ? REV[lang] : ""}`, label: p.label, pm: p.meaning, meaning: cardMeaning(c.cardId, c.reversed, lang) }) + extra;
  });
  const n = cards.length, q = input.question?.trim(), topic = topicLabel(input.category, lang), sp = spreadName(spread, lang);
  out.overview = {
    en: `${q ? `You asked: “${q}”.` : `You asked for guidance on ${topic.toLowerCase()}.`} You chose ${n === 1 ? "one card" : `${n} cards`} for the ${sp} spread.`,
    hi: `${q ? `आपका प्रश्न: “${q}”।` : `आपने ${topic} पर मार्गदर्शन माँगा।`} आपने ${sp} के लिए ${n === 1 ? "एक कार्ड" : `${n} कार्ड`} चुने।`,
    hinglish: `${q ? `Aapka sawaal: “${q}”.` : `Aapne ${topic} par guidance maangi.`} Aapne ${sp} ke liye ${n === 1 ? "ek card" : `${n} cards`} chune.`,
  }[lang];
  if (n > 1) {
    const majors = cards.filter((c) => CARD[c.cardId].suit === "major").length;
    const rev = cards.filter((c) => c.reversed).length;
    const counts: Record<string, number> = {};
    cards.forEach((c) => { const s = CARD[c.cardId].suit; if (s !== "major") counts[s] = (counts[s] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const parts = {
      en: [majors >= Math.ceil(n / 2) ? `With ${majors} Major Arcana cards, this reads as a meaningful chapter rather than a passing situation.` : `Mostly Minor Arcana cards suggest everyday choices shape this more than fate does.`, top && top[1] >= 2 ? `${top[1]} ${suitNameL(top[0] as Suit, lang)} cards show that ${SUIT_LEAN.en[top[0]]}.` : "", rev > n / 2 ? `${rev} of ${n} cards are reversed, which often signals energy that is blocked or turned inward and needs attention first.` : ""],
      hi: [majors >= Math.ceil(n / 2) ? `${majors} मेजर आर्काना कार्ड बताते हैं कि यह एक सार्थक अध्याय है, कोई क्षणिक स्थिति नहीं।` : `अधिकतर माइनर आर्काना कार्ड बताते हैं कि भाग्य से ज़्यादा रोज़मर्रा के चुनाव इसे आकार देते हैं।`, top && top[1] >= 2 ? `${top[1]} ${suitNameL(top[0] as Suit, lang)} कार्ड दिखाते हैं कि ${SUIT_LEAN.hi[top[0]]}।` : "", rev > n / 2 ? `${n} में से ${rev} कार्ड उल्टे हैं, जो अक्सर रुकी हुई या भीतर मुड़ी ऊर्जा का संकेत है जिस पर पहले ध्यान देना ज़रूरी है।` : ""],
      hinglish: [majors >= Math.ceil(n / 2) ? `${majors} Major Arcana cards batate hain ki yeh ek meaningful chapter hai, koi chhoti si situation nahi.` : `Zyaadatar Minor Arcana cards batate hain ki kismat se zyada roz ke chunaav ise shape dete hain.`, top && top[1] >= 2 ? `${top[1]} ${suitNameL(top[0] as Suit, lang)} cards dikhate hain ki ${SUIT_LEAN.hinglish[top[0]]}.` : "", rev > n / 2 ? `${n} mein se ${rev} cards ulte hain, jo aksar ruki hui ya andar mudi energy ka sanket hai jis par pehle dhyaan dena zaroori hai.` : ""],
    }[lang];
    out.synthesis = parts.filter(Boolean).join(" ");
  }
  const g = cards.find((c) => c.position === "guidance") ?? cards[cards.length - 1];
  const gname = CARD[g.cardId].name;
  const kw = cardMeaning(g.cardId, g.reversed, lang).split(",")[0].trim();
  out.guidance = g.reversed ? {
    en: `${gname}, reversed, asks you to notice where ${kw} may be holding you back. Name one place it shows up this week, and one small step that does the opposite.`,
    hi: `उल्टा ${gname} कहता है कि ध्यान दें कहाँ "${kw}" आपको रोक रहा है। इस सप्ताह एक जगह पहचानें जहाँ यह दिखता है, और एक छोटा कदम उठाएँ जो इसका उल्टा हो।`,
    hinglish: `Ulta ${gname} kehta hai ki dhyaan dijiye kahan "${kw}" aapko rok raha hai. Is hafte ek jagah pehchaaniye jahan yeh dikhta hai, aur ek chhota kadam uthaiye jo iska ulta ho.`,
  }[lang] : {
    en: `${gname} invites you to lean into ${kw}. Choose one small action this week that puts it into practice.`,
    hi: `${gname} आपको "${kw}" को अपनाने का निमंत्रण देता है। इस सप्ताह एक छोटा काम चुनें जो इसे व्यवहार में लाए।`,
    hinglish: `${gname} aapko "${kw}" ko apnaane ka nyota deta hai. Is hafte ek chhota kaam chuniye jo ise practice mein laaye.`,
  }[lang];
  return out;
}

export function tarotSectionIds(cards: DrawnCard[]) {
  return ["overview", ...cards.map((c) => c.position), ...(cards.length > 1 ? ["synthesis"] : []), "guidance"];
}

export function buildTarotReport(cards: DrawnCard[], spread: SpreadId, input: { category: TarotCategory; question?: string }, lang: RLang = "en", write?: Record<string, string>): ReportDoc {
  const S = rs(lang);
  const rule = tarotRuleSections(cards, spread, input, lang);
  const body = (id: string) => write?.[id]?.trim() || rule[id];
  const sections: ReportSection[] = [
    { id: "overview", title: S.tarotSections.overview, body: body("overview") },
    ...cards.map((c) => ({ id: c.position, title: `${positionL(spread, c.position, lang).label} — ${CARD[c.cardId].name}${c.reversed ? ` (${S.reversedTag})` : ""}`, body: body(c.position) })),
    ...(cards.length > 1 ? [{ id: "synthesis", title: S.tarotSections.synthesis, body: body("synthesis") }] : []),
    { id: "guidance", title: S.tarotSections.guidance, body: body("guidance") },
  ];
  return dedupeReport({ title: spreadName(spread, lang), subtitle: topicLabel(input.category, lang), sections, disclaimer: S.disclaimer.tarot, method: S.tarotMethod });
}
