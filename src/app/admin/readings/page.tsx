import { db } from "@/server/db";
import { getConfig } from "@/server/config";
import { ReadingProductsEditor } from "@/components/admin/ReadingProductsEditor";
import { AdminAction } from "@/components/admin/AdminAction";
import { FlagToggles } from "@/components/admin/FlagToggles";
import { rupees } from "@/lib/pricing";

/** Readings operations. Never shows customer inputs, photos or report text — only metadata. */
export default async function AdminReadings() {
  const pricing = await getConfig("pricing");
  const ids = pricing.readings.map((p) => p.id);
  const since30 = new Date(Date.now() - 30 * 86400000);
  const [byStatus, revenue, failed, recent, cost, pending] = await Promise.all([
    db.serviceReading.groupBy({ by: ["category", "status"], _count: { _all: true } }),
    db.payment.groupBy({ by: ["planId"], where: { planId: { in: ids }, status: "PAID", createdAt: { gte: since30 } }, _sum: { amountMinor: true }, _count: { _all: true } }),
    db.serviceReading.findMany({ where: { status: { in: ["FAILED", "GENERATING"] } }, orderBy: { updatedAt: "desc" }, take: 50, include: { user: { select: { email: true } } } }),
    db.serviceReading.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { user: { select: { email: true } }, payment: { select: { status: true, amountMinor: true } } } }),
    db.usageLedger.aggregate({ where: { kind: "llm_tokens", refId: { startsWith: "reading:" }, createdAt: { gte: since30 } }, _sum: { costMicros: true, tokensIn: true, tokensOut: true }, _count: { _all: true } }),
    db.payment.findMany({ where: { provider: "payu", status: "CREATED", planId: { in: ids }, createdAt: { lt: new Date(Date.now() - 10 * 60000) } }, orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { email: true } } } }),
  ]);
  const cats = ["numerology", "tarot", "palmistry"];
  const statuses = ["AWAITING_PAYMENT", "PAID", "GENERATING", "READY", "FAILED", "NEEDS_PHOTO"];
  const count = (c: string, s: string) => byStatus.find((b) => b.category === c && b.status === s)?._count._all ?? 0;
  const flags = await getConfig("flags");
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl">Readings</h1>
        <p className="mt-2 text-sm text-slate">Numerology, tarot and palmistry. Categories open to users: numerology {flags.numerology ? "on" : "off"}, tarot {flags.tarot ? "on" : "off"}, palmistry {flags.palmistry ? "on" : "off (admins only)"} — use the switches below. Customer inputs, photos and report text are never shown here.</p>
      </div>

      <section className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
        <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Category</th>{statuses.map((s) => <th key={s}>{s.replace("_", " ").toLowerCase()}</th>)}</tr></thead>
        <tbody>{cats.map((c) => <tr key={c} className="border-t hairline"><td className="py-2 capitalize">{c}</td>{statuses.map((s) => <td key={s}>{count(c, s)}</td>)}</tr>)}</tbody>
      </table></section>

      <section>
        <h2 className="font-display text-2xl">Last 30 days</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4"><p className="text-xs text-slate">Revenue (readings + bundles)</p><p className="font-display text-3xl text-gold">{rupees(revenue.reduce((s, r) => s + (r._sum.amountMinor ?? 0), 0))}</p></div>
          <div className="glass rounded-2xl p-4"><p className="text-xs text-slate">AI cost for readings</p><p className="font-display text-3xl">${((cost._sum.costMicros ?? 0) / 1e6).toFixed(2)}</p><p className="text-xs text-slate">{cost._count._all} calls · {(((cost._sum.tokensIn ?? 0) + (cost._sum.tokensOut ?? 0)) / 1000).toFixed(0)}k tokens</p></div>
          <div className="glass rounded-2xl p-4"><p className="text-xs text-slate">Paid orders</p><p className="font-display text-3xl">{revenue.reduce((s, r) => s + r._count._all, 0)}</p></div>
        </div>
        <ul className="mt-3 text-sm text-slate">{revenue.map((r) => <li key={r.planId}>{r.planId}: {r._count._all} × → {rupees(r._sum.amountMinor ?? 0)}</li>)}</ul>
      </section>

      <FlagToggles initial={flags} />

      <ReadingProductsEditor pricing={pricing} />

      <section>
        <h2 className="font-display text-2xl">Failed or stuck generations</h2>
        {failed.length === 0 ? <p className="mt-2 text-sm text-slate">None.</p> : <ul className="mt-3 divide-y divide-[rgba(165,139,255,.12)] text-sm">{failed.map((r) => <li key={r.id} className="flex flex-wrap items-center gap-3 py-2"><span className="font-mono text-xs">{r.id}</span><span>{r.user.email}</span><span className="capitalize">{r.category}/{r.tier}</span><span className="text-rose-300">{r.status}</span><span className="text-slate">attempts {r.attempts}</span><AdminAction url={`/api/admin/readings/${r.id}/retry`} label="Retry" /></li>)}</ul>}
      </section>

      <section>
        <h2 className="font-display text-2xl">Unconfirmed PayU orders</h2>
        <p className="mt-1 text-sm text-slate">Older than 10 minutes and not yet confirmed. “Reconcile” asks PayU for the order's status and unlocks it if paid (safe to repeat).</p>
        {pending.length === 0 ? <p className="mt-2 text-sm text-slate">None.</p> : <ul className="mt-3 divide-y divide-[rgba(165,139,255,.12)] text-sm">{pending.map((p) => <li key={p.id} className="flex flex-wrap items-center gap-3 py-2"><span>{p.createdAt.toLocaleString("en-GB")}</span><span>{p.user.email}</span><span>{p.planId}</span><span>{rupees(p.amountMinor)}</span><AdminAction url={`/api/admin/payments/${p.id}/reconcile`} label="Reconcile" /></li>)}</ul>}
      </section>

      <section>
        <h2 className="font-display text-2xl">Recent readings</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Created</th><th>User</th><th>Product</th><th>Status</th><th>Payment</th><th>Generator</th></tr></thead>
          <tbody>{recent.map((r) => <tr key={r.id} className="border-t hairline"><td className="py-2">{r.createdAt.toLocaleString("en-GB")}</td><td>{r.user.email}</td><td>{r.productId}</td><td>{r.status}</td><td>{r.payment ? `${r.payment.status} ${rupees(r.payment.amountMinor)}` : r.creditId ? "credit" : "—"}</td><td className="text-xs text-slate">{r.generator ?? "—"}</td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}
