import Link from "next/link";
import { Hash, Layers, Hand, Orbit, Sparkles, FileText } from "lucide-react";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import { getConfig } from "@/server/config";
import { PageHeader } from "@/components/dashboard/ui";
import { BundleButton } from "@/components/readings/BundleButton";
import { PayuReturn } from "@/components/dashboard/PayuReturn";
import { availableCredits, products } from "@/server/readings/service";
import { chargePrice, fromPrice, rupees } from "@/lib/pricing";
import { REPORT_TYPES } from "@/server/reports";

export const metadata = { title: "My Readings" };

const CATS = [
  { id: "all", label: "All" },
  { id: "astrology", label: "Astrology" },
  { id: "numerology", label: "Numerology" },
  { id: "tarot", label: "Tarot" },
  { id: "palmistry", label: "Palmistry" },
  { id: "combined", label: "Combined" },
] as const;
const ICON = { astrology: Orbit, numerology: Hash, tarot: Layers, palmistry: Hand, combined: Sparkles } as const;
const STATUS: Record<string, [string, string]> = {
  AWAITING_PAYMENT: ["Awaiting payment", "bg-slate/15 text-slate"], PAID: ["Ready to start", "bg-amethyst/15 text-amethyst"], GENERATING: ["Generating", "bg-amethyst/15 text-amethyst"],
  READY: ["Ready", "bg-emerald-400/15 text-emerald-300"], FAILED: ["Needs retry", "bg-rose-400/15 text-rose-300"], NEEDS_PHOTO: ["Clearer photo needed", "bg-gold/15 text-gold"],
};
const PAY: Record<string, string> = { PAID: "Paid", CREATED: "Pending", FAILED: "Payment failed", REFUNDED: "Refunded", PARTIALLY_REFUNDED: "Partly refunded", CREDIT: "Bundle credit", FREE: "Free" };

type Item = { id: string; category: keyof typeof ICON; title: string; date: Date; payment: string; status: string; href: string; pdf?: string; aura: string };

export default async function MyReadings({ searchParams }: { searchParams: Promise<{ category?: string; payu?: string; closed?: string }> }) {
  const user = await requireUser();
  const { category = "all", payu, closed } = await searchParams;
  const [rows, reports, saved, credits, all, flags, combined] = await Promise.all([
    db.serviceReading.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 200, include: { payment: { select: { status: true } } } }),
    db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, type: true, createdAt: true } }),
    db.reading.findMany({ where: { userId: user.id, saved: true }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, topic: true, createdAt: true } }),
    availableCredits(user.id), products(), getConfig("flags"),
    db.entitlement.count({ where: { userId: user.id, kind: "combined_insights", revokedAt: null } }),
  ]);
  const items: Item[] = [
    ...rows.map((r) => ({ id: r.id, category: r.category as Item["category"], title: r.title, date: r.createdAt, payment: r.payment?.status ?? (r.creditId ? "CREDIT" : "CREATED"), status: r.status, href: `/dashboard/readings/${r.id}`, pdf: r.status === "READY" ? `/api/readings/service/${r.id}/pdf` : undefined, aura: `/dashboard/aura?mode=${r.category}` })),
    ...reports.map((r) => ({ id: r.id, category: "astrology" as const, title: REPORT_TYPES[r.type as keyof typeof REPORT_TYPES]?.title ?? r.type, date: r.createdAt, payment: "FREE", status: "READY", href: `/dashboard/reports/${r.id}`, pdf: `/api/reports/${r.id}/pdf`, aura: "/dashboard/aura?mode=astrology" })),
    ...saved.map((r) => ({ id: r.id, category: "astrology" as const, title: `Saved AURA answer — ${r.topic ?? "general"}`, date: r.createdAt, payment: "FREE", status: "READY", href: "/dashboard/saved", aura: "/dashboard/aura?mode=astrology" })),
  ].sort((a, b) => +b.date - +a.date);
  const shown = category === "all" ? items : category === "combined" ? [] : items.filter((i) => i.category === category);
  const bundle = all.find((p) => p.category === "bundle" && p.active);
  const creditList = Object.entries(credits).filter(([, n]) => n > 0);
  const open = (c: "numerology" | "tarot" | "palmistry") => user.role === "ADMIN" || flags[c] !== false;
  const starts = (["numerology", "tarot", "palmistry"] as const).map((c) => ({ c, from: fromPrice(all, c), open: open(c) }));

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="My Readings" title="Every reading, in one place" intro="Astrology, numerology, tarot and palmistry. Anything you've paid for stays here — reopen it, download it or ask AURA about it, without paying again." />
      {payu && <PayuReturn paymentId={payu} />}
      {closed && <p className="rounded-xl border hairline bg-navy/40 px-4 py-3 text-sm text-slate">That reading type is opening soon. We&apos;ll release it once its analysis meets our accuracy bar.</p>}

      <section aria-label="Start a reading" className="grid gap-4 md:grid-cols-3">
        {starts.map(({ c, from, open: isOpen }) => {
          const Icon = ICON[c];
          return (
            <div key={c} className="glass flex flex-col rounded-[1.5rem] p-6">
              <Icon className="h-6 w-6 text-gold" />
              <h2 className="mt-3 font-display text-2xl capitalize">{c}</h2>
              <p className="mt-1 flex-1 text-sm text-slate">{c === "numerology" ? "Your core numbers and Lo Shu grid, calculated exactly." : c === "tarot" ? "Choose your cards from a securely shuffled deck." : "Upload your palm; we read only what's visible."}</p>
              {isOpen ? <Link href={`/dashboard/readings/new?category=${c}`} className="btn-ghost mt-5 !py-2.5 text-sm">Start{from ? ` · from ${rupees(from)}` : ""}{c === "palmistry" && !flags.palmistry ? " (admin preview)" : ""}</Link> : <span className="mt-5 text-sm text-slate">Opening soon</span>}
            </div>
          );
        })}
      </section>

      {creditList.length > 0 && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">You have prepaid credits: {creditList.map(([id, n]) => `${all.find((p) => p.id === id)?.name ?? id}${n > 1 ? ` ×${n}` : ""}`).join(", ")}. Choose that reading and it unlocks without payment.</p>
      )}

      {bundle && (
        <section className="glass flex flex-col gap-4 rounded-[1.5rem] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Best value</p>
            <h2 className="mt-1 font-display text-2xl">{bundle.name}</h2>
            <p className="mt-1 text-sm text-slate">{bundle.description}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-gold">{rupees(chargePrice(bundle))}{chargePrice(bundle) < bundle.priceMinor && <span className="ml-2 text-base text-slate line-through">{rupees(bundle.priceMinor)}</span>}</p>
            <BundleButton productId={bundle.id} label="Get the bundle" />
          </div>
        </section>
      )}

      <nav aria-label="Filter readings" className="flex flex-wrap gap-2">
        {CATS.map((c) => <Link key={c.id} href={c.id === "all" ? "/dashboard/readings" : `/dashboard/readings?category=${c.id}`} aria-current={category === c.id ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm ${category === c.id ? "bg-gold/15 text-gold" : "text-slate hover:bg-moon/5 hover:text-moon"}`}>{c.label}</Link>)}
      </nav>

      {category === "combined" ? (
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="font-display text-2xl">Combined Insights</h2>
          <p className="mt-1 text-sm text-slate">Career, relationships, growth and money — drawn from the readings you already have, with every point labelled by the system it came from.{combined ? "" : " Included with the bundle; you can preview what's available any time."}</p>
          <Link href="/dashboard/insights" className="btn-primary mt-4 !py-2.5 text-sm">Open Combined Insights</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-slate">No readings here yet.</p>
      ) : (
        <ul className="divide-y divide-[rgba(165,139,255,.12)] border-y hairline">
          {shown.map((i) => {
            const Icon = ICON[i.category];
            const [st, cls] = STATUS[i.status] ?? [i.status, "bg-slate/15 text-slate"];
            return (
              <li key={`${i.category}-${i.id}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                  <div>
                    <Link href={i.href} className="text-moon hover:text-gold">{i.title}</Link>
                    <p className="text-xs text-slate"><span className="capitalize">{i.category}</span> · {i.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {PAY[i.payment] ?? i.payment}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${cls}`}>{st}</span>
                  <Link href={i.href} className="text-gold hover:underline">View</Link>
                  {i.status === "READY" && <Link href={i.aura} className="text-gold hover:underline">Ask AURA</Link>}
                  {i.pdf && <a href={i.pdf} className="inline-flex items-center gap-1 text-gold hover:underline"><FileText className="h-3.5 w-3.5" />PDF</a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
