import type { Metadata } from "next";
import { ServiceLanding, type LandingCopy } from "@/components/home/ServiceLanding";

export const revalidate = 300; // prices come from admin config
const C: LandingCopy = {
  category: "tarot", eyebrow: "Tarot",
  title: "Ask a question. Choose your cards.",
  intro: "Choose an area of life, ask your question, pick a spread and draw from a securely shuffled 78-card deck. Watch your cards turn, then read an interpretation of exactly the cards you drew.",
  steps: [["Choose a topic", "Career, love, money, growth or general guidance — with an optional question."], ["Pick a spread", "Single card, Past–Present–Future, Five-card guidance or the Celtic Cross."], ["Draw face-down", "The deck is shuffled on our server with secure randomness. You choose the cards."], ["Reveal & reflect", "Cards flip one by one, with position-by-position meaning and a practical reflection."]],
  includes: ["All 78 cards — 22 Major and 56 Minor Arcana — with upright and reversed meanings", "VYOMIRA's own original card artwork", "Interpretation of each card in its position, how the cards connect, and practical guidance", "Your cards, positions and orientations saved in My Readings", "Ask AURA follow-up questions about your spread"],
  trust: ["Cards are drawn with a cryptographically secure random number generator; the shuffled order never reaches your browser.", "We record exactly which card landed in which position and orientation, and interpret only those cards.", "Tarot is a reflective practice — it doesn't predict fixed outcomes, and we never claim it does."],
  faqs: [
    { q: "Is the draw really random?", a: "Yes. When your reading is created, our server shuffles the full 78-card deck with a cryptographically secure random generator and decides each card's orientation. You then choose cards face-down, so the result can't be steered." },
    { q: "What do reversed cards mean?", a: "A reversed card often points to the same theme as the upright card but blocked, internal or still developing. Each interpretation states the orientation you drew." },
    { q: "Which spread should I choose?", a: "A single card for a quick focus, three cards to see how a situation has moved, five cards for guidance on a decision, and the Celtic Cross for a full picture." },
    { q: "Can I ask AURA about my cards later?", a: "Yes. Your spread is saved, and AURA's Tarot mode answers from the cards you actually drew — never from cards you didn't." },
  ],
};
export const metadata: Metadata = { title: "Online Tarot Reading — 78 Cards, Secure Draw", description: C.intro, alternates: { canonical: "/tarot" }, openGraph: { url: "/tarot", title: "Tarot reading — VYOMIRA", description: C.intro, images: ["/og/default.jpg"] } };
export default function Page() { return <ServiceLanding c={C} />; }
