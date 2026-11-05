import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { fulfillPayment, markFailed } from "./fulfill";
import { payuLinkTransactions } from "./payu";

/** Server-side source of truth for a PayU order: fetch the link's transactions and reconcile. */
export async function confirmPayu(paymentId: string) {
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p || p.provider !== "payu") return { status: "unknown" as const };
  if (p.status === "PAID" || p.status === "REFUNDED") return { status: p.status };
  const txns = await payuLinkTransactions(p.providerOrderId);
  const ok = txns.find((t) => t.status?.toLowerCase() === "success");
  if (ok) {
    if (Math.round(ok.settledAmount * 100) !== p.amountMinor) {
      await audit("payment.amount_mismatch", { userId: p.userId, target: p.id, level: "error", meta: { expected: p.amountMinor, got: ok.settledAmount } });
      return { status: "mismatch" as const };
    }
    await fulfillPayment(p.id, `payu_${ok.paymentId}`, { via: "payu", txnid: ok.transactionId, mode: ok.mode });
    return { status: "PAID" as const };
  }
  if (txns.length && txns.every((t) => t.status?.toLowerCase() === "failure")) {
    await markFailed(p.id, { via: "payu" });
    return { status: "FAILED" as const };
  }
  return { status: "PENDING" as const };
}
