import { db } from "@/server/db";
import { RefundButton } from "@/components/admin/RefundButton";

export default async function AdminPayments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } }, entitlements: { select: { kind: true, remaining: true, quantity: true } } } });
  const stale = payments.filter((p) => p.status === "CREATED" && Date.now() - p.createdAt.getTime() > 3600000).length;
  return (
    <div>
      <h1 className="text-4xl">Payments & reconciliation</h1>
      <p className="mt-2 text-sm text-slate">{stale} orders created over an hour ago are still unpaid (abandoned, or awaiting a webhook). PayU orders are confirmed server-to-server via the Payment Links API and webhook. PayU refunds are issued in the PayU dashboard (its refund API needs merchant key + salt); record them here with “Record refund” so unused messages are revoked.</p>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Created</th><th>User</th><th>Provider</th><th>Order</th><th>Plan</th><th>Amount</th><th>Status</th><th>Entitlements</th></tr></thead>
        <tbody>{payments.map((p) => <tr key={p.id} className="border-t hairline"><td className="py-2">{p.createdAt.toLocaleString("en-GB")}</td><td>{p.user.email}</td><td>{p.provider}</td><td className="font-mono text-xs">{p.providerOrderId}</td><td>{p.planId}</td><td>{(p.amountMinor / 100).toFixed(2)} {p.currency}</td><td>{p.status}{["PAID", "PARTIALLY_REFUNDED"].includes(p.status) && <> <RefundButton id={p.id} max={p.amountMinor - p.refundedMinor} currency={p.currency} /></>}</td><td className="text-xs text-slate">{p.entitlements.map((e) => `${e.kind} ${e.remaining}/${e.quantity}`).join(", ")}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
