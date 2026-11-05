import { db } from "@/server/db";
import { verifyStripeSignature } from "@/server/billing/stripe";
import { applyRefund, fulfillPayment } from "@/server/billing/fulfill";
import { audit, logError } from "@/server/audit";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"))) {
    await audit("webhook.stripe.invalid_signature", { level: "warn" });
    return new Response("invalid signature", { status: 400 });
  }
  try {
    const ev = JSON.parse(raw) as { type: string; data: { object: { id: string; metadata?: { paymentId?: string }; payment_intent?: string; amount_total?: number; amount_refunded?: number; payment_status?: string } } };
    const o = ev.data.object;
    if (ev.type === "checkout.session.completed" && o.payment_status === "paid" && o.metadata?.paymentId) {
      const p = await db.payment.findUnique({ where: { id: o.metadata.paymentId } });
      if (p && o.amount_total === p.amountMinor) await fulfillPayment(p.id, o.payment_intent ?? o.id, { via: "stripe-webhook" });
    } else if (ev.type === "charge.refunded" && o.payment_intent) {
      const p = await db.payment.findUnique({ where: { providerPaymentId: o.payment_intent } });
      if (p) await applyRefund(p.id, o.amount_refunded ?? 0, { via: "stripe-webhook" });
    }
    return new Response("ok");
  } catch (e) {
    logError("webhook-stripe", e);
    return new Response("error", { status: 500 });
  }
}
