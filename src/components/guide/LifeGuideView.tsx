import Link from "next/link";
import { CalendarClock, Compass, History, Sparkles, Sprout, Sun } from "lucide-react";
import type { AreaReading, LifeGuide, Rating, Tone } from "@/lib/interpret/life-guide";
import { monthYear, type Lang } from "@/lib/interpret/life-guide-i18n";

/** The Life Guide body — shared by the dashboard (/dashboard/guide) and the pre-signup Cosmic Blueprint. */
export const GUIDE_UI: Record<Lang, Record<string, string>> = {
  en: { eyebrow: "Your life, in simple words", h1: "My Life Guide", past: "Your story so far", now: "Right now", next: "What's coming", areas: "Your life timeline, area by area", do: "What you can do", main: "Main chapter", phase: "This phase · until", sky: "In the sky this year", affected: "Most affected", nowLabel: "Now", upcoming: "Coming up", before: "Looking back", none: "No major shifts in the next few years.", tip: "Tip", ask: "Ask AURA about", habits: "Everyday habits", trad: "Traditional practices", day: "Day", colour: "Colour", mantra: "Mantra (108 times, or as you can)", giving: "Giving", doIntro: "These focus on the planets running your life right now. Start with the everyday habits — they matter most. Traditional practices are optional.", cta: "Want a detailed answer for your situation?", ctaSub: "AURA reads the same chart and answers in plain words — with the reasons shown.", askBtn: "Ask AURA", legend: "Strong · Active · Needs care · Quiet", basisL: "Based on your rising sign, your Vimshottari dasha periods and the real movement of Jupiter and Saturn.", basisM: "Based on your Moon sign (birth time not exact), your Vimshottari dasha periods and the real movement of Jupiter and Saturn.", disclaimer: "These are traditional Vedic timings — tendencies, not certainties. Not a substitute for medical, legal or financial advice.", nav1: "Story so far", nav2: "Right now", nav3: "Coming up", nav4: "Life areas", nav5: "What to do", lang: "Language" },
  hi: { eyebrow: "आपका जीवन, आसान शब्दों में", h1: "मेरी जीवन मार्गदर्शिका", past: "अब तक की कहानी", now: "अभी", next: "आगे क्या आने वाला है", areas: "हर क्षेत्र की जीवन-समयरेखा", do: "आप क्या कर सकते हैं", main: "मुख्य अध्याय", phase: "यह चरण · तक", sky: "इस वर्ष ग्रहों की चाल", affected: "सबसे ज़्यादा असर", nowLabel: "अभी", upcoming: "आने वाला समय", before: "बीता समय", none: "अगले कुछ वर्षों में कोई बड़ा बदलाव नहीं।", tip: "सुझाव", ask: "AURA से पूछें:", habits: "रोज़ की आदतें", trad: "पारंपरिक उपाय", day: "दिन", colour: "रंग", mantra: "मंत्र (108 बार, या जितना हो सके)", giving: "दान", doIntro: "ये उपाय उन ग्रहों पर आधारित हैं जो अभी आपका जीवन चला रहे हैं। रोज़ की आदतों से शुरुआत करें — वे सबसे ज़रूरी हैं। पारंपरिक उपाय वैकल्पिक हैं।", cta: "अपनी स्थिति के लिए विस्तृत उत्तर चाहिए?", ctaSub: "AURA आपकी उसी कुंडली को पढ़कर आसान शब्दों में, कारण सहित उत्तर देता है।", askBtn: "AURA से पूछें", legend: "बहुत अच्छा · सक्रिय · सावधानी · शांत", basisL: "आपके लग्न, विंशोत्तरी दशा और गुरु-शनि की वास्तविक चाल पर आधारित।", basisM: "आपकी चंद्र राशि (जन्म समय सटीक नहीं), विंशोत्तरी दशा और गुरु-शनि की वास्तविक चाल पर आधारित।", disclaimer: "ये पारंपरिक वैदिक समय-संकेत हैं — प्रवृत्तियाँ, निश्चितताएँ नहीं। चिकित्सा, क़ानूनी या आर्थिक सलाह का विकल्प नहीं।", nav1: "अब तक", nav2: "अभी", nav3: "आगे", nav4: "जीवन क्षेत्र", nav5: "उपाय", lang: "भाषा" },
  hinglish: { eyebrow: "Aapki zindagi, aasaan shabdon mein", h1: "Meri Life Guide", past: "Ab tak ki kahani", now: "Abhi", next: "Aage kya aane wala hai", areas: "Har area ki life timeline", do: "Aap kya kar sakte hain", main: "Main chapter", phase: "Yeh phase · tak", sky: "Is saal grahon ki chaal", affected: "Sabse zyada asar", nowLabel: "Abhi", upcoming: "Aane wala time", before: "Beeta time", none: "Agle kuch saalon mein koi bada badlaav nahi.", tip: "Tip", ask: "AURA se poochiye:", habits: "Roz ki aadatein", trad: "Paramparik upay", day: "Din", colour: "Rang", mantra: "Mantra (108 baar, ya jitna ho sake)", giving: "Daan", doIntro: "Yeh upay un grahon par based hain jo abhi aapki zindagi chala rahe hain. Roz ki aadaton se shuru kijiye — woh sabse zaroori hain. Paramparik upay optional hain.", cta: "Apni situation ke liye detailed jawaab chahiye?", ctaSub: "AURA aapki usi kundli ko padhkar aasaan shabdon mein, reasons ke saath jawaab deta hai.", askBtn: "AURA se poochiye", legend: "Bahut achha · Active · Dhyan rakhein · Shaant", basisL: "Aapke lagna, Vimshottari dasha aur Guru-Shani ki asli chaal par based.", basisM: "Aapki Chandra rashi (birth time exact nahi), Vimshottari dasha aur Guru-Shani ki asli chaal par based.", disclaimer: "Yeh paramparik Vedic timings hain — tendencies, certainties nahi. Medical, legal ya financial advice ka substitute nahi.", nav1: "Ab tak", nav2: "Abhi", nav3: "Aage", nav4: "Life areas", nav5: "Upay", lang: "Bhasha" },
};

export const TONE: Record<Tone, { cls: string; dot: string }> = {
  supportive: { cls: "bg-gold/15 text-gold", dot: "bg-gold" },
  mixed: { cls: "bg-amethyst/15 text-amethyst", dot: "bg-amethyst" },
  demanding: { cls: "bg-[#E07A5F]/15 text-[#F0A08A]", dot: "bg-[#E07A5F]" },
};
export const RATE: Record<Rating, { bar: string; chip: string }> = {
  strong: { bar: "bg-gold", chip: "bg-gold/15 text-gold" },
  active: { bar: "bg-amethyst/80", chip: "bg-amethyst/15 text-amethyst" },
  challenging: { bar: "bg-[#E07A5F]", chip: "bg-[#E07A5F]/15 text-[#F0A08A]" },
  quiet: { bar: "bg-moon/10", chip: "bg-moon/5 text-slate" },
};
const yr = (iso: string) => new Date(iso).getUTCFullYear();

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof Sun; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border hairline text-gold"><Icon className="h-5 w-5" /></span>
        <h2 className="font-display text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TimelineBar({ a, range, nowIso, ratingLabel, nowLabel }: { a: AreaReading; range: { start: string; end: string }; nowIso: string; ratingLabel: Record<Rating, string>; nowLabel: string }) {
  const s0 = Date.parse(range.start), s1 = Date.parse(range.end), span = s1 - s0;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - s0) / span) * 100));
  const now = pct(Date.parse(nowIso));
  const years: number[] = [];
  for (let y = yr(range.start) + 1; y <= yr(range.end); y++) if ((y - yr(range.start)) % 4 === 0) years.push(y);
  return (
    <div className="mt-4">
      <div className="relative h-3 overflow-hidden rounded-full bg-moon/5" role="img" aria-label={`${a.label} timeline`}>
        {a.timeline.map((s) => (
          <span key={s.start} title={`${ratingLabel[s.rating]} · ${s.start.slice(0, 7)} – ${s.end.slice(0, 7)}`} className={`absolute top-0 h-full ${RATE[s.rating].bar}`} style={{ left: `${pct(Date.parse(s.start))}%`, width: `${Math.max(0.4, pct(Date.parse(s.end)) - pct(Date.parse(s.start)))}%` }} />
        ))}
      </div>
      <div className="relative mt-1 h-5 text-[10px] text-slate">
        {years.map((y) => <span key={y} className="absolute -translate-x-1/2" style={{ left: `${pct(Date.UTC(y, 0, 1))}%` }}>{y}</span>)}
      </div>
      <div className="pointer-events-none relative -mt-[34px] h-6">
        <span className="absolute top-0 h-6 w-0.5 -translate-x-1/2 rounded bg-moon" style={{ left: `${now}%` }} />
        <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-semibold text-moon" style={{ left: `${now}%` }}>{nowLabel}</span>
      </div>
    </div>
  );
}


export function LifeGuideView({ g, lang, langHref, askHref, compact = false }: { g: LifeGuide; lang: Lang; langHref?: (l: Lang) => string; askHref?: (q: string) => string; compact?: boolean }) {
  const T = GUIDE_UI[lang];
  const ratingLabel = { strong: T.legend.split(" · ")[0], active: T.legend.split(" · ")[1], challenging: T.legend.split(" · ")[2], quiet: T.legend.split(" · ")[3] } as Record<Rating, string>;
  const ask = askHref ?? ((q: string) => `/dashboard/aura?draft=${encodeURIComponent(q)}`);
  const font = lang === "hi" ? "leading-relaxed" : "";
  return (
    <div className={`space-y-16 ${font}`} lang={lang === "hi" ? "hi" : "en"}>
      <header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">{T.eyebrow}</p>
          <div className="flex items-center gap-1 rounded-full border hairline p-1 text-xs" role="group" aria-label={T.lang}>
            {([["en", "English"], ["hi", "हिन्दी"], ["hinglish", "Hinglish"]] as const).map(([v, l]) => (
              <Link key={v} href={langHref ? langHref(v) : `/dashboard/guide?lang=${v}`} aria-current={lang === v ? "true" : undefined} className={`rounded-full px-3 py-1.5 ${lang === v ? "bg-gold/20 text-gold" : "text-slate hover:text-moon"}`}>{l}</Link>
            ))}
          </div>
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl">{compact ? null : T.h1}</h1>
        <p className="mt-5 max-w-3xl font-display text-2xl leading-snug text-moon/95 sm:text-3xl">{g.headline}</p>
        <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2 text-sm">
          {[["#areas", T.nav4], ["#now", T.nav2], ["#next", T.nav3], ["#past", T.nav1], ["#do", T.nav5]].map(([h, l]) => (
            <a key={h} href={h} className="rounded-full border hairline px-3.5 py-1.5 text-slate transition-colors hover:border-amethyst/50 hover:text-moon">{l}</a>
          ))}
        </nav>
        {g.caveat && <p className="mt-4 text-sm text-gold">{g.caveat}</p>}
      </header>

      <Section id="areas" icon={Sun} title={T.areas}>
        <p className="-mt-2 mb-5 flex flex-wrap gap-3 text-xs text-slate">
          {(["strong", "active", "challenging", "quiet"] as Rating[]).map((r) => <span key={r} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-5 rounded-full ${RATE[r].bar}`} />{ratingLabel[r]}</span>)}
        </p>
        <div className="grid gap-5 xl:grid-cols-2">
          {g.areas.map((a) => (
            <article key={a.key} className="glass rounded-[1.5rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl">{a.label}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${RATE[a.rating].chip}`}>{T.nowLabel}: {ratingLabel[a.rating]}</span>
              </div>
              <TimelineBar a={a} range={g.range} nowIso={g.now} ratingLabel={ratingLabel} nowLabel={T.nowLabel} />
              <p className="mt-2 text-[15px] leading-relaxed text-moon/95">{a.text}</p>
              <p className="mt-3 rounded-xl bg-moon/[.04] p-3 text-sm leading-relaxed"><span className="text-gold">{T.tip}: </span>{a.tip}</p>
              <p className="mt-4 text-xs tracking-[0.18em] text-gold uppercase">{T.upcoming}</p>
              {a.next.length ? (
                <ul className="mt-2 space-y-2">
                  {a.next.map((w) => (
                    <li key={w.start} className="text-sm">
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] ${RATE[w.rating].chip}`}>{monthYear(lang, w.start)} – {monthYear(lang, w.end)}</span>
                      <span className="text-moon/90">{w.text}</span>
                      <span className="mt-0.5 block text-[11px] text-slate">{w.why}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate">{T.none}</p>}
              {a.past.length > 0 && (
                <>
                  <p className="mt-4 text-xs tracking-[0.18em] text-slate uppercase">{T.before}</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate">{a.past.map((w) => <li key={w.start}><span className={`mr-2 inline-block h-2 w-2 rounded-full ${RATE[w.rating].bar}`} />{yr(w.start)}–{yr(w.end)}: {w.text}</li>)}</ul>
                </>
              )}
              <Link href={ask(lang === "hi" ? `अगले 12 महीनों में मेरे ${a.label} के बारे में मेरी कुंडली क्या कहती है?` : lang === "hinglish" ? `Agle 12 mahino mein mere ${a.label} ke baare mein meri kundli kya kehti hai?` : `What does my chart say about my ${a.label.toLowerCase()} in the next 12 months?`)} className="mt-4 inline-block text-xs text-gold hover:underline">{T.ask} {a.label} →</Link>
            </article>
          ))}
        </div>
      </Section>

      <Section id="now" icon={Compass} title={T.now}>
        <div className="grid gap-5 lg:grid-cols-2">
          {[g.present.chapter, g.present.sub].filter(Boolean).map((c, i) => (
            <div key={i} className="glass rounded-[1.5rem] p-6">
              <div className="flex items-center justify-between gap-3"><p className="text-xs tracking-[0.18em] text-slate uppercase">{i === 0 ? `${T.main} · ${yr(c!.start)}–${yr(c!.end)}` : `${T.phase} ${monthYear(lang, c!.end)}`} · {c!.name}</p><span className={`h-2.5 w-2.5 rounded-full ${TONE[c!.tone].dot}`} /></div>
              <p className="mt-2 font-display text-3xl">{c!.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">{c!.summary}</p>
              {c!.focus.length > 0 && <p className="mt-3 text-xs text-slate">{T.affected}: <span className="text-moon">{c!.focus.join(" · ")}</span></p>}
            </div>
          ))}
        </div>
        <div className="glass mt-5 rounded-[1.5rem] p-6">
          <p className="text-xs tracking-[0.18em] text-slate uppercase">{T.sky}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">{g.present.skyNow.map((l) => <li key={l} className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{l}</li>)}</ul>
        </div>
      </Section>

      <Section id="next" icon={CalendarClock} title={T.next}>
        <ul className="grid gap-4 md:grid-cols-2">
          {g.future.map((f) => (
            <li key={f.date + f.title} className="glass rounded-[1.25rem] p-5">
              <div className="flex items-center justify-between gap-3"><p className="font-display text-xl">{monthYear(lang, f.date)}</p><span className={`h-2.5 w-2.5 rounded-full ${TONE[f.tone].dot}`} /></div>
              <p className="mt-1 text-sm font-medium text-moon">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">{f.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="past" icon={History} title={T.past}>
        <ol className="relative space-y-4 border-l hairline pl-6">
          {g.past.map((c) => (
            <li key={c.start} className="relative">
              <span className={`absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full ${TONE[c.tone].dot}`} />
              <p className="text-xs tracking-[0.18em] text-slate uppercase">{yr(c.start)} – {yr(c.end)} · {c.name}</p>
              <p className="mt-1 font-display text-2xl">{c.title}</p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate">{c.summary}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="do" icon={Sprout} title={T.do}>
        <p className="-mt-2 mb-5 max-w-3xl text-sm text-slate">{T.doIntro}</p>
        <div className="grid gap-5 lg:grid-cols-2">
          {g.remedies.map((r) => (
            <div key={r.planet} className="glass rounded-[1.5rem] p-6">
              <p className="font-display text-3xl">{r.name}</p>
              <p className="text-sm text-slate">{r.why}</p>
              <p className="mt-4 text-xs tracking-[0.18em] text-gold uppercase">{T.habits}</p>
              <ul className="mt-2 space-y-1.5 text-sm">{r.habits.map((h) => <li key={h} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{h}</li>)}</ul>
              <p className="mt-5 text-xs tracking-[0.18em] text-gold uppercase">{T.trad}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-slate">{T.day}</dt><dd>{r.traditional.day}</dd></div>
                <div><dt className="text-xs text-slate">{T.colour}</dt><dd>{r.traditional.colour}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate">{T.mantra}</dt><dd className="font-display text-lg text-gold">{r.traditional.mantra}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate">{T.giving}</dt><dd>{r.traditional.giving}</dd></div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-slate/80">{r.gemstoneNote}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="glass rounded-[1.5rem] p-6 text-center">
        <p className="font-display text-2xl">{T.cta}</p>
        <p className="mt-1 text-sm text-slate">{T.ctaSub}</p>
        <Link href={ask(lang === "hi" ? "मेरे वर्तमान जीवन-अध्याय को आसान शब्दों में समझाइए और इस साल मुझे किस पर ध्यान देना चाहिए?" : lang === "hinglish" ? "Mere current life chapter ko aasaan shabdon mein samjhaiye aur is saal mujhe kis cheez par dhyan dena chahiye?" : "Explain my current life chapter in simple words and what I should focus on this year.")} className="btn-primary mt-5">{T.askBtn}</Link>
        <p className="mt-6 text-xs text-slate/70">{g.basis === "lagna" ? T.basisL : T.basisM} {T.disclaimer}</p>
      </div>
    </div>
  );
}
