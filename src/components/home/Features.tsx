"use client";
import { motion } from "motion/react";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";

function BirthMoment() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" aria-hidden>
      <circle cx="70" cy="70" r="46" fill="none" stroke="rgba(165,139,255,.25)" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const f = (n: number) => n.toFixed(2);
        return <line key={i} x1={f(70 + Math.cos(a) * 40)} y1={f(70 + Math.sin(a) * 40)} x2={f(70 + Math.cos(a) * 46)} y2={f(70 + Math.sin(a) * 46)} stroke="#9BA3BC" strokeWidth="1" />;
      })}
      <motion.line x1="70" y1="70" x2="70" y2="36" stroke="#D8B477" strokeWidth="2" strokeLinecap="round" style={{ originX: "70px", originY: "70px" }} animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
      <motion.line x1="70" y1="70" x2="92" y2="70" stroke="#A58BFF" strokeWidth="2" strokeLinecap="round" style={{ originX: "70px", originY: "70px" }} animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} />
      <circle cx="70" cy="70" r="3" fill="#F1DCAE" />
      <path d="M128 70h44" stroke="url(#fg)" strokeDasharray="3 4" />
      <text x="128" y="56" fill="#9BA3BC" fontSize="8" letterSpacing="1.5">IST +05:30</text>
      <text x="128" y="92" fill="#F1DCAE" fontSize="10" letterSpacing="1">UTC 05:00:00</text>
      <text x="128" y="106" fill="#9BA3BC" fontSize="7.5">JD 2448118.708</text>
      <defs><linearGradient id="fg"><stop stopColor="#A58BFF" /><stop offset="1" stopColor="#D8B477" /></linearGradient></defs>
    </svg>
  );
}

function SkyOrbits() {
  const orbits = [28, 46, 64, 82];
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      <circle cx="100" cy="100" r="7" fill="#D8B477" />
      {orbits.map((r, i) => (
        <g key={r}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(165,139,255,.18)" />
          <motion.g style={{ originX: "100px", originY: "100px" }} animate={{ rotate: 360 }} transition={{ duration: 10 + i * 9, repeat: Infinity, ease: "linear" }}>
            <circle cx={100 + r} cy="100" r={3.5 - i * 0.4} fill={["#E9E3F5", "#A58BFF", "#F1DCAE", "#8C9EFF"][i]} />
          </motion.g>
        </g>
      ))}
    </svg>
  );
}

function Blueprint() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      <motion.path d="M20 20H180V180H20Z M20 20L180 180 M180 20L20 180 M100 20L180 100L100 180L20 100Z" fill="none" stroke="#D8B477" strokeWidth="1" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 3, ease: "easeInOut" }} />
      {[["Mo", 100, 64], ["Ju", 60, 100], ["Sa", 140, 100], ["Ve", 100, 140]].map(([t, x, y], i) => (
        <motion.text key={t as string} x={x as number} y={y as number} textAnchor="middle" fill="#F1DCAE" fontSize="13" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5 + i * 0.3 }}>{t}</motion.text>
      ))}
    </svg>
  );
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="The foundation" title={<>Your Birth. Your Sky. <span className="text-gradient-violet">Your Blueprint.</span></>} intro="Three precise steps turn a date, a time and a place into a chart you can actually inspect — every number traceable, nothing improvised." />
        <div className="mt-16 grid gap-5 md:grid-cols-6 md:grid-rows-2">
          <Reveal className="md:col-span-4 md:row-span-2">
            <article className="glass group relative h-full overflow-hidden rounded-[2rem] p-8 md:p-10">
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet/20 blur-3xl transition-opacity group-hover:opacity-80" />
              <p className="font-display text-7xl text-gold/30">01</p>
              <h3 className="mt-2 text-3xl md:text-4xl">Your Birth</h3>
              <p className="mt-3 max-w-md text-slate">Your birthplace comes from a real geographic database with its own IANA timezone history — including pre-1947 Indian local times, wartime offsets and daylight-saving gaps. We convert your exact moment to Universal Time before anything else.</p>
              <div className="mt-8 h-44 md:h-64"><BirthMoment /></div>
            </article>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-2">
            <article className="glass relative h-full overflow-hidden rounded-[2rem] p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-5xl text-gold/30">02</p>
                  <h3 className="mt-1 text-2xl">Your Sky</h3>
                </div>
                <div className="h-28 w-28 shrink-0"><SkyOrbits /></div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate">Geocentric positions of the Sun, Moon and planets from an astronomical ephemeris, converted to the sidereal zodiac with the Lahiri ayanamsa.</p>
            </article>
          </Reveal>
          <Reveal delay={0.2} className="md:col-span-2">
            <article className="glass relative h-full overflow-hidden rounded-[2rem] p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-5xl text-gold/30">03</p>
                  <h3 className="mt-1 text-2xl">Your Blueprint</h3>
                </div>
                <div className="h-28 w-28 shrink-0"><Blueprint /></div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate">Lagna, houses, Nakshatra, Navamsa, Dashamsa and your Vimshottari periods — laid out in the traditional chart you already know.</p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
