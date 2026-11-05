import { db } from "@/server/db";
import { features } from "@/server/env";
import { Panel } from "@/components/dashboard/ui";

/** Aggregate metrics only — no birth data is ever displayed in admin analytics. */
export default async function AdminOverview() {
  const since30 = new Date(Date.now() - 30 * 86400000);
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [users, users30, charts, convs, msgs30, paid, revenue, cost, errors24, reported] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since30 } } }),
    db.chartSnapshot.count(),
    db.conversation.count(),
    db.usageLedger.count({ where: { kind: "ai_message", delta: -1, createdAt: { gte: since30 } } }),
    db.payment.count({ where: { status: "PAID" } }),
    db.payment.groupBy({ by: ["currency", "provider"], where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { amountMinor: true, refundedMinor: true } }),
    db.usageLedger.aggregate({ _sum: { costMicros: true, tokensIn: true, tokensOut: true }, where: { kind: "llm_tokens", createdAt: { gte: monthStart } } }),
    db.auditEvent.count({ where: { level: "error", createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    db.message.count({ where: { reported: true } }),
  ]);
  const f = features();
  const tiles = [["Users", users, `+${users30} in 30 days`], ["Charts computed & saved", charts, ""], ["Conversations", convs, `${msgs30} paid messages / 30d`], ["Paid orders", paid, ""], ["AI spend this month", `$${((cost._sum.costMicros ?? 0) / 1e6).toFixed(2)}`, `${cost._sum.tokensIn ?? 0} in / ${cost._sum.tokensOut ?? 0} out tokens`], ["Errors (24h)", errors24, `${reported} reported answers`]];
  return (
    <div className="space-y-6">
      <h1 className="text-5xl">Operations</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(([k, v, s]) => <div key={String(k)} className="glass rounded-2xl p-5"><p className="text-xs tracking-[0.18em] text-slate uppercase">{k}</p><p className="mt-2 font-display text-4xl">{v}</p><p className="text-xs text-slate">{s}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue (net of refunds)">
          {revenue.length ? <ul className="space-y-2 text-sm">{revenue.map((r) => <li key={r.currency + r.provider} className="flex justify-between"><span>{r.currency} · {r.provider}{r.provider === "test" && <span className="ml-2 text-xs text-amethyst">simulated</span>}</span><span className="tabular-nums">{(((r._sum.amountMinor ?? 0) - (r._sum.refundedMinor ?? 0)) / 100).toFixed(2)}</span></li>)}</ul> : <p className="text-sm text-slate">No revenue yet.</p>}
        </Panel>
        <Panel title="Integration status">
          <ul className="space-y-2 text-sm">
            {Object.entries(f).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-slate">{k}</span><span className={v ? "text-gold" : "text-slate/60"}>{v ? "configured" : "not configured"}</span></li>)}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
