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
      <h3>Advanced calculations and how they are verified</h3>
      <ul>
        <li><strong>Divisional charts</strong> D1, D2 (Parashari hora), D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30 (Parashari trimshamsa), D40, D45, D60 — all positions match PyJHora (an independent open-source implementation) on every reference chart. Divisional ascendants are withheld when they change faster than your birth-time precision.</li>
        <li><strong>Ashtakavarga</strong> — BPHS bindu tables as published by B.V. Raman (totals 48/49/39/54/56/52/39 = 337). Sun, Mars, Mercury, Jupiter and Saturn match PyJHora exactly; PyJHora uses variant tables for a few Moon and Venus cells.</li>
        <li><strong>Shadbala</strong> — all six components per BPHS. Sthana bala matches PyJHora exactly except for two documented conventions (whole-sign vs bhava Kendradi; Moon's moolatrikona 4°–20°). Abda/Masa lords use the Kali ahargana; Cheshta bala uses apparent motion. Yuddha bala is not applied. Shown only for exact birth times.</li>
        <li><strong>True node</strong> — osculating lunar node from the Moon's state vector, within 2′ of Swiss Ephemeris. Dashas and yogas use the mean node; the chart can display either.</li>
        <li><strong>Western chart</strong> — tropical apparent positions incl. Uranus–Pluto, Placidus houses (whole-sign fallback above ~66° latitude), Ptolemaic aspects; within 30″ of Swiss Ephemeris.</li>
        <li><strong>Guna Milan</strong> — full 36-point Ashtakoota (version ashtakoota-1.0.0). Varna by element, Tara by the 9-fold count, Bhakoot and Nadi by classical rules; Vashya, Yoni and Gana tables from the open-source Maitreya documentation; Graha Maitri from BPHS natural friendships. Gana and Nadi match PyJHora for all 11,664 nakshatra-pada pairs. Dosha exceptions are reported, not silently applied.</li>
      </ul>
      <h2>4. Interpretation ({RULES_VERSION})</h2>
      <p>Layer 1 computes the chart. Layer 2 applies versioned rules to produce evidence: each factor records the chart fact, the traditional reading, its polarity, and the rule id. Layer 3 selects the factors relevant to your question's theme, current dasha and transits. Layer 4 (optional, with your consent) asks a language model to phrase that evidence. Layer 5 validates the output: every planet–sign, planet–house, nakshatra, yoga, dasha lord and year must exist in your evidence, and guardrail phrases (certainty claims, death, illness, pregnancy, gem sales, investment tips) are rejected. Failing drafts are regenerated once, then replaced with a rule-engine answer.</p>
      <h2>5. Confidence</h2>
      <p>We separate computational confidence (how sure the numbers are, given your inputs) from interpretive uncertainty (astrology itself). With an approximate birth time we test the whole uncertainty window and withhold anything that changes inside it. With an unknown time we never show an ascendant.</p>
    </ContentPage>
  );
}
