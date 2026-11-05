import { db } from "@/server/db";

export default async function AdminPayments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } }, entitlements: { select: { kind: true, remaining: true, quantity: true } } } });
  const stale = payments.filter((p) => p.status === "CREATED" && Date.now() - p.createdAt.getTime() > 3600000).length;
  return (
    <div>
      <h1 className="text-4xl">Payments & reconciliation</h1>
      <p className="mt-2 text-sm text-slate">{stale} orders created over an hour ago are still unpaid (abandoned, or awaiting a webhook). Compare with the Razorpay dashboard; refunds issued there arrive via the refund webhook and revoke unused units automatically.</p>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Created</th><th>User</th><th>Provider</th><th>Order</th><th>Plan</th><th>Amount</th><th>Status</th><th>Entitlements</th></tr></thead>
        <tbody>{payments.map((p) => <tr key={p.id} className="border-t hairline"><td className="py-2">{p.createdAt.toLocaleString("en-GB")}</td><td>{p.user.email}</td><td>{p.provider}</td><td className="font-mono text-xs">{p.providerOrderId}</td><td>{p.planId}</td><td>{(p.amountMinor / 100).toFixed(2)} {p.currency}</td><td>{p.status}</td><td className="text-xs text-slate">{p.entitlements.map((e) => `${e.kind} ${e.remaining}/${e.quantity}`).join(", ")}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
