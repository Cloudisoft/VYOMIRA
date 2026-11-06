import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { UI, dateL, ordinalL, signName } from "@/lib/i18n/ui";
import { loadChart } from "@/server/charts";
import { userTimeZone } from "@/server/tz";
import { NoChart, PageHeader, Panel } from "@/components/dashboard/ui";
import { cosmicCalendar, dailyInsight, dailyTextL } from "@/lib/interpret/daily";
import { cn } from "@/lib/utils";

export const metadata = { title: "Daily Insights" };

export default async function DailyPage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  const lang = await userLang(user.id);
  const L = UI[lang].daily;
  if (!loaded) return <NoChart t={UI[lang].noChart} />;
  const tz = await userTimeZone();
  const today = dailyInsight(loaded.chart, tz);
  const cal = cosmicCalendar(loaded.chart, tz, 14);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`${L.eyebrow} · ${tz}`} title={L.title} />
      <Panel>
        <p className="font-display text-3xl leading-snug">{dailyTextL(today, lang)}</p>
        <ul className="mt-6 space-y-1 text-xs text-slate">{today.basis.map((b) => <li key={b}>· {b}</li>)}</ul>
      </Panel>
      <Panel title={L.cal}>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {cal.map((d) => (
            <li key={d.date} className={cn("rounded-2xl border p-3", d.tara.quality === "favorable" && d.moon.favorable ? "border-gold/40 bg-gold/[.05]" : "hairline")}>
              <p className="text-xs text-slate">{dateL(lang, d.date + "T12:00:00Z", { weekday: "short", day: "numeric", month: "short" })}</p>
              <p className="mt-1 text-sm text-moon">{L.moonIn(signName(lang, d.moon.sign))}</p>
              <p className="text-xs text-slate">{ordinalL(lang, d.moon.houseFromMoon)} {L.fromNatal} · {d.moon.nakshatra}</p>
              <p className={cn("mt-2 text-xs", d.tara.quality === "favorable" ? "text-gold" : d.tara.quality === "challenging" ? "text-[#F0A08A]" : "text-amethyst")}>{d.tara.name} {L.tara}</p>
              <p className="mt-1 text-[11px] text-slate/70">{d.tithi}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate/70">{L.note}</p>
      </Panel>
    </div>
  );
}
