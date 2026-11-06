"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";

const VIDEOS = [
  { slug: "meet-vyomira", title: "Meet VYOMIRA", blurb: "What it is and why it's different" },
  { slug: "your-life-guide", title: "Your Life Guide", blurb: "Past, present, future — in simple words" },
  { slug: "aura-shows-its-work", title: "AURA shows its work", blurb: "An AI astrologer with reasons" },
  { slug: "real-sky-real-maths", title: "Real sky, real maths", blurb: "How your chart is calculated" },
  { slug: "fair-and-private", title: "Fair & private", blurb: "Free Kundli, honest pricing, your data" },
] as const;

/** Five 30-second explainers. Nothing downloads until a visitor presses play. */
export function VideoTour() {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const v = VIDEOS[active];

  const pick = (i: number) => {
    setActive(i);
    setStarted(true);
    requestAnimationFrame(() => { const el = ref.current; if (el) { el.load(); el.play().catch(() => {}); } });
  };

  return (
    <section id="videos" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading align="center" eyebrow="See it in 30 seconds" title={<>VYOMIRA, <span className="text-gradient-violet">in motion</span></>} intro="Five short videos — what it does, how it works, and what makes it different." />
        <Reveal className="mt-14 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="glass relative overflow-hidden rounded-[2rem]">
            <div className="relative aspect-video">
              {started ? (
                <video key={v.slug} ref={ref} className="h-full w-full" controls playsInline preload="auto" poster={`/videos/${v.slug}.jpg`} autoPlay>
                  <source src={`/videos/${v.slug}.mp4`} type="video/mp4" />
                </video>
              ) : (
                <button type="button" onClick={() => pick(active)} className="group absolute inset-0 h-full w-full" aria-label={`Play: ${v.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/videos/${v.slug}.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 bg-navy/25 transition-colors group-hover:bg-navy/10" />
                  <span className="absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#ecd3a2] to-[#c39a5c] text-[#1a1407] shadow-[0_10px_40px_-8px_rgba(216,180,119,.8)] transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-8 w-8" fill="currentColor" />
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div><p className="font-display text-2xl">{v.title}</p><p className="text-sm text-slate">{v.blurb}</p></div>
              <span className="shrink-0 rounded-full border hairline px-3 py-1 text-xs text-slate">0:30 · sound on</span>
            </div>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {VIDEOS.map((x, i) => (
              <li key={x.slug}>
                <button type="button" onClick={() => pick(i)} aria-current={i === active ? "true" : undefined} className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${i === active ? "border-gold/50 bg-gold/[.06]" : "hairline hover:border-amethyst/40"}`}>
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/videos/${x.slug}.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <Play className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white/90" fill="currentColor" />
                  </span>
                  <span><span className="block text-sm font-medium text-moon">{x.title}</span><span className="block text-xs text-slate">{x.blurb}</span></span>
                </button>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
