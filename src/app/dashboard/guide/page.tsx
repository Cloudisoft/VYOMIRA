import Link from "next/link";
import { CalendarClock, Compass, History, Sparkles, Sprout, Sun } from "lucide-react";
import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { transitsFor } from "@/server/ai/aura";
import { lifeGuide, type Tone } from "@/lib/interpret/life-guide";
import { NoChart } from "@/components/dashboard/ui";

export const metadata = { title: "My Life Guide" };

const yr = (iso: string) => new Date(iso).getUTCFullYear();
const my = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

const TONE: Record<Tone, { label: string; cls: string; dot: string }> = {
  supportive: { label: "Supportive", cls: "bg-gold/15 text-gold", dot: "bg-gold" },
  mixed: { label: "Mixed", cls: "bg-amethyst/15 text-amethyst", dot: "bg-amethyst" },
  demanding: { label: "Needs care", cls: "bg-[#E07A5F]/15 text-[#F0A08A]", dot: "bg-[#E07A5F]" },
};
const Chip = ({ tone }: { tone: Tone }) => <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONE[tone].cls}`}>{TONE[tone].label}</span>;

function Section({ id, icon: Icon, eyebrow, title, children }: { id: string; icon: typeof Sun; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border hairline text-gold"><Icon className="h-5 w-5" /></span>
          <div><p className="eyebrow !text-[0.62rem]">{eyebrow}</p><h2 className="font-display text-3xl">{title}</h2></div>
        </div>
        {children}
    </section>
  );
}

export default async function GuidePage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart />;
  const g = lifeGuide(loaded.chart, await transitsFor(loaded.chartId, loaded.chart), loaded.fullName);
  if (!g) return <NoChart />;
  const ask = (q: string) => `/dashboard/aura?draft=${encodeURIComponent(q)}`;

  return (
    <div className="space-y-16">
      <header>
        <p className="eyebrow">Your life, in simple words</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">My Life Guide</h1>
        <p className="mt-5 max-w-3xl font-display text-2xl leading-snug text-moon/95 sm:text-3xl">{g.headline}</p>
        <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2 text-sm">
          {[["#past", "Your story so far"], ["#now", "Right now"], ["#next", "What's coming"], ["#areas", "Life areas"], ["#do", "What you can do"]].map(([h, l]) => (
            <a key={h} href={h} className="rounded-full border hairline px-3.5 py-1.5 text-slate transition-colors hover:border-amethyst/50 hover:text-moon">{l}</a>
          ))}
        </nav>
        {g.caveat && <p className="mt-4 text-sm text-gold">{g.caveat}</p>}
      </header>

      <Section id="past" icon={History} eyebrow="Past" title="Your story so far">
        {g.past.length ? (
          <ol className="relative space-y-4 border-l hairline pl-6">
            {g.past.map((c) => (
              <li key={c.start} className="relative">
                <span className={`absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full ${TONE[c.tone].dot}`} />
                <p className="text-xs tracking-[0.18em] text-slate uppercase">{yr(c.start)} – {yr(c.end)} · {c.lord}</p>
                <p className="mt-1 font-display text-2xl">{c.title}</p>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate">{c.summary}</p>
              </li>
            ))}
          </ol>
        ) : <p className="text-slate">You&apos;re still in the first chapter of your life story — see “Right now”.</p>}
        <p className="mt-4 text-xs text-slate/80">Looking back is a good way to check how these themes showed up for you.</p>
      </Section>

      <Section id="now" icon={Compass} eyebrow="Present" title="Right now">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass rounded-[1.5rem] p-6" data-tilt>
            <div className="flex items-center justify-between gap-3"><p className="text-xs tracking-[0.18em] text-slate uppercase">Main chapter · {yr(g.present.chapter.start)}–{yr(g.present.chapter.end)}</p><Chip tone={g.present.chapter.tone} /></div>
            <p className="mt-2 font-display text-3xl">{g.present.chapter.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate">{g.present.chapter.summary}</p>
            <p className="mt-3 text-xs text-slate">Most affected: <span className="text-moon">{g.present.chapter.focus.join(" · ")}</span></p>
          </div>
          {g.present.sub && (
            <div className="glass rounded-[1.5rem] p-6" data-tilt>
              <div className="flex items-center justify-between gap-3"><p className="text-xs tracking-[0.18em] text-slate uppercase">This phase · until {my(g.present.sub.end)}</p><Chip tone={g.present.sub.tone} /></div>
              <p className="mt-2 font-display text-3xl">{g.present.sub.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">{g.present.sub.summary}</p>
              <p className="mt-3 text-xs text-slate">Most affected: <span className="text-moon">{g.present.sub.focus.join(" · ")}</span></p>
            </div>
          )}
        </div>
        <div className="glass mt-5 rounded-[1.5rem] p-6">
          <p className="text-xs tracking-[0.18em] text-slate uppercase">In the sky this year</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">{g.present.skyNow.map((l) => <li key={l} className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{l}</li>)}</ul>
        </div>
      </Section>

      <Section id="next" icon={CalendarClock} eyebrow="Future" title="What's coming">
        <ul className="grid gap-4 md:grid-cols-2">
          {g.future.map((f) => (
            <li key={f.date + f.title} className="glass rounded-[1.25rem] p-5">
              <div className="flex items-center justify-between gap-3"><p className="font-display text-xl">{my(f.date)}</p><Chip tone={f.tone} /></div>
              <p className="mt-1 text-sm font-medium text-moon">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">{f.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="areas" icon={Sun} eyebrow="Life areas" title="How each part of life looks now">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {g.areas.map((a) => (
            <div key={a.key} className="glass flex flex-col rounded-[1.25rem] p-5" data-tilt>
              <div className="flex items-center justify-between gap-3"><p className="font-display text-2xl">{a.label}</p><Chip tone={a.tone} /></div>
              <p className="mt-2 text-sm text-slate">{a.text}</p>
              <p className="mt-3 rounded-xl bg-moon/[.04] p-3 text-sm leading-relaxed text-moon/90"><span className="text-gold">Tip: </span>{a.tip}</p>
              <Link href={ask(`What does my chart say about ${a.label.toLowerCase()} in the next 12 months?`)} className="mt-auto pt-4 text-xs text-gold hover:underline">Ask AURA about {a.label.toLowerCase()} →</Link>
            </div>
          ))}
        </div>
      </Section>

      <Section id="do" icon={Sprout} eyebrow="Make it better" title="What you can do">
        <p className="-mt-2 mb-5 max-w-3xl text-sm text-slate">These focus on the planets running your life right now. Start with the everyday habits — they matter most. The traditional practices are optional and offered as they are followed in Jyotish.</p>
        <div className="grid gap-5 lg:grid-cols-2">
          {g.remedies.map((r) => (
            <div key={r.planet} className="glass rounded-[1.5rem] p-6">
              <p className="font-display text-3xl">{r.planet}</p>
              <p className="text-sm text-slate">{r.why}</p>
              <p className="mt-4 text-xs tracking-[0.18em] text-gold uppercase">Everyday habits</p>
              <ul className="mt-2 space-y-1.5 text-sm">{r.habits.map((h) => <li key={h} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{h}</li>)}</ul>
              <p className="mt-5 text-xs tracking-[0.18em] text-gold uppercase">Traditional practices</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-slate">Day</dt><dd>{r.traditional.day}</dd></div>
                <div><dt className="text-xs text-slate">Colour</dt><dd>{r.traditional.colour}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate">Mantra (108 times, or as you can)</dt><dd className="font-display text-lg text-gold">{r.traditional.mantra}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate">Giving</dt><dd>{r.traditional.giving}</dd></div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-slate/80">{r.gemstoneNote} Gemstones are powerful in tradition — please don&apos;t wear one without a careful, personal consultation.</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="glass rounded-[1.5rem] p-6 text-center">
        <p className="font-display text-2xl">Want this explained for a specific question?</p>
        <p className="mt-1 text-sm text-slate">AURA reads the same chart and answers in plain words — with the reasons shown.</p>
        <Link href={ask("Explain my current life chapter in simple words and what I should focus on this year.")} className="btn-primary mt-5">Ask AURA</Link>
        <p className="mt-6 text-xs text-slate/70">Based on {g.basis === "lagna" ? "your rising sign" : "your Moon sign (birth time not exact)"}, your Vimshottari dasha periods and current planetary positions. Astrology is offered for reflection — it is not a substitute for medical, legal or financial advice.</p>
      </div>
    </div>
  );
}
