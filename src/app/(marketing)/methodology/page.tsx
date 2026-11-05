import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { COMPUTATION_VERSION } from "@/lib/astro/chart";
import { RULES_VERSION } from "@/lib/interpret/catalog";
import { YOGA_RULES_VERSION } from "@/lib/astro/yogas";

export const metadata: Metadata = { title: "Methodology", description: "How VYOMIRA computes Vedic charts, which conventions it uses, how it is tested, and how AI is constrained." };

export default function Methodology() {
  return (
    <ContentPage eyebrow="Methodology" title="How VYOMIRA calculates and interprets" intro="Everything we compute is reproducible: every chart carries its calculation version and conventions.">
      <h2>1. Time and place</h2>
      <p>Birthplaces come from the GeoNames database (cities with 15,000+ residents), each with its own IANA timezone identifier. Local birth time is converted to UTC using the full historical tz database — including local mean time, pre-independence Indian zones, wartime offsets and daylight saving. Times that occurred twice (clocks set back) are flagged and you can choose the occurrence; times that never existed (clocks set forward) are flagged for you to verify. We never infer a timezone from longitude.</p>
      <h2>2. Astronomy</h2>
      <ul>
        <li>Ephemeris: {COMPUTATION_VERSION.ephemeris} (MIT-licensed; VSOP87-based planets, NAO lunar theory), geocentric apparent positions with light-time and aberration.</li>
        <li>Ayanamsa: {COMPUTATION_VERSION.ayanamsaDefinition}.</li>
        <li>Rahu/Ketu: mean lunar node (Meeus 47.7). True node is not offered yet.</li>
        <li>Ascendant: from apparent sidereal time and true obliquity, converted to the sidereal zodiac.</li>
      </ul>
      <h3>Verification</h3>
      <p>Automated regression tests compare each planet, the mean node, the ascendant and the ayanamsa against Swiss Ephemeris (used only as an independent test oracle, not shipped) for charts spanning 1868–2030, both hemispheres, the equator, above the Arctic circle, leap days and DST transitions. Current tolerances: Sun/Moon/planets within 30″, ascendant within 30″, ayanamsa within 2″; observed agreement is typically a few arcseconds.</p>
      <h2>3. Vedic conventions</h2>
      <ul>
        <li>Houses: {COMPUTATION_VERSION.houseSystem}.</li>
        <li>Divisional charts: D1, D9 (Navamsa), D10 (Dashamsa) by Parashari rules.</li>
        <li>Vimshottari dasha with {COMPUTATION_VERSION.dashaYear} per year; Mahadasha, Antardasha and Pratyantardasha.</li>
        <li>Aspects: {COMPUTATION_VERSION.aspects}.</li>
        <li>Panchang: tithi, nakshatra, yoga, karana, and vara counted from local sunrise.</li>
        <li>Yogas: a catalog of precisely defined combinations ({YOGA_RULES_VERSION}); cancellation rules are not evaluated unless stated.</li>
      </ul>
      <h3>Not yet offered</h3>
      <p>Ashtakavarga, Shadbala, other divisional charts and full 36-point Guna Milan are deliberately not offered until their conventions are validated. Compatibility shows only Nadi, Bhakoot and Gana.</p>
      <h2>4. Interpretation ({RULES_VERSION})</h2>
      <p>Layer 1 computes the chart. Layer 2 applies versioned rules to produce evidence: each factor records the chart fact, the traditional reading, its polarity, and the rule id. Layer 3 selects the factors relevant to your question's theme, current dasha and transits. Layer 4 (optional, with your consent) asks a language model to phrase that evidence. Layer 5 validates the output: every planet–sign, planet–house, nakshatra, yoga, dasha lord and year must exist in your evidence, and guardrail phrases (certainty claims, death, illness, pregnancy, gem sales, investment tips) are rejected. Failing drafts are regenerated once, then replaced with a rule-engine answer.</p>
      <h2>5. Confidence</h2>
      <p>We separate computational confidence (how sure the numbers are, given your inputs) from interpretive uncertainty (astrology itself). With an approximate birth time we test the whole uncertainty window and withhold anything that changes inside it. With an unknown time we never show an ascendant.</p>
    </ContentPage>
  );
}
