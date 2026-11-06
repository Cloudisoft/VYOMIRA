import Link from "next/link";
import { ArrowRight, Moon, Star, Sunrise, Timer } from "lucide-react";
import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { transitsFor } from "@/server/ai/aura";
import { userTimeZone } from "@/server/tz";
import { balance } from "@/server/billing/entitlements";
import { db } from "@/server/db";
import { activePeriods } from "@/lib/astro/dasha";
import { dms } from "@/lib/astro/math";
import { cosmicCalendar, dailyInsight } from "@/lib/interpret/daily";
import { ORDINAL, SIGNIFICATIONS } from "@/lib/interpret/catalog";
import { NoChart, Panel } from "@/components/dashboard/ui";
import { AskBox } from "@/components/dashboard/AskBox";
import { KundliChart } from "@/components/chart/KundliChart";
import { lifeGuide } from "@/lib/interpret/life-guide";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function greeting(tz: string) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  return h < 5 ? "A quiet night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Overview() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return (<><h1 className="mb-10 text-5xl">Namaste, {user.name.split(" ")[0]}.</h1><NoChart /></>);
  const { chart } = loaded;
  const tz = await userTimeZone();
  const [transits, bal, recent] = await Promise.all([
    transitsFor(loaded.chartId, chart),
    balance(user.id),
    db.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 4, select: { id: true, title: true, updatedAt: true } }),
  ]);
  const act = activePeriods(chart.dasha, new Date());
  const today = dailyInsight(chart, tz);
  const week = cosmicCalendar(chart, tz, 7);
  const guide = lifeGuide(chart, transits, loaded.fullName);
  const slow = transits.placements.filter((p) => ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.planet));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 pb-4">
        <p className="eyebrow">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date())} · {today.tithi}</p>
        <h1 className="text-4xl sm:text-6xl">{greeting(tz)}, {loaded.fullName.split(" ")[0]}.</h1>
        <p className="text-slate">The Moon is in {today.moon.sign} today — {ORDINAL[today.moon.houseFromMoon]} from your natal Moon.</p>
      </header>

      {guide && (
        <Panel title="Your story in simple words" action={<Link href="/dashboard/guide" className="text-xs text-gold hover:underline">Open my Life Guide →</Link>}>
          <p className="font-display text-2xl leading-snug text-moon/95">{guide.headline}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/guide#past" className="rounded-2xl border hairline p-4 transition-colors hover:border-amethyst/40">
              <p className="text-xs tracking-[0.18em] text-slate uppercase">So far</p>
              <p className="mt-1 text-sm">{guide.past.length ? guide.past.slice(-2).map((c) => c.title).join(" → ") : "Your first chapter is still unfolding"}</p>
            </Link>
            <Link href="/dashboard/guide#now" className="rounded-2xl border border-gold/30 bg-gold/[.04] p-4 transition-colors hover:border-gold/50">
              <p className="text-xs tracking-[0.18em] text-gold uppercase">Right now</p>
              <p className="mt-1 text-sm">{guide.present.chapter.title}{guide.present.sub ? `, with a touch of ${guide.present.sub.title.toLowerCase()}` : ""}</p>
            </Link>
            <Link href="/dashboard/guide#next" className="rounded-2xl border hairline p-4 transition-colors hover:border-amethyst/40">
              <p className="text-xs tracking-[0.18em] text-slate uppercase">Coming up</p>
              <p className="mt-1 text-sm">{guide.future[0] ? `${new Date(guide.future[0].date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}: ${guide.future[0].title}` : "A steady stretch ahead"}</p>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.areas.map((a) => (
              <Link key={a.key} href="/dashboard/guide#areas" className={`rounded-full px-3 py-1 text-xs ${a.tone === "supportive" ? "bg-gold/15 text-gold" : a.tone === "demanding" ? "bg-[#E07A5F]/15 text-[#F0A08A]" : "bg-moon/5 text-slate"}`}>{a.label}: {a.tone === "supportive" ? "good" : a.tone === "demanding" ? "needs care" : "mixed"}</Link>
            ))}
            <Link href="/dashboard/guide#do" className="rounded-full bg-violet/20 px-3 py-1 text-xs text-moon">What can I do? →</Link>
          </div>
        </Panel>
      )}

      <div className="grid gap-px overflow-hidden rounded-[1.5rem] border hairline bg-[rgba(165,139,255,.14)] sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Moon, k: "Rashi (Moon sign)", v: chart.moonSign.signName, s: chart.confidence.moonSignStable ? `Sun in ${chart.sunSign.signName}` : "uncertain — birth time" },
          { icon: Star, k: "Janma Nakshatra", v: chart.janmaNakshatra.name, s: `pada ${chart.janmaNakshatra.pada} · lord ${chart.janmaNakshatra.lord}` },
          { icon: Sunrise, k: "Rising sign", v: chart.lagna ? chart.lagna.signName : "Not shown", s: chart.lagna ? dms(chart.lagna.degree) : "needs a reliable birth time" },
          { icon: Timer, k: "Mahadasha", v: act.mahadasha?.lord ?? "—", s: act.antardasha ? `${act.antardasha.lord} antardasha until ${fmt(act.antardasha.end)}` : "" },
        ].map((x) => (
          <div key={x.k} className="bg-navy/90 p-6">
            <x.icon className="h-4 w-4 text-gold" />
            <p className="mt-4 text-xs tracking-[0.18em] text-slate uppercase">{x.k}</p>
            <p className="mt-1 font-display text-3xl">{x.v}</p>
            <p className="mt-1 text-xs text-slate">{x.s}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Today's insight" action={<Link href="/dashboard/daily" className="text-xs text-gold hover:underline">Calendar →</Link>}>
          <p className="font-display text-2xl leading-snug text-moon/95">{today.text}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 ${today.moon.favorable ? "bg-gold/15 text-gold" : "bg-moon/5 text-slate"}`}>Moon: {ORDINAL[today.moon.houseFromMoon]} from natal Moon</span>
            <span className={`rounded-full px-3 py-1 ${today.tara.quality === "favorable" ? "bg-gold/15 text-gold" : today.tara.quality === "challenging" ? "bg-[#E07A5F]/15 text-[#F0A08A]" : "bg-moon/5 text-slate"}`}>Tara: {today.tara.name}</span>
            <span className="rounded-full bg-moon/5 px-3 py-1 text-slate">{today.vara}</span>
          </div>
          <ol className="mt-6 grid grid-cols-7 gap-1.5" aria-label="Next 7 days">
            {week.map((d) => (
              <li key={d.date} className="rounded-xl border hairline p-2 text-center" title={`${d.moon.sign} · ${d.tara.name} tara`}>
                <p className="text-[10px] text-slate">{new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short" })}</p>
                <p className="font-display text-lg">{d.date.slice(8)}</p>
                <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${d.tara.quality === "favorable" && d.moon.favorable ? "bg-gold" : d.tara.quality === "challenging" ? "bg-[#E07A5F]" : "bg-amethyst/60"}`} />
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-slate/80">Dots combine Tara Bala and the Moon's transit from your natal Moon (traditional muhurta rules), evaluated at 06:00 in {tz}.</p>
        </Panel>
        <Panel title="Your Kundli" action={<Link href="/dashboard/kundli" className="text-xs text-gold hover:underline">Explore →</Link>}>
          <KundliChart chart={chart} className="mx-auto max-w-[340px]" />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Planetary period" action={<Link href="/dashboard/timeline" className="text-xs text-gold hover:underline">Timeline →</Link>}>
          {act.mahadasha && (
            <>
              <p className="font-display text-3xl">{act.mahadasha.lord} <span className="text-slate">·</span> {act.antardasha?.lord}</p>
              <p className="mt-1 text-sm text-slate">Mahadasha {fmt(act.mahadasha.start)} – {fmt(act.mahadasha.end)}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-moon/10"><div className="h-full rounded-full bg-gradient-to-r from-violet to-gold" style={{ width: `${Math.round(((Date.now() - Date.parse(act.mahadasha.start)) / (Date.parse(act.mahadasha.end) - Date.parse(act.mahadasha.start))) * 100)}%` }} /></div>
              <p className="mt-4 text-sm leading-relaxed text-slate">Traditionally, a {act.mahadasha.lord} period emphasizes {SIGNIFICATIONS[act.mahadasha.lord].core.slice(0, 3).join(", ")}, with {act.antardasha?.lord} colouring the current sub-period through {SIGNIFICATIONS[act.antardasha!.lord].core.slice(0, 2).join(" and ")}.</p>
              {!chart.confidence.dashaTimingReliable && <p className="mt-3 text-xs text-gold">Indicative dates — birth time precision limits dasha accuracy.</p>}
            </>
          )}
        </Panel>
        <Panel title="Transits now">
          <ul className="divide-y divide-[rgba(165,139,255,.12)]">
            {slow.map((p) => (
              <li key={p.planet} className="flex items-center justify-between py-2.5 text-sm">
                <span>{p.planet} <span className="text-slate">in</span> {p.signName}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? <span className="ml-1 text-xs text-amethyst">R</span> : null}</span>
                <span className="text-slate">{ORDINAL[p.houseFromMoon]} from Moon{p.houseFromLagna ? ` · ${ORDINAL[p.houseFromLagna]} from Lagna` : ""}</span>
              </li>
            ))}
          </ul>
          {transits.sadeSati && <p className="mt-3 text-xs leading-relaxed text-slate">{transits.sadeSati.note}</p>}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Ask AURA" action={<span className="text-xs text-slate">{bal.aiMessages} message{bal.aiMessages === 1 ? "" : "s"} left</span>}>
          <AskBox />
        </Panel>
        <Panel title="Recent conversations">
          {recent.length ? (
            <ul className="space-y-1">
              {recent.map((c) => (
                <li key={c.id}><Link href={`/dashboard/aura?c=${c.id}`} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-moon/5"><span className="truncate">{c.title}</span><ArrowRight className="h-4 w-4 shrink-0 text-slate group-hover:text-gold" /></Link></li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate">No conversations yet. Your first question is on us.</p>}
        </Panel>
      </div>
    </div>
  );
}
