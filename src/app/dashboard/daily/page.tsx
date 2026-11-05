import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { userTimeZone } from "@/server/tz";
import { NoChart, PageHeader, Panel } from "@/components/dashboard/ui";
import { cosmicCalendar, dailyInsight } from "@/lib/interpret/daily";
import { ORDINAL } from "@/lib/interpret/catalog";
import { cn } from "@/lib/utils";

export const metadata = { title: "Daily Insights" };

export default async function DailyPage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart />;
  const tz = await userTimeZone();
  const today = dailyInsight(loaded.chart, tz);
  const cal = cosmicCalendar(loaded.chart, tz, 14);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Daily insights · ${tz}`} title="Today, in your sky" />
      <Panel>
        <p className="font-display text-3xl leading-snug">{today.text}</p>
        <ul className="mt-6 space-y-1 text-xs text-slate">{today.basis.map((b) => <li key={b}>· {b}</li>)}</ul>
      </Panel>
      <Panel title="Cosmic calendar — next 14 days">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {cal.map((d) => (
            <li key={d.date} className={cn("rounded-2xl border p-3", d.tara.quality === "favorable" && d.moon.favorable ? "border-gold/40 bg-gold/[.05]" : "hairline")}>
              <p className="text-xs text-slate">{new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
              <p className="mt-1 text-sm text-moon">Moon in {d.moon.sign}</p>
              <p className="text-xs text-slate">{ORDINAL[d.moon.houseFromMoon]} from natal · {d.moon.nakshatra}</p>
              <p className={cn("mt-2 text-xs", d.tara.quality === "favorable" ? "text-gold" : d.tara.quality === "challenging" ? "text-[#F0A08A]" : "text-amethyst")}>{d.tara.name} tara</p>
              <p className="mt-1 text-[11px] text-slate/70">{d.tithi}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate/70">Evaluated at 06:00 local time. Tara Bala and Chandra gochara are traditional muhurta guides, not forecasts.</p>
      </Panel>
    </div>
  );
}
