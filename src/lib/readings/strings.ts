import type { RLang } from "./lang";

/** Report-level strings shared by numerology, tarot and palmistry, in English, Hindi and Hinglish. */
export const REPORT_STR = {
  en: {
    method: "Method", note: "Please note", preparedFor: "Prepared for", tagline: "Your Universe. Your Story.", loShu: "Lo Shu grid", yourCards: "Your cards", missing: "MISSING",
    numSections: { overview: "Numerology Overview", core: "Your Core Numbers", personality: "Personality", career: "Career & Work", relationships: "Relationships", strengths: "Strengths & Challenges", year: "Your Personal Year", loshu: "Lo Shu Grid", summary: "Final Summary" },
    numTitle: (n: string) => `Numerology Report — ${n}`, tier: { basic: "Basic", detailed: "Detailed", complete: "Complete" } as Record<string, string>,
    methodName: { pythagorean: "Pythagorean method", chaldean: "Chaldean method" } as Record<string, string>,
    numConv: (m: string, y: number, yv = false) => [m === "pythagorean" ? "Pythagorean letter values (A–I = 1–9, J–R = 1–9, S–Z = 1–8); master numbers 11, 22 and 33 are kept." : "Chaldean letter values (no letter carries 9); name totals are shown as compound numbers and reduced to one digit.", yv ? "Vowels are A, E, I, O, U; because your name has none of these, Y is counted as a vowel." : "Vowels are A, E, I, O, U; Y is treated as a consonant.", "Life Path reduces the month, day and year separately and then reduces their sum.", `Personal Year is calculated for ${y}.`, "The Lo Shu grid uses the non-zero digits of your full date of birth."],
    tarotSections: { overview: "Your Question", synthesis: "What the Cards Say Together", guidance: "Practical Reflection" }, reversedTag: "reversed",
    tarotMethod: ["78-card deck (Rider–Waite–Smith tradition), upright and reversed meanings.", "The deck was shuffled server-side with a cryptographically secure random number generator; you chose the cards face-down."],
    palmSections: { observations: "What We Can See (observations)", overview: "Palm Overview", personality: "Personality", career: "Career", relationships: "Relationships", strengths: "Strengths", development: "Personal Development", summary: "Summary" },
    palmTitle: "Palm Reading", dominant: "dominant hand", left: "Left", right: "Right", hand: "hand", dominantTag: "dominant", palmShape: "palm shape",
    lines: { life: "Life line", head: "Head line", heart: "Heart line", fate: "Fate line", sun: "Sun line", mercury: "Mercury line" } as Record<string, string>,
    vis: { clear: "clear", faint: "faint", not_visible: "not clearly visible in this photo" } as Record<string, string>,
    shapes: { earth: "earth", air: "air", fire: "fire", water: "water", unclear: "unclear" } as Record<string, string>, mounts: "Mounts",
    palmMethod: ["Observations describe only what is visible in your photos. Lines that could not be traced are marked as not visible and are not interpreted.", "Interpretations follow traditional (Western and Indian Hasta Samudrika) palmistry meanings."],
    disclaimer: {
      numerology: "Numerology is a traditional interpretive practice, not a science. The numbers above are calculated exactly; what they mean is a matter of tradition and reflection, not prediction. Please don't base medical, legal or financial decisions on this reading.",
      tarot: "Tarot is a reflective, interpretive practice. The cards you drew were chosen with secure randomness and are interpreted by tradition; they do not predict fixed outcomes. Please don't base medical, legal or financial decisions on this reading.",
      palmistry: "Palmistry is a traditional interpretive practice, not a science. Observations describe only what is visible in your photos; interpretations are traditional meanings, not predictions. Please don't base medical, legal or financial decisions on this reading.",
    },
  },
  hi: {
    method: "पद्धति", note: "कृपया ध्यान दें", preparedFor: "के लिए तैयार", tagline: "आपका ब्रह्मांड। आपकी कहानी।", loShu: "लो शू ग्रिड", yourCards: "आपके कार्ड", missing: "अनुपस्थित",
    numSections: { overview: "अंक ज्योतिष परिचय", core: "आपके मूल अंक", personality: "व्यक्तित्व", career: "करियर और काम", relationships: "रिश्ते", strengths: "शक्तियाँ और चुनौतियाँ", year: "आपका व्यक्तिगत वर्ष", loshu: "लो शू ग्रिड", summary: "सार" },
    numTitle: (n: string) => `अंक ज्योतिष रिपोर्ट — ${n}`, tier: { basic: "बेसिक", detailed: "विस्तृत", complete: "संपूर्ण" } as Record<string, string>,
    methodName: { pythagorean: "पाइथागोरियन पद्धति", chaldean: "काल्डियन पद्धति" } as Record<string, string>,
    numConv: (m: string, y: number, yv = false) => [m === "pythagorean" ? "पाइथागोरियन अक्षर-मान (A–I = 1–9, J–R = 1–9, S–Z = 1–8); मास्टर अंक 11, 22 और 33 नहीं घटाए जाते।" : "काल्डियन अक्षर-मान (किसी अक्षर का मान 9 नहीं); नाम का योग यौगिक अंक के रूप में दिखाकर एक अंक तक घटाया जाता है।", yv ? "स्वर A, E, I, O, U हैं; आपके नाम में इनमें से कोई नहीं है, इसलिए Y को स्वर माना गया है।" : "स्वर A, E, I, O, U हैं; Y को व्यंजन माना गया है।", "मूलांक-पथ (लाइफ़ पाथ) में महीना, दिन और वर्ष अलग-अलग घटाकर उनका योग फिर घटाया जाता है।", `व्यक्तिगत वर्ष ${y} के लिए निकाला गया है।`, "लो शू ग्रिड आपकी पूरी जन्मतिथि के शून्य-रहित अंकों से बनता है।"],
    tarotSections: { overview: "आपका प्रश्न", synthesis: "कार्ड मिलकर क्या कहते हैं", guidance: "व्यावहारिक चिंतन" }, reversedTag: "उल्टा",
    tarotMethod: ["78 कार्ड का डेक (राइडर–वेट–स्मिथ परंपरा), सीधे और उल्टे अर्थ।", "डेक को सर्वर पर क्रिप्टोग्राफ़िक रूप से सुरक्षित यादृच्छिकता से फेंटा गया; आपने कार्ड उल्टे रखे हुए चुने।"],
    palmSections: { observations: "हम क्या देख पा रहे हैं (अवलोकन)", overview: "हथेली परिचय", personality: "व्यक्तित्व", career: "करियर", relationships: "रिश्ते", strengths: "शक्तियाँ", development: "व्यक्तिगत विकास", summary: "सार" },
    palmTitle: "हस्तरेखा पठन", dominant: "प्रमुख हाथ", left: "बायाँ", right: "दायाँ", hand: "हाथ", dominantTag: "प्रमुख", palmShape: "हथेली का आकार",
    lines: { life: "जीवन रेखा", head: "मस्तिष्क रेखा", heart: "हृदय रेखा", fate: "भाग्य रेखा", sun: "सूर्य रेखा", mercury: "बुध रेखा" } as Record<string, string>,
    vis: { clear: "स्पष्ट", faint: "हल्की", not_visible: "इस फ़ोटो में स्पष्ट नहीं दिखती" } as Record<string, string>,
    shapes: { earth: "पृथ्वी", air: "वायु", fire: "अग्नि", water: "जल", unclear: "अस्पष्ट" } as Record<string, string>, mounts: "पर्वत",
    palmMethod: ["अवलोकन केवल वही बताते हैं जो आपकी फ़ोटो में दिखता है। जो रेखाएँ स्पष्ट नहीं दिखीं, उन्हें 'स्पष्ट नहीं' लिखा गया है और उनकी व्याख्या नहीं की गई।", "व्याख्या पारंपरिक (पाश्चात्य और भारतीय हस्त सामुद्रिक) अर्थों पर आधारित है।"],
    disclaimer: {
      numerology: "अंक ज्योतिष एक पारंपरिक व्याख्यात्मक पद्धति है, विज्ञान नहीं। ऊपर के अंक सटीक गणना से निकाले गए हैं; उनके अर्थ परंपरा और चिंतन पर आधारित हैं, भविष्यवाणी नहीं। कृपया इस रीडिंग के आधार पर चिकित्सा, क़ानूनी या वित्तीय निर्णय न लें।",
      tarot: "टैरो एक चिंतनशील, व्याख्यात्मक पद्धति है। आपके कार्ड सुरक्षित यादृच्छिकता से चुने गए और परंपरा के अनुसार पढ़े गए हैं; ये तय परिणामों की भविष्यवाणी नहीं करते। कृपया इस रीडिंग के आधार पर चिकित्सा, क़ानूनी या वित्तीय निर्णय न लें।",
      palmistry: "हस्तरेखा शास्त्र एक पारंपरिक व्याख्यात्मक पद्धति है, विज्ञान नहीं। अवलोकन केवल आपकी फ़ोटो में दिखने वाली बातें बताते हैं; व्याख्याएँ पारंपरिक अर्थ हैं, भविष्यवाणी नहीं। कृपया इस रीडिंग के आधार पर चिकित्सा, क़ानूनी या वित्तीय निर्णय न लें।",
    },
  },
  hinglish: {
    method: "Method", note: "Dhyaan dijiye", preparedFor: "Ke liye taiyaar", tagline: "Aapka Brahmand. Aapki Kahani.", loShu: "Lo Shu grid", yourCards: "Aapke cards", missing: "GAAYAB",
    numSections: { overview: "Numerology Parichay", core: "Aapke Core Numbers", personality: "Vyaktitva", career: "Career aur Kaam", relationships: "Rishte", strengths: "Taaqat aur Chunautiyaan", year: "Aapka Personal Year", loshu: "Lo Shu Grid", summary: "Saar" },
    numTitle: (n: string) => `Numerology Report — ${n}`, tier: { basic: "Basic", detailed: "Detailed", complete: "Complete" } as Record<string, string>,
    methodName: { pythagorean: "Pythagorean method", chaldean: "Chaldean method" } as Record<string, string>,
    numConv: (m: string, y: number, yv = false) => [m === "pythagorean" ? "Pythagorean letter values (A–I = 1–9, J–R = 1–9, S–Z = 1–8); master numbers 11, 22 aur 33 ko reduce nahi kiya jaata." : "Chaldean letter values (kisi letter ki value 9 nahi); naam ka total compound number ki tarah dikha kar ek digit tak reduce hota hai.", yv ? "Vowels A, E, I, O, U hain; aapke naam mein inmein se koi nahi, isliye Y ko vowel maana gaya hai." : "Vowels A, E, I, O, U hain; Y ko consonant maana gaya hai.", "Life Path mein month, day aur year alag-alag reduce karke unka total phir reduce hota hai.", `Personal Year ${y} ke liye nikaala gaya hai.`, "Lo Shu grid aapki poori janm-tithi ke non-zero digits se banta hai."],
    tarotSections: { overview: "Aapka Sawaal", synthesis: "Cards Milkar Kya Kehte Hain", guidance: "Practical Reflection" }, reversedTag: "ulta",
    tarotMethod: ["78 cards ka deck (Rider–Waite–Smith parampara), seedhe aur ulte arth.", "Deck server par cryptographically secure randomness se shuffle hua; aapne cards ulte rakhe hue chune."],
    palmSections: { observations: "Hum Kya Dekh Paa Rahe Hain (observations)", overview: "Hatheli Parichay", personality: "Vyaktitva", career: "Career", relationships: "Rishte", strengths: "Taaqat", development: "Personal Growth", summary: "Saar" },
    palmTitle: "Palm Reading", dominant: "dominant haath", left: "Baayaan", right: "Daayaan", hand: "haath", dominantTag: "dominant", palmShape: "hatheli ka aakaar",
    lines: { life: "Jeevan rekha (life line)", head: "Mastishk rekha (head line)", heart: "Hriday rekha (heart line)", fate: "Bhagya rekha (fate line)", sun: "Surya rekha (sun line)", mercury: "Budh rekha (Mercury line)" } as Record<string, string>,
    vis: { clear: "saaf", faint: "halki", not_visible: "is photo mein saaf nahi dikhti" } as Record<string, string>,
    shapes: { earth: "earth (prithvi)", air: "air (vaayu)", fire: "fire (agni)", water: "water (jal)", unclear: "saaf nahi" } as Record<string, string>, mounts: "Mounts (parvat)",
    palmMethod: ["Observations sirf wahi batate hain jo aapki photo mein dikhta hai. Jo rekhayein saaf nahi dikhin, unhe 'saaf nahi' likha gaya hai aur unka arth nahi nikaala gaya.", "Arth paaramparik (Western aur Bhartiya Hast Samudrik) palmistry par based hain."],
    disclaimer: {
      numerology: "Numerology ek paaramparik interpretive practice hai, science nahi. Upar ke numbers exact calculation se nikle hain; unke arth parampara aur chintan par based hain, bhavishyavaani nahi. Is reading ke basis par medical, legal ya financial faisle na lijiye.",
      tarot: "Tarot ek chintan aur interpretation ki practice hai. Aapke cards secure randomness se chune gaye aur parampara ke hisaab se padhe gaye; yeh fixed results predict nahi karte. Is reading ke basis par medical, legal ya financial faisle na lijiye.",
      palmistry: "Palmistry ek paaramparik interpretive practice hai, science nahi. Observations sirf photo mein dikhne wali baatein batate hain; arth paaramparik hain, bhavishyavaani nahi. Is reading ke basis par medical, legal ya financial faisle na lijiye.",
    },
  },
} satisfies Record<RLang, unknown>;

export const rs = (l: RLang) => REPORT_STR[l];
