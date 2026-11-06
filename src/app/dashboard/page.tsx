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
import { cosmicCalendar, dailyInsight, dailyTextL } from "@/lib/interpret/daily";
import { UI, dateL, ordinalL, planetName, signName } from "@/lib/i18n/ui";
import { userLang } from "@/server/lang";
import { SIGNIFICATIONS } from "@/lib/interpret/catalog";
import { NoChart, Panel } from "@/components/dashboard/ui";
import { AskBox } from "@/components/dashboard/AskBox";
import { KundliChart } from "@/components/chart/KundliChart";
import { lifeGuideFor } from "@/server/life-guide";
import { monthYear, toLang } from "@/lib/interpret/life-guide-i18n";


function greeting(tz: string, g: { night: string; morning: string; afternoon: string; evening: string }) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  return h < 5 ? g.night : h < 12 ? g.morning : h < 17 ? g.afternoon : g.evening;
}

export default async function Overview() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) { const L0 = UI[await userLang(user.id)]; return (<><h1 className="mb-10 text-5xl">Namaste, {user.name.split(" ")[0]}.</h1><NoChart t={L0.noChart} /></>); }
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
  const lang = toLang(loaded.language);
  const L = UI[lang].home;
  const P = (p: Parameters<typeof planetName>[1]) => planetName(lang, p);
  const S = (x: string) => signName(lang, x);
  const guide = await lifeGuideFor(loaded.chartId, chart, loaded.fullName, lang);
  const G = { en: ["Your story in simple words", "Open my Life Guide →", "So far", "Right now", "Coming up", "What can I do? →", "good", "needs care", "mixed", "Your first chapter is still unfolding", "A steady stretch ahead"], hi: ["आपकी कहानी, आसान शब्दों में", "मेरी जीवन मार्गदर्शिका खोलें →", "अब तक", "अभी", "आगे", "मैं क्या करूँ? →", "अच्छा", "सावधानी", "मिला-जुला", "आपका पहला अध्याय अभी चल रहा है", "आगे का समय स्थिर है"], hinglish: ["Aapki kahani, aasaan shabdon mein", "Meri Life Guide kholiye →", "Ab tak", "Abhi", "Aage", "Main kya karun? →", "achha", "dhyan rakhein", "mila-jula", "Aapka pehla chapter abhi chal raha hai", "Aage ka time stable hai"] }[lang];
  const slow = transits.placements.filter((p) => ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.planet));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 pb-4">
        <p className="eyebrow">{new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date())} · {today.tithi}</p>
        <h1 className="text-4xl sm:text-6xl">{greeting(tz, UI[lang].greet)}, {loaded.fullName.split(" ")[0]}.</h1>
        <p className="text-slate">{L.moonToday(S(today.moon.sign), ordinalL(lang, today.moon.houseFromMoon))}</p>
      </header>

      {guide && (
        <Panel title={G[0]} action={<Link href="/dashboard/guide" className="text-xs text-gold hover:underline">{G[1]}</Link>}>
          <p className="font-display text-2xl leading-snug text-moon/95">{guide.headline}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/guide#past" className="rounded-2xl border hairline p-4 transition-colors hover:border-amethyst/40">
              <p className="text-xs tracking-[0.18em] text-slate uppercase">{G[2]}</p>
              <p className="mt-1 text-sm">{guide.past.length ? guide.past.slice(-2).map((c) => c.title).join(" → ") : G[9]}</p>
            </Link>
            <Link href="/dashboard/guide#now" className="rounded-2xl border border-gold/30 bg-gold/[.04] p-4 transition-colors hover:border-gold/50">
              <p className="text-xs tracking-[0.18em] text-gold uppercase">{G[3]}</p>
              <p className="mt-1 text-sm">{guide.present.chapter.title}{guide.present.sub ? ` · ${guide.present.sub.title}` : ""}</p>
            </Link>
            <Link href="/dashboard/guide#next" className="rounded-2xl border hairline p-4 transition-colors hover:border-amethyst/40">
              <p className="text-xs tracking-[0.18em] text-slate uppercase">{G[4]}</p>
              <p className="mt-1 text-sm">{guide.future[0] ? `${monthYear(lang, guide.future[0].date)}: ${guide.future[0].title}` : G[10]}</p>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.areas.map((a) => (
              <Link key={a.key} href="/dashboard/guide#areas" className={`rounded-full px-3 py-1 text-xs ${a.tone === "supportive" ? "bg-gold/15 text-gold" : a.tone === "demanding" ? "bg-[#E07A5F]/15 text-[#F0A08A]" : "bg-moon/5 text-slate"}`}>{a.label}: {a.tone === "supportive" ? G[6] : a.tone === "demanding" ? G[7] : G[8]}</Link>
            ))}
            <Link href="/dashboard/guide#do" className="rounded-full bg-violet/20 px-3 py-1 text-xs text-moon">{G[5]}</Link>
          </div>
        </Panel>
      )}

      <div className="grid gap-px overflow-hidden rounded-[1.5rem] border hairline bg-[rgba(165,139,255,.14)] sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Moon, k: L.rashi, v: S(chart.moonSign.signName), s: chart.confidence.moonSignStable ? L.sunIn(S(chart.sunSign.signName)) : L.uncertain },
          { icon: Star, k: L.nak, v: chart.janmaNakshatra.name, s: `${L.pada} ${chart.janmaNakshatra.pada} · ${L.lord} ${P(chart.janmaNakshatra.lord)}` },
          { icon: Sunrise, k: L.rising, v: chart.lagna ? S(chart.lagna.signName) : L.notShown, s: chart.lagna ? dms(chart.lagna.degree) : L.needsTime },
          { icon: Timer, k: L.md, v: act.mahadasha ? P(act.mahadasha.lord) : "—", s: act.antardasha ? `${P(act.antardasha.lord)} ${L.antardasha} ${L.until} ${dateL(lang, act.antardasha.end, { day: "numeric", month: "short", year: "numeric" })}` : "" },
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
        <Panel title={L.today} action={<Link href="/dashboard/daily" className="text-xs text-gold hover:underline">{L.calendar}</Link>}>
          <p className="font-display text-2xl leading-snug text-moon/95">{dailyTextL(today, lang)}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 ${today.moon.favorable ? "bg-gold/15 text-gold" : "bg-moon/5 text-slate"}`}>{L.moonChip(ordinalL(lang, today.moon.houseFromMoon))}</span>
            <span className={`rounded-full px-3 py-1 ${today.tara.quality === "favorable" ? "bg-gold/15 text-gold" : today.tara.quality === "challenging" ? "bg-[#E07A5F]/15 text-[#F0A08A]" : "bg-moon/5 text-slate"}`}>{L.taraChip(today.tara.name)}</span>
            <span className="rounded-full bg-moon/5 px-3 py-1 text-slate">{today.vara}</span>
          </div>
          <ol className="mt-6 grid grid-cols-7 gap-1.5" aria-label={L.week}>
            {week.map((d) => (
              <li key={d.date} className="rounded-xl border hairline p-2 text-center" title={`${d.moon.sign} · ${d.tara.name} tara`}>
                <p className="text-[10px] text-slate">{dateL(lang, d.date + "T12:00:00Z", { weekday: "short" })}</p>
                <p className="font-display text-lg">{d.date.slice(8)}</p>
                <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${d.tara.quality === "favorable" && d.moon.favorable ? "bg-gold" : d.tara.quality === "challenging" ? "bg-[#E07A5F]" : "bg-amethyst/60"}`} />
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-slate/80">{L.dotsNote(tz)}</p>
        </Panel>
        <Panel title={L.kundli} action={<Link href="/dashboard/kundli" className="text-xs text-gold hover:underline">{L.explore}</Link>}>
          <KundliChart chart={chart} className="mx-auto max-w-[340px]" />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title={L.period} action={<Link href="/dashboard/timeline" className="text-xs text-gold hover:underline">{L.timeline}</Link>}>
          {act.mahadasha && (
            <>
              <p className="font-display text-3xl">{P(act.mahadasha.lord)} <span className="text-slate">·</span> {act.antardasha ? P(act.antardasha.lord) : ""}</p>
              <p className="mt-1 text-sm text-slate">{L.md} {dateL(lang, act.mahadasha.start, { day: "numeric", month: "short", year: "numeric" })} – {dateL(lang, act.mahadasha.end, { day: "numeric", month: "short", year: "numeric" })}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-moon/10"><div className="h-full rounded-full bg-gradient-to-r from-violet to-gold" style={{ width: `${Math.round(((Date.now() - Date.parse(act.mahadasha.start)) / (Date.parse(act.mahadasha.end) - Date.parse(act.mahadasha.start))) * 100)}%` }} /></div>
              <p className="mt-4 text-sm leading-relaxed text-slate">{lang === "en" ? L.periodText(act.mahadasha.lord, SIGNIFICATIONS[act.mahadasha.lord].core.slice(0, 3).join(", "), act.antardasha?.lord ?? "", SIGNIFICATIONS[act.antardasha!.lord].core.slice(0, 2).join(" and ")) : L.periodText(P(act.mahadasha.lord), guide?.present.chapter.title ?? "", act.antardasha ? P(act.antardasha.lord) : "", guide?.present.sub?.title ?? "")}</p>
              {!chart.confidence.dashaTimingReliable && <p className="mt-3 text-xs text-gold">{L.indicative}</p>}
            </>
          )}
        </Panel>
        <Panel title={L.transits}>
          <ul className="divide-y divide-[rgba(165,139,255,.12)]">
            {slow.map((p) => (
              <li key={p.planet} className="flex items-center justify-between py-2.5 text-sm">
                <span>{P(p.planet)} <span className="text-slate">{L.in}</span> {S(p.signName)}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? <span className="ml-1 text-xs text-amethyst">R</span> : null}</span>
                <span className="text-slate">{ordinalL(lang, p.houseFromMoon)} {L.fromMoon}{p.houseFromLagna ? ` · ${ordinalL(lang, p.houseFromLagna)} ${L.fromLagna}` : ""}</span>
              </li>
            ))}
          </ul>
          {transits.sadeSati && <p className="mt-3 text-xs leading-relaxed text-slate">{transits.sadeSati.note}</p>}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title={L.ask} action={<span className="text-xs text-slate">{L.left(bal.aiMessages)}</span>}>
          <AskBox lang={lang} />
        </Panel>
        <Panel title={L.recent}>
          {recent.length ? (
            <ul className="space-y-1">
              {recent.map((c) => (
                <li key={c.id}><Link href={`/dashboard/aura?c=${c.id}`} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-moon/5"><span className="truncate">{c.title}</span><ArrowRight className="h-4 w-4 shrink-0 text-slate group-hover:text-gold" /></Link></li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate">{L.noConv}</p>}
        </Panel>
      </div>
    </div>
  );
}
