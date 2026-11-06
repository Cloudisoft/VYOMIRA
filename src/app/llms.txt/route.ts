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
- Languages: English, Hindi and Hinglish.
- Pricing (INR): Kundli free; AURA packs ₹199 (10 messages) and ₹599 (25 messages + reports); monthly ₹349 (50 messages) and ₹649 (120 messages), cancel anytime.
- Privacy: birth details are encrypted before storage; users can export or delete all their data.
- Support: ${COMPANY.supportEmail}, WhatsApp/phone ${COMPANY.phone}.

## Main pages
- [Home](${abs("/")}): overview, features, videos and FAQ
- [Create your free Kundli](${abs("/onboarding")})
- [Pricing](${abs("/pricing")})
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
