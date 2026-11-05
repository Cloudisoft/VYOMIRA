export const ARTICLES = [
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
