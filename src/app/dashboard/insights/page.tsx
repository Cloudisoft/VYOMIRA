import Link from "next/link";
import { Orbit, Hash, Layers, Hand } from "lucide-react";
import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { db } from "@/server/db";
import { PageHeader } from "@/components/dashboard/ui";
import { combinedInsights, userContext, type System } from "@/server/readings/context";
import { rui } from "@/lib/readings/ui-strings";
import { toRLang } from "@/lib/readings/lang";

export const metadata = { title: "Combined Insights" };
const SYS: Record<System, { icon: typeof Orbit; cls: string }> = {
  astrology: { icon: Orbit, cls: "bg-amethyst/15 text-amethyst" },
  numerology: { icon: Hash, cls: "bg-gold/15 text-gold" },
  palmistry: { icon: Hand, cls: "bg-emerald-400/15 text-emerald-300" },
  tarot: { icon: Layers, cls: "bg-sky-400/15 text-sky-300" },
};

export default async function InsightsPage() {
  const user = await requireUser();
  const lang = toRLang(await userLang(user.id));
  const t = rui(lang);
  const lbl = (s: System) => t.cat[s];
  const [ctx, bundle] = await Promise.all([userContext(user.id, undefined, lang), db.entitlement.count({ where: { userId: user.id, kind: "combined_insights", revokedAt: null } })]);
  const areas = combinedInsights(ctx, lang);
  const have = (Object.keys(SYS) as System[]).filter((s) => ctx[s]);
  const missing = (Object.keys(SYS) as System[]).filter((s) => !ctx[s]);
  return (
    <div className="space-y-10">
      <PageHeader eyebrow={t.insEyebrow} title={t.insTitle} intro={t.insIntro} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate">{t.basedOn}</span>
        {have.length ? have.map((s) => { const S = SYS[s]; return <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${S.cls}`}><S.icon className="h-3.5 w-3.5" />{lbl(s)}{s === "numerology" && ctx.numerology?.source === "birth details" ? t.fromBirth : ""}</span>; }) : <span className="text-slate">{t.nothingYet}</span>}
      </div>
      {missing.length > 0 && (
        <p className="rounded-xl border hairline bg-navy/40 px-4 py-3 text-sm text-slate">
          {t.add} {missing.map((m) => lbl(m)).join(", ")} {t.toEnrich}{" "}
          {missing.includes("astrology") ? <Link href="/onboarding" className="text-gold hover:underline">{t.createKundli}</Link> : <Link href="/dashboard/readings" className="text-gold hover:underline">{t.startReading}</Link>}
          {!bundle && <> · <Link href="/dashboard/readings" className="text-gold hover:underline">Self-Discovery Bundle</Link> — {t.bundleHint}</>}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {areas.map((a, i) => (
          <section key={a.id} className="glass reveal-up rounded-[1.5rem] p-6" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">{a.title}</h2>
              <span className="text-[11px] tracking-wide text-slate">{a.systems.length ? `${t.from2} ${a.systems.map((s) => lbl(s)).join(" + ")}` : t.noCover}</span>
            </div>
            {a.points.length ? (
              <ul className="mt-4 space-y-4">
                {a.points.map((p, j) => { const S = SYS[p.system]; return (
                  <li key={j} className="flex gap-3">
                    <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${S.cls}`} title={lbl(p.system)}><S.icon className="h-3.5 w-3.5" /><span className="sr-only">{lbl(p.system)}</span></span>
                    <div><p className="text-[15px] leading-relaxed text-moon/85">{p.text}</p>{p.note && <p className="mt-1 text-xs text-slate">{p.note}</p>}</div>
                  </li>
                ); })}
              </ul>
            ) : <p className="mt-3 text-sm text-slate">{t.nothingHere}</p>}
            {a.points.length > 0 && <Link href={`/dashboard/aura?mode=combined&draft=${encodeURIComponent(t.auraDraft(a.id))}`} className="mt-5 inline-block text-sm text-gold hover:underline">{t.askAbout}</Link>}
          </section>
        ))}
      </div>
    </div>
  );
}
