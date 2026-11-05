/**
 * Pre-generation safety routing. Runs before any chart interpretation so that sensitive
 * questions get a careful, non-astrological response and never consume a paid unit.
 */
export type GuardResult = { kind: "ok" } | { kind: "crisis"; reply: string } | { kind: "boundary"; reply: string; suggestion: string };

const CRISIS = /\b(suicid|kill myself|end my life|want to die|self[- ]harm|hurt myself|no reason to live|marna chahta|marna chahti|आत्महत्या|जीना नहीं)/i;
const DEATH = /\b(when will i die|my death|death date|how long will i live|lifespan|ayu|मृत्यु|मौत)\b/i;
const MEDICAL = /\b(cancer|diseas|diagnos|illness|surger|medicin|tumou?r|pregnan|conceiv|infertil|miscarriag|ivf\b)/i;
const FINANCE = /\b(lotter|stocks?\b|shares\b|crypto|bitcoin|which coin|gambl|satta|bet on|betting)/i;
const LEGAL = /\b(court case|lawsuit|will i win the case|divorce settlement|bail\b)/i;

export function guard(question: string, lang: "en" | "hi" | "hinglish"): GuardResult {
  if (CRISIS.test(question)) {
    return {
      kind: "crisis",
      reply:
        lang === "hi"
          ? "आप जो महसूस कर रहे हैं वह सच में भारी लगता है, और आपको इसे अकेले नहीं उठाना है। कृपया अभी किसी भरोसेमंद व्यक्ति से बात करें या भारत में Tele-MANAS हेल्पलाइन 14416 (24×7, निःशुल्क) पर कॉल करें। अगर आप तत्काल खतरे में हैं तो 112 पर कॉल करें। भारत के बाहर: findahelpline.com"
          : "It sounds like you're carrying something really heavy, and you don't have to hold it alone. Please reach out to someone you trust right now, or call Tele-MANAS on 14416 (India, free, 24×7). If you are in immediate danger, call 112 (India) or your local emergency number. Outside India you can find a free helpline at findahelpline.com. Astrology isn't the right tool for this moment — a caring human is.",
    };
  }
  const boundary = (what: string, suggestion: string): GuardResult => ({
    kind: "boundary",
    reply: `I don't make predictions about ${what}. Vedic astrology is a traditional, symbolic system and it can't responsibly forecast outcomes like that — please speak to a qualified professional for anything ${what === "health, illness or pregnancy" ? "medical" : what === "investments or gambling" ? "financial" : "legal"}. I'm happy to explore ${suggestion} in your chart instead.`,
    suggestion,
  });
  if (DEATH.test(question)) return { kind: "boundary", reply: "I don't predict lifespan or death — no astrologer can do that responsibly, and VYOMIRA won't. If something is worrying you, I'd gently suggest talking it through with someone you trust. I can explore what your current planetary period emphasizes for your wellbeing and personal growth instead.", suggestion: "personal growth" };
  if (MEDICAL.test(question)) return boundary("health, illness or pregnancy", "themes of routine, rest and self-care");
  if (FINANCE.test(question)) return boundary("investments or gambling", "your traditional wealth and career themes");
  if (LEGAL.test(question)) return boundary("legal outcomes", "how your current period emphasizes patience and communication");
  return { kind: "ok" };
}
