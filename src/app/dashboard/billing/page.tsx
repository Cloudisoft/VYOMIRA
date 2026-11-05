import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import { balance } from "@/server/billing/entitlements";
import { getConfig } from "@/server/config";
import { detectCountry } from "@/server/country";
import { features } from "@/server/env";
import { formatMoney, regionFor } from "@/lib/pricing";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { Checkout } from "@/components/dashboard/Checkout";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string; status?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [bal, payments, pricing, country, usage] = await Promise.all([
    balance(user.id),
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    getConfig("pricing"),
    detectCountry(),
    db.usageLedger.findMany({ where: { userId: user.id, kind: "ai_message" }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const { region } = regionFor(country, pricing);
  const f = features();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Billing" title="Messages & packs" intro="One-time packs. No subscriptions, no auto-renewal." />
      {sp.status === "processing" && <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">Payment received by the provider — your pack activates as soon as we receive their confirmation (usually seconds).</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <p className="text-xs tracking-[0.2em] text-slate uppercase">AURA messages</p>
          <p className="mt-2 font-display text-6xl">{bal.aiMessages}</p>
          <p className="mt-2 text-sm text-slate">Detailed reports: <span className={bal.detailedReports ? "text-gold" : ""}>{bal.detailedReports ? "unlocked" : "locked"}</span></p>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {pricing.plans.map((p) => (
            <div key={p.id} className={`glass rounded-[1.5rem] p-6 ${sp.plan === p.id ? "ring-1 ring-gold/60" : ""}`}>
              <div className="flex items-baseline justify-between"><h2 className="font-display text-3xl">{p.name}</h2><p className="font-display text-3xl text-gold">{formatMoney(region.prices[p.id], region)}</p></div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate">{p.features.map((x) => <li key={x}>· {x}</li>)}</ul>
              <Checkout planId={p.id} label={`Buy ${p.name}`} highlight={p.highlight || sp.plan === p.id} />
            </div>
          ))}
        </div>
      </div>
      {!f.razorpay && f.testPayments && <p className="rounded-xl border border-amethyst/40 bg-violet/10 px-4 py-3 text-sm text-moon/90"><strong>Test mode.</strong> Razorpay keys aren't configured, so checkout opens a clearly-labelled simulator. No money moves and no real payment is recorded.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payment history">
          {payments.length ? (
            <ul className="divide-y divide-[rgba(165,139,255,.12)] text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <span>{pricing.plans.find((x) => x.id === p.planId)?.name ?? p.planId} <span className="text-xs text-slate">· {p.createdAt.toLocaleDateString("en-GB")} · {p.provider}</span></span>
                  <span className="flex items-center gap-3"><span className="tabular-nums">{(p.amountMinor / 100).toFixed(2)} {p.currency}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${p.status === "PAID" ? "bg-gold/15 text-gold" : p.status === "FAILED" ? "bg-[#E07A5F]/15 text-[#F0A08A]" : "bg-moon/5 text-slate"}`}>{p.status}</span></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate">No payments yet.</p>}
        </Panel>
        <Panel title="Recent usage">
          {usage.length ? <ul className="space-y-1.5 text-sm text-slate">{usage.map((u) => <li key={u.id} className="flex justify-between"><span>{u.delta < 0 ? "AURA message" : "Unit returned (not charged)"}</span><span>{u.createdAt.toLocaleString("en-GB")}</span></li>)}</ul> : <p className="text-sm text-slate">No usage yet.</p>}
        </Panel>
      </div>
      <p className="text-xs text-slate/70">Refunds: see our <a className="underline" href="/legal/refunds">refund policy</a>. Need help? support@vyomira.app</p>
    </div>
  );
}
