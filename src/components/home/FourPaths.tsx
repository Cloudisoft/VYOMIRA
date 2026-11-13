import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { PathArt } from "./PathArt";

export interface PathPrice { astrology: string; palmistry: string | null; numerology: string | null; tarot: string | null }

const PATHS = [
  { kind: "astrology" as const, title: "Astrology", line: "Your Kundli, calculated from real astronomy", text: "Your exact birth chart, Vimshottari dasha timeline and a plain-language guide to your past, present and future — with AURA to answer your questions.", href: "/onboarding", cta: "Get my free Kundli" },
  { kind: "palmistry" as const, title: "Palmistry", line: "Your palm, read from a photo", text: "Upload your palm and we trace your life, head, heart and fate lines. We interpret only what's clearly visible — never guessed.", href: "/palmistry", cta: "Explore palmistry" },
  { kind: "numerology" as const, title: "Numerology", line: "Your name and birth date, in numbers", text: "Life Path, Destiny, Soul Urge, Personal Year and your Lo Shu grid — calculated exactly with Pythagorean or Chaldean methods.", href: "/numerology", cta: "Explore numerology" },
  { kind: "tarot" as const, title: "Tarot", line: "Ask a question, choose your cards", text: "Pick from a securely shuffled 78-card deck, watch your cards turn, and get an interpretation of exactly the cards you drew.", href: "/tarot", cta: "Explore tarot" },
];

export function FourPaths({ prices }: { prices: PathPrice }) {
  return (
    <section id="paths" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Four paths" title={<>Four Paths to <span className="text-gradient-violet">Self-Discovery</span></>} intro="Four traditions, one place. Start with the one that speaks to you — your readings come together in Combined Insights and in every AURA conversation." />
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PATHS.map((p) => (
            <StaggerItem key={p.kind}>
              <Link href={p.href} className="group glass relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(114,86,216,.55)]">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(232,201,139,.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <PathArt kind={p.kind} className="mx-auto h-32 w-44 transition-transform duration-700 group-hover:scale-105" />
                <h3 className="mt-5 font-display text-3xl">{p.title}</h3>
                <p className="mt-1 text-sm text-gold">{p.line}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">{p.text}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-moon">{p.kind === "astrology" ? prices.astrology : prices[p.kind] ? `From ${prices[p.kind]}` : "Opening soon"}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-gold">{p.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
