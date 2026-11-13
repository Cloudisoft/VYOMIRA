import type { Metadata } from "next";
import { ServiceLanding, type LandingCopy } from "@/components/home/ServiceLanding";

export const revalidate = 300; // prices come from admin config
const C: LandingCopy = {
  category: "palmistry", eyebrow: "Palmistry",
  title: "Your palm, read from a photo.",
  intro: "Upload a clear photo of your palm. We trace your life, head, heart, fate, sun and Mercury lines, palm shape and mounts — and interpret only what's genuinely visible.",
  steps: [["Choose your hand", "Tell us your dominant hand; upload one palm or both."], ["Upload a photo", "We check it straight away for clarity, lighting and size — before you pay."], ["We observe", "Visible features are recorded first, separately from any interpretation."], ["Read & ask", "Personality, career, relationships and strengths — with a PDF and AURA follow-ups."]],
  includes: ["Observations of each major line (or a clear note when it isn't visible)", "Palm shape and the mounts that can be judged from your photo", "Palm overview, personality and summary (Basic); plus career, relationships and strengths (Detailed); plus personal development and a two-hand comparison (Complete)", "Photos encrypted at rest and deletable by you at any time"],
  trust: ["We never invent a line, break or mark. If a line isn't clearly visible, the report says so and doesn't interpret it.", "If your photo isn't clear enough, we ask for a better one instead of guessing — at no extra charge.", "Photos are re-encoded to remove location data, encrypted, and visible only to you.", "Palmistry is a traditional interpretive practice, not a science, and is never used to predict health or lifespan."],
  faqs: [
    { q: "How should I take the photo?", a: "Daylight or a bright room, no flash. Palm flat and facing the camera, fingers together and slightly relaxed, filling most of the frame, with the phone held directly above." },
    { q: "Which hand should I upload?", a: "Your dominant hand (the one you write with) is traditionally read for the life you're building; the other for inherited tendencies. Complete readings compare both." },
    { q: "What happens to my palm photos?", a: "They're stripped of metadata, encrypted and stored only so we can analyse them for your reading. You can delete them with one tap; your written report remains." },
    { q: "What if my lines are faint?", a: "Faint lines are reported as faint. Lines that can't be traced are marked as not visible and left uninterpreted — accuracy matters more than a full-looking report." },
  ],
};
export const metadata: Metadata = { title: "Palm Reading Online — Upload Your Palm Photo", description: C.intro, alternates: { canonical: "/palmistry" }, openGraph: { url: "/palmistry", title: "Palm reading — VYOMIRA", description: C.intro, images: ["/og/default.jpg"] } };
export default function Page() { return <ServiceLanding c={C} />; }
