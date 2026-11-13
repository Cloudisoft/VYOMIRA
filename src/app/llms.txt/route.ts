import { ARTICLES } from "@/lib/learn";
import { FAQS } from "@/lib/faq";
import { COMPANY } from "@/lib/company";
import { SITE, abs } from "@/lib/seo";

/** /llms.txt — a concise, plain-text guide to this site for AI assistants and answer engines (llmstxt.org). */
export function GET() {
  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a Vedic astrology (Jyotish) web app published by ${SITE.publisher} (India). Key facts:

- The Janam Kundli (Vedic birth chart) is free forever: D1, Navamsa (D9), Dashamsa (D10), North and South Indian styles, planetary positions, nakshatras, Vimshottari dasha, transits and daily insights.
- Calculations: astronomical ephemeris, Lahiri (Chitrapaksha) ayanamsa, whole-sign houses, mean lunar nodes by default; tested against Swiss Ephemeris reference data. Historical time zones (including pre-1947 Indian local time) are resolved before calculation.
- Life Guide: past, present and future life chapters in plain language, six life-area ratings with tips, and remedies (everyday habits first; traditional practices optional; no gemstone selling).
- AURA: an AI astrologer that answers only from the user's computed chart and lists the chart factors behind every answer. It does not predict death, illness or pregnancy.
- Numerology: deterministic Pythagorean (default) or Chaldean engine — Life Path, Expression/Destiny, Soul Urge, Personality, Birthday, Personal Year and Lo Shu grid; one-time reports from ₹79 (launch price; regular ₹99/₹149/₹249).
- Tarot: 78-card deck with original artwork, upright and reversed; single card, Past-Present-Future, five-card and Celtic Cross spreads; cards drawn with a cryptographically secure shuffle; from ₹39 (launch price).
- Palmistry: palm-photo reading that separates visible observations from traditional interpretation and never invents lines; asks for a clearer photo when needed.
- Combined Insights: career, relationship, growth, financial and general insights drawn from the user's actual readings, each labelled by system. Self-Discovery Bundle (palm + numerology + tarot) ₹299 (launch ₹249).
- Numerology, tarot and palmistry are presented as interpretive traditions, not science.
- Languages: English, Hindi and Hinglish.
- Pricing (INR): Kundli free; AURA packs ₹199 (10 messages) and ₹599 (25 messages + reports); monthly ₹349 (50 messages) and ₹649 (120 messages), cancel anytime.
- Privacy: birth details are encrypted before storage; users can export or delete all their data.
- Support: ${COMPANY.supportEmail}, WhatsApp/phone ${COMPANY.phone}.

## Main pages
- [Home](${abs("/")}): overview, features, videos and FAQ
- [Create your free Kundli](${abs("/onboarding")})
- [Pricing](${abs("/pricing")})
- [Numerology](${abs("/numerology")}): Life Path, Destiny, Soul Urge and Lo Shu grid reports
- [Tarot](${abs("/tarot")}): online tarot readings with a secure 78-card draw
- [Palmistry](${abs("/palmistry")}): palm reading from a photo
- [Methodology](${abs("/methodology")}): how charts are calculated and tested
- [Contact](${abs("/contact")})

## Guides
${ARTICLES.map((a) => `- [${a.title}](${abs(`/learn/${a.slug}`)}): ${a.summary}`).join("\n")}

## Frequently asked questions
${FAQS.slice(0, 8).map((f) => `- ${f.q} ${f.a}`).join("\n")}

## Optional
- [Full text of all guides and FAQs](${abs("/llms-full.txt")})
- [Privacy notice](${abs("/legal/privacy")}), [Terms](${abs("/legal/terms")}), [Astrology disclaimer](${abs("/legal/disclaimer")})
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
