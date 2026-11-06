/* Five 30-second promo videos. Every claim here is backed by a shipped feature. Times in seconds. */
window.VIDEOS = {
  1: {
    slug: "meet-vyomira",
    title: "Meet VYOMIRA",
    music: 1,
    scenes: [
      { t: [0, 5], type: "hook", lines: ["Your universe has a story.", "VYOMIRA reads it from the real sky."], accent: "real sky." },
      { t: [5, 11], type: "shot", img: "home", eyebrow: "Meet VYOMIRA", title: "Vedic astrology, computed — not guessed", text: "Your Kundli is calculated from real planetary positions for your exact birth moment and place.", from: [0, 0, 1.0], to: [0.04, 0.02, 1.12] },
      { t: [11, 17.5], type: "points", eyebrow: "What makes it different", title: "Precise. Transparent. Simple.", items: [["Real astronomy", "Every planet computed for your exact moment and place"], ["AI that shows its work", "AURA cites the chart factors behind every answer"], ["Plain-language guidance", "Past, present, future — and what you can do"]] },
      { t: [17.5, 24], type: "shot", img: "dashboard", side: "right", eyebrow: "Your universe", title: "Your whole chart, in one calm place", text: "Your story in simple words, daily insights, life chapters and a Kundli you can explore.", from: [0, 0, 1.0], to: [0.0, 0.06, 1.1] },
      { t: [24, 30], type: "outro", line: "Your Kundli is free. Forever." },
    ],
  },
  2: {
    slug: "real-sky-real-maths",
    title: "Real sky, real maths",
    music: 2,
    scenes: [
      { t: [0, 5], type: "hook", lines: ["Generic horoscopes fit millions.", "Your chart fits only you."], accent: "only you." },
      { t: [5, 11], type: "shot", img: "ready", eyebrow: "Precise calculation", title: "Your exact moment, handled with care", text: "Historical time zones — including pre-1947 Indian local time — are resolved before a single planet is placed.", from: [0.02, 0.05, 1.05], to: [0.04, 0.12, 1.18] },
      { t: [11, 17.5], type: "points", eyebrow: "Built on real astronomy", title: "Nothing improvised", items: [["Astronomical engine", "Planet positions computed, not looked up in tables"], ["Lahiri ayanamsa", "The sidereal standard used across India"], ["Cross-checked", "Verified against Swiss Ephemeris reference data"]] },
      { t: [17.5, 24], type: "shot", img: "kundli", side: "right", eyebrow: "Your Kundli", title: "Every degree and house — visible", text: "North & South Indian charts, Navamsa, Dasamsa, Shadbala and Ashtakavarga. Nothing hidden.", from: [0.0, 0.0, 1.0], to: [0.06, 0.08, 1.16] },
      { t: [24, 30], type: "outro", line: "See your real sky — free." },
    ],
  },
  3: {
    slug: "aura-shows-its-work",
    title: "AURA shows its work",
    music: 3,
    scenes: [
      { t: [0, 4.5], type: "hook", lines: ["Ask anything about your chart.", "See exactly why."], accent: "exactly why." },
      { t: [4.5, 11.5], type: "shot", img: "aura", eyebrow: "Meet AURA", title: "An AI astrologer that shows its reasons", text: "Every answer lists the chart factors it used — so you can check it, not just trust it.", from: [0.05, 0.02, 1.05], to: [0.1, 0.18, 1.2] },
      { t: [11.5, 18], type: "points", eyebrow: "Honest by design", title: "Guidance you can trust", items: [["Grounded", "Answers come only from your computed chart"], ["Careful", "No fear-based predictions about death or illness"], ["Your language", "English, हिन्दी and Hinglish"]] },
      { t: [18, 24.5], type: "compare", eyebrow: "Why it's different", title: "Not just another astrology app", head: ["", "Many apps", "VYOMIRA"], rows: [["Explains the reasons behind answers", "Rarely", "Always"], ["Calculated for your exact birth place & time", "Sometimes", "Always"], ["Fear-based upsells", "Common", "Never"]] },
      { t: [24.5, 30], type: "outro", line: "Your first question is on us." },
    ],
  },
  4: {
    slug: "your-life-guide",
    title: "Your Life Guide",
    music: 4,
    scenes: [
      { t: [0, 4.5], type: "hook", lines: ["Past. Present. Future.", "In words you actually understand."], accent: "understand." },
      { t: [4.5, 10.5], type: "shot", img: "guide-top", eyebrow: "My Life Guide", title: "Your life, chapter by chapter", text: "See the chapters you've lived, the one you're in now, and what's coming next.", from: [0.0, 0.0, 1.0], to: [0.05, 0.04, 1.14] },
      { t: [10.5, 16.5], type: "shot", img: "guide-future", side: "right", eyebrow: "What's coming", title: "Dates you can plan around", text: "Upcoming phases and planetary shifts — each explained in one simple sentence.", from: [0.03, 0.06, 1.05], to: [0.08, 0.14, 1.16] },
      { t: [16.5, 22.5], type: "shot", img: "guide-areas", eyebrow: "Life areas", title: "Career, love, money, health — at a glance", text: "Each area rated supportive, mixed or needs care, with a practical tip.", from: [0.02, 0.06, 1.05], to: [0.06, 0.1, 1.14] },
      { t: [22.5, 26.5], type: "shot", img: "guide-remedies", side: "right", eyebrow: "What you can do", title: "Simple steps to make it better", text: "Everyday habits first, then traditional practices — no pressure to buy gemstones.", from: [0.03, 0.05, 1.05], to: [0.06, 0.12, 1.12] },
      { t: [26.5, 30], type: "outro", line: "Read your Life Guide — free." },
    ],
  },
  5: {
    slug: "fair-and-private",
    title: "Fair & private",
    music: 5,
    scenes: [
      { t: [0, 4.5], type: "hook", lines: ["Astrology without", "the expensive consultation."], accent: "expensive consultation." },
      { t: [4.5, 11], type: "shot", img: "pricing", eyebrow: "Honest pricing", title: "Your Kundli is free. Forever.", text: "Talk to AURA with packs from ₹199, or monthly from ₹349 — cancel anytime.", from: [0.04, 0.08, 1.05], to: [0.08, 0.16, 1.16] },
      { t: [11, 17.5], type: "points", eyebrow: "Your data stays yours", title: "Private by default", items: [["Encrypted", "Birth details are encrypted before they're stored"], ["Never sold", "No ads, no selling your data"], ["Delete anytime", "Export or erase everything yourself"]] },
      { t: [17.5, 24], type: "compare", eyebrow: "Why people choose VYOMIRA", title: "Fair, open and private", head: ["", "Typical consultation", "VYOMIRA"], rows: [["Your birth chart", "Often paid", "Free forever"], ["One question answered", "Often ₹500+", "From ₹19.9"], ["See how it was worked out", "Rarely", "Every time"]] },
      { t: [24, 30], type: "outro", line: "Start with your free Kundli." },
    ],
  },
};
