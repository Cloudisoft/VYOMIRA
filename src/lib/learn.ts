export interface Article {
  slug: string;
  title: string;
  summary: string;
  /** Paragraphs; a line starting with "## " renders as a sub-heading (phrased as a question where possible). */
  body: string[];
  faqs?: { q: string; a: string }[];
  updated?: string;
}

export const ARTICLES: Article[] = [
  {
    slug: "what-is-janam-kundli",
    title: "What is a Janam Kundli (Vedic birth chart)?",
    summary: "A Janam Kundli is a map of where the Sun, Moon, planets and the rising sign were at the exact moment and place you were born, read through the Vedic (sidereal) zodiac.",
    updated: "2026-11-06",
    body: [
      "A Janam Kundli — also called a Janam Patri or Vedic birth chart — is a snapshot of the sky at the moment you were born, as seen from your birthplace. It records which zodiac sign and nakshatra each of the nine grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu) occupied, and which sign was rising on the eastern horizon (the Lagna).",
      "## What do you need to make a Kundli?",
      "Three things: your date of birth, your time of birth, and your place of birth. The place gives the latitude, longitude and historical time zone; the time decides the rising sign, which moves about one sign every two hours. Without an accurate time, the planets' signs are still reliable but the houses and rising sign are not.",
      "## What does a Kundli show?",
      "The twelve houses (life areas such as self, wealth, home, relationships and career), the planet in each house, each planet's sign and nakshatra, its strength (dignity), the Vimshottari dasha periods that time your life chapters, and divisional charts such as the Navamsa (D9) for relationships and Dashamsa (D10) for career.",
      "## Is a free online Kundli accurate?",
      "It can be, if the calculation is done properly. VYOMIRA computes planetary positions with an astronomical engine, converts them to the sidereal zodiac with the Lahiri ayanamsa, and tests the results against Swiss Ephemeris reference data. The biggest source of error is usually an uncertain birth time, not the software.",
    ],
    faqs: [
      { q: "What is the difference between a Kundli and a horoscope?", a: "A Kundli is your personal birth chart, calculated for your exact birth time and place. A newspaper horoscope is a general reading for everyone with the same Sun or Moon sign." },
      { q: "Can I make a Kundli without a birth time?", a: "Yes, but only partly. Planet signs and nakshatras will be right; the rising sign and houses cannot be known, so readings are based on the Moon sign instead." },
      { q: "Is the VYOMIRA Kundli free?", a: "Yes — the full chart, dasha timeline, daily insights and Life Guide are free forever." },
    ],
  },
  {
    slug: "sade-sati",
    title: "Sade Sati: what it is — and what it isn't",
    summary: "Sade Sati is the roughly 7½-year period when Saturn passes through the sign before, the sign of, and the sign after your natal Moon. Tradition reads it as a time of responsibility and maturing, not inevitable misfortune.",
    updated: "2026-11-06",
    body: [
      "Sade Sati (literally “seven and a half”) is the time Saturn takes to transit three consecutive signs: the 12th sign from your natal Moon, the Moon's own sign, and the 2nd sign from it. Saturn spends about two and a half years in each, so the whole phase lasts about seven and a half years. Most people experience it two or three times in a lifetime.",
      "## Is Sade Sati always bad?",
      "No. Classical texts associate it with pressure, heavier responsibilities and slower results — and also with discipline, maturity and lasting achievement. How it feels depends on Saturn's strength in your chart, your current dasha, and the sign involved. Fear-based readings that predict disaster are not supported by the tradition's own nuance.",
      "## What are the three phases?",
      "Rising (Saturn in the 12th from the Moon): expenses, sleep and letting go. Peak (Saturn over the Moon): emotional weight and big decisions. Setting (Saturn in the 2nd): money, family and speech. The intensity usually eases in the final phase.",
      "## What can you do during Sade Sati?",
      "Traditional advice centres on Saturn's own qualities: keep a steady routine, be patient, work honestly, serve others (especially elders and workers), and avoid shortcuts. Recitation of Saturn's mantra on Saturdays and charitable giving are traditional practices; none of them require buying anything.",
    ],
    faqs: [
      { q: "How do I know if I am in Sade Sati?", a: "Check which sign Saturn is transiting and compare it with your Moon sign. If Saturn is in the 12th, 1st or 2nd sign from your Moon sign, Sade Sati is active. VYOMIRA shows this automatically on your dashboard." },
      { q: "How long does Sade Sati last?", a: "About seven and a half years — roughly two and a half years in each of the three signs." },
    ],
  },
  {
    slug: "rahu-and-ketu",
    title: "Rahu and Ketu, the lunar nodes",
    summary: "Rahu and Ketu are not physical planets but the two points where the Moon's orbit crosses the Sun's apparent path. In Jyotish, Rahu signifies desire and the unfamiliar; Ketu signifies detachment and past mastery.",
    updated: "2026-11-06",
    body: [
      "Rahu and Ketu are the north and south lunar nodes: the two points where the Moon's orbital plane intersects the ecliptic. Eclipses happen when the Sun and Moon line up near these points, which is why mythology links the nodes to eclipses. They are always exactly opposite each other and move backwards through the zodiac, taking about 18 years for a full cycle.",
      "## What does Rahu mean in a chart?",
      "Rahu amplifies the house and sign it occupies: ambition, fascination, the foreign and the unconventional, technology, and sometimes obsession. Its house often shows where you hunger to grow.",
      "## What does Ketu mean in a chart?",
      "Ketu represents detachment, intuition, research and spirituality — areas where you may have natural skill but less attachment. Its house can show where you let go more easily.",
      "## Mean node or true node?",
      "The mean node is a smoothed average position; the true node includes the Moon's orbital wobble and can differ by up to about 1.5°. Many Indian almanacs use the mean node, which is VYOMIRA's default.",
    ],
    faqs: [
      { q: "Are Rahu and Ketu real planets?", a: "No. They are mathematical points — the lunar nodes — where the Moon's orbit crosses the ecliptic. Jyotish treats them as shadow planets (chaya grahas)." },
      { q: "How long is a Rahu Mahadasha?", a: "18 years in the Vimshottari dasha system; Ketu's Mahadasha lasts 7 years." },
    ],
  },
  {
    slug: "manglik-dosha",
    title: "Manglik (Kuja) dosha, explained calmly",
    summary: "Manglik dosha is a traditional marriage-matching rule about Mars' placement. It is extremely common, has many classical cancellations, and is only one factor among many.",
    updated: "2026-11-06",
    body: [
      "A chart is called Manglik (or Kuja dosha) when Mars sits in certain houses — most commonly the 1st, 2nd, 4th, 7th, 8th or 12th — counted from the rising sign, and in some traditions also from the Moon or Venus. Mars represents energy and assertiveness, and the rule is meant to flag where that energy could create friction in partnership.",
      "## How common is Manglik dosha?",
      "Very common. Because six of the twelve houses qualify, a large share of people meet the basic condition — often quoted as close to half when counted from the Lagna alone. That is one reason classical texts list many cancellations.",
      "## What cancels Manglik dosha?",
      "Traditional cancellations include Mars in its own sign or exaltation, certain sign placements of Mars, Jupiter's aspect, and both partners being Manglik. Different lineages weigh these differently.",
      "## Should it decide a marriage?",
      "No single factor should. Matching in Jyotish considers the full Guna Milan (36 points), both charts' 7th houses and Venus, and — most importantly — the two people themselves. VYOMIRA's compatibility tool shows each factor transparently instead of a single verdict.",
    ],
    faqs: [
      { q: "Is being Manglik bad?", a: "No. It is a common placement of Mars, often cancelled by other factors, and tradition treats it as one consideration in matching — not a judgement about a person." },
      { q: "Do I need a remedy for Manglik dosha?", a: "Not necessarily. Many charts have cancellations. Talk openly with your partner and treat any traditional practice as optional, never as something you must pay for." },
    ],
  },
  {
    slug: "how-to-read-your-kundli",
    title: "How to read your Kundli in five steps",
    summary: "Start with your rising sign, then the Moon, then the house your current dasha lord sits in, then strong and weak planets, then current transits.",
    updated: "2026-11-06",
    body: [
      "## Step 1: Find your Lagna (rising sign)",
      "The Lagna is house 1 — your body, temperament and how life meets you. Its sign colours everything else. In a North Indian chart it is the top diamond; in a South Indian chart it is marked inside its sign box.",
      "## Step 2: Note your Moon sign and nakshatra",
      "The Moon describes your mind and emotional needs. Your Moon's nakshatra also decides which Vimshottari dasha you were born into.",
      "## Step 3: Check your current Mahadasha",
      "Look at which planet's period you are in and which house that planet occupies and rules. That house is where the current chapter of life tends to focus.",
      "## Step 4: Spot strong and weak planets",
      "Planets in their own or exaltation signs express their themes easily; debilitated or combust planets need more conscious effort. Shadbala gives a numerical view of strength.",
      "## Step 5: Look at Saturn and Jupiter's transits",
      "Slow planets moving through your chart now show the year's background weather: Jupiter where growth is supported, Saturn where patience is asked of you. VYOMIRA's Life Guide combines all five steps into plain language for you.",
    ],
    faqs: [
      { q: "Which house in the Kundli is for career?", a: "Primarily the 10th house, supported by the 6th (daily work) and 2nd and 11th (income). The Dashamsa (D10) chart refines it." },
      { q: "Which house is for marriage?", a: "The 7th house, with Venus (and Jupiter for women in some traditions) and the Navamsa (D9) chart." },
    ],
  },
  {
    slug: "sidereal-zodiac-and-ayanamsa",
    title: "The sidereal zodiac and the ayanamsa",
    summary: "Why Vedic signs sit about 24° behind Western ones, and what the Lahiri ayanamsa measures.",
    body: [
      "Western astrology anchors Aries 0° to the March equinox — a seasonal point. Vedic astrology anchors the zodiac to the fixed stars. Because Earth's axis slowly wobbles (precession, one full cycle in roughly 25,800 years), the equinox drifts backwards against the stars by about 50 arcseconds a year.",
      "The ayanamsa is the angle between those two starting points. VYOMIRA uses the Lahiri (Chitrapaksha) ayanamsa — the standard adopted by India's Calendar Reform Committee — which places the star Spica (Chitra) at 0° Libra. In 2026 it is a little over 24°.",
      "We compute it with the IAU 1976 precession model from a fixed reference epoch, the same definition used by Swiss Ephemeris. Every chart shows the exact ayanamsa value used, so you can compare with any other software.",
    ],
  },
  {
    slug: "nakshatras",
    title: "Nakshatras: the 27 lunar mansions",
    summary: "The Moon's nakshatra is the heart of Vedic timing. Here's how it's measured.",
    body: [
      "The ecliptic is divided into 27 nakshatras of 13°20′ each — roughly the distance the Moon travels in a day. Each is subdivided into four padas of 3°20′.",
      "Your Janma Nakshatra is the one the Moon occupied at birth. Its ruling planet sets the first period of your Vimshottari dasha, and how far the Moon had travelled through it sets how much of that period remained.",
      "Because the Moon moves about 13° a day, the nakshatra can change within hours — which is why we tell you when your birth-time precision makes it uncertain.",
    ],
  },
  {
    slug: "vimshottari-dasha",
    title: "Vimshottari Dasha, explained",
    summary: "A 120-year cycle of planetary chapters — Mahadashas, Antardashas and Pratyantardashas.",
    body: [
      "Vimshottari assigns each of the nine grahas a period: Ketu 7 years, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19 and Mercury 17 — 120 in total.",
      "The sequence begins with the lord of your Janma Nakshatra. Each Mahadasha divides into nine Antardashas in the same order, proportional to their lengths, and each Antardasha divides again into Pratyantardashas.",
      "VYOMIRA uses a 365.25-day dasha year; some traditions use other year lengths, which shift dates slightly. We state the convention on every chart.",
    ],
  },
  {
    slug: "houses-and-lagna",
    title: "Lagna and the twelve houses",
    summary: "Why your birth time matters so much, and how whole-sign houses work.",
    body: [
      "The Lagna (ascendant) is the zodiac degree rising on the eastern horizon at your birth. It moves through all twelve signs in about a day — roughly one sign every two hours, faster or slower depending on latitude.",
      "VYOMIRA uses whole-sign houses, the most common convention in Parashari practice: the entire Lagna sign is the 1st house, the next sign the 2nd, and so on.",
      "If your birth time is uncertain enough that the Lagna could fall in a different sign, we don't pretend otherwise: house-based readings are withheld and we count from the Moon instead.",
    ],
  },
  {
    slug: "divisional-charts",
    title: "Navamsa (D9) and Dashamsa (D10)",
    summary: "Divisional charts zoom into each sign. Two of the most used, and how they're built.",
    body: [
      "A divisional chart (varga) divides each sign into equal parts and maps each part to a sign. The Navamsa divides each sign into nine parts of 3°20′; it is traditionally consulted for partnership and the inner strength of planets.",
      "The Dashamsa divides each sign into ten parts of 3°. Odd signs count from themselves, even signs from the ninth sign. It is traditionally consulted for career.",
      "Divisional ascendants change every few minutes, so they need an exact birth time; we withhold them otherwise.",
    ],
  },
  {
    slug: "astronomy-astrology-ai",
    title: "Astronomy, astrology and AI — what each part does",
    summary: "How VYOMIRA keeps calculation, tradition and language generation honestly separate.",
    body: [
      "Astronomy is the measurable part: where the planets were. We compute positions with an ephemeris and test them against an independent reference.",
      "Astrology is the interpretive tradition: what those positions are said to mean. Our rule catalog is versioned and cited, and we present its readings as tradition, not science.",
      "AI is only a writer. It receives the chart evidence and phrases it conversationally; a validator rejects anything it adds that isn't in your chart.",
    ],
  },
];
