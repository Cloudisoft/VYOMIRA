"use client";
import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/Reveal";

export const FAQS = [
  { q: "Is VYOMIRA's chart calculation accurate?", a: "Planetary positions are computed with an astronomical ephemeris (Astronomy Engine) and converted to the sidereal zodiac with the Lahiri ayanamsa. Our automated tests compare every planet, the ascendant and the ayanamsa against an independent Swiss Ephemeris reference for 16 charts from 1868 to 2030 across both hemispheres; agreement is typically within a few arcseconds. Accuracy of the chart also depends on the accuracy of your birth time and place." },
  { q: "Can astrology predict my future?", a: "No one can honestly promise that. Vedic astrology is a traditional interpretive system; we present its readings as traditional interpretations and reflection prompts, not as scientifically established predictions. We never forecast death, illness, pregnancy or financial outcomes, and we don't sell gemstones or fear-based remedies." },
  { q: "What if I don't know my exact birth time?", a: "Choose 'approximate' or 'unknown' during onboarding. With an approximate time we check whether your rising sign could change within the uncertainty window and withhold house-based readings if it can. With an unknown time we never show an ascendant; houses are counted from the Moon instead, and dasha dates are marked as indicative." },
  { q: "Which ayanamsa and house system do you use?", a: "Lahiri (Chitrapaksha) ayanamsa — India's official standard — and whole-sign houses from the Lagna, with mean lunar nodes for Rahu and Ketu. Every chart records its exact calculation version so results are reproducible." },
  { q: "How does AURA avoid making things up?", a: "AURA never sees your raw data — only a compact evidence package of computed placements, dashas, transits and rule interpretations. After it writes an answer, a validator checks every planet–sign, planet–house, nakshatra, yoga, dasha and year it mentions against your chart. Anything unsupported is rejected, and you receive a rule-engine answer instead." },
  { q: "Do I have to share my birth data with an AI provider?", a: "Only if you choose to. AI processing is a separate, explicit consent you can withdraw in Settings at any time. Without it, AURA answers using VYOMIRA's rule engine alone." },
  { q: "How much does it cost?", a: "Your full Kundli, planetary positions, Navamsa, Dashamsa and Vimshottari timeline are free, along with one AURA question. Starter (₹199) adds 10 AURA messages; Cosmic Plus (₹599) adds 25 messages, every detailed report and PDF downloads, and priority generation with a deeper model. Prices are shown in your local currency outside India. Packs are one-time purchases — no subscription." },
  { q: "Can I delete my data?", a: "Yes. From Settings you can export everything we hold about you as JSON, or permanently delete your account, birth profiles, charts, conversations and reports." },
  { q: "Is this a substitute for professional advice?", a: "No. Please consult a qualified doctor, lawyer, counsellor or financial adviser for those matters. If you're going through a crisis, contact Tele-MANAS on 14416 (India) or your local emergency number." },
];

export function Faq() {
  return (
    <section id="faq" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading align="center" eyebrow="Questions" title="Frequently asked" />
        <Accordion.Root type="single" collapsible className="mt-14 divide-y divide-[rgba(165,139,255,.14)] border-y hairline">
          {FAQS.map((f, i) => (
            <Accordion.Item key={i} value={`q${i}`}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className="font-display text-xl text-moon md:text-2xl">{f.q}</span>
                  <Plus className="h-5 w-5 shrink-0 text-gold transition-transform duration-300 group-data-[state=open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
                <p className="pb-6 leading-relaxed text-slate">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
    </section>
  );
}
