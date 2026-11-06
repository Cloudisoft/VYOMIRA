import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES } from "@/lib/learn";

export const metadata: Metadata = { title: "Learn Vedic Astrology (Jyotish) — Kundli, Dasha, Sade Sati & more", description: "Plain-language guides to the Janam Kundli, how to read your birth chart, Vimshottari dasha, Sade Sati, Rahu and Ketu, Manglik dosha, nakshatras and divisional charts.", alternates: { canonical: "/learn" } };

export default function Learn() {
  return (
    <section className="px-6 pt-36 pb-28">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Learn</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">Understand the sky behind your chart.</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate">Clear, honest explanations of Vedic astrology — what each part of your Kundli means, how it is calculated, and how to read it.</p>
        <ul className="mt-14 divide-y divide-[rgba(165,139,255,.14)] border-y hairline">
          {ARTICLES.map((a, i) => (
            <li key={a.slug}>
              <Link href={`/learn/${a.slug}`} className="group grid gap-2 py-8 sm:grid-cols-[4rem_1fr]">
                <span className="font-display text-2xl text-slate/50">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block font-display text-3xl transition-colors group-hover:text-gold">{a.title}</span><span className="mt-2 block text-slate">{a.summary}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
