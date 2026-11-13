import type { Metadata } from "next";
import { ServiceLanding, type LandingCopy } from "@/components/home/ServiceLanding";

export const revalidate = 300; // prices come from admin config
const C: LandingCopy = {
  category: "numerology", eyebrow: "Numerology",
  title: "Your name and birth date, in numbers.",
  intro: "Your Life Path, Destiny, Soul Urge, Personality, Birthday and Personal Year numbers and your Lo Shu grid — calculated exactly, then explained in plain English, Hindi or Hinglish.",
  steps: [["Enter your details", "Your full name at birth and date of birth. Choose Pythagorean or Chaldean."], ["Pick your depth", "Basic, Detailed or Complete."], ["We calculate", "A deterministic engine works out every number. No guessing, no AI arithmetic."], ["Read & ask", "A clear report with the method stated, a PDF, and AURA for follow-up questions."]],
  includes: ["Life Path, Expression (Destiny), Soul Urge, Personality and Birthday numbers, with how each was calculated", "Personality, career and relationship insights (Detailed and Complete)", "Your Personal Year for this year — and the next two (Complete)", "Lo Shu grid with missing and repeated numbers and complete planes (Complete)", "Download as PDF; saved in My Readings forever"],
  trust: ["Numbers come from a tested calculation engine, never from an AI model.", "Pythagorean is the default; Chaldean is available. Every report states which method was used.", "Master numbers 11, 22 and 33 are kept in Pythagorean reductions.", "Numerology is a traditional interpretive practice, not a science — we present meanings as tradition, not prediction."],
  faqs: [
    { q: "What's the difference between Pythagorean and Chaldean numerology?", a: "They use different letter-to-number tables. Pythagorean (the most common) runs A–I as 1–9 and repeats; Chaldean is older, based on sound, and assigns no letter the number 9. Your date-based numbers (Life Path, Personal Year, Lo Shu) are the same in both." },
    { q: "Which name should I use?", a: "Traditionally, the full name on your birth certificate. You can create another reading for a name you use today and compare." },
    { q: "How is the Life Path number calculated?", a: "We reduce the month, day and year of birth separately to single digits (keeping master numbers 11, 22 and 33), add them, and reduce again." },
    { q: "Can numerology predict my future?", a: "No system can promise outcomes. Numerology offers themes for reflection — such as the character of your Personal Year — not guaranteed events." },
  ],
};
export const metadata: Metadata = { title: "Numerology Report — Life Path, Destiny & Lo Shu Grid", description: C.intro, alternates: { canonical: "/numerology" }, openGraph: { url: "/numerology", title: "Numerology report — VYOMIRA", description: C.intro, images: ["/og/default.jpg"] } };
export default function Page() { return <ServiceLanding c={C} />; }
