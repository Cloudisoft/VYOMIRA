import { db } from "@/server/db";
import { verifyWebhookSignature } from "@/server/billing/razorpay";
import { applyRefund, fulfillPayment, markFailed } from "@/server/billing/fulfill";
import { audit, logError } from "@/server/audit";

interface RzpEvent {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; amount: number; amount_refunded?: number; status: string } };
    order?: { entity: { id: string } };
    refund?: { entity: { payment_id: string; amount: number } };
  };
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    await audit("webhook.razorpay.invalid_signature", { level: "warn" });
    return new Response("invalid signature", { status: 400 });
  }
  try {
    const ev = JSON.parse(raw) as RzpEvent;
    const pay = ev.payload.payment?.entity;
    const orderId = pay?.order_id ?? ev.payload.order?.entity.id;
    const payment = orderId ? await db.payment.findUnique({ where: { providerOrderId: orderId } }) : pay ? await db.payment.findUnique({ where: { providerPaymentId: pay.id } }) : null;
    if (!payment) return new Response("ok (unknown order)", { status: 200 });
    switch (ev.event) {
      case "payment.captured":
      case "order.paid":
        if (pay && pay.amount !== payment.amountMinor) {
          await audit("payment.amount_mismatch", { userId: payment.userId, target: payment.id, level: "error", meta: { expected: payment.amountMinor, got: pay.amount } });
          break;
        }
        await fulfillPayment(payment.id, pay?.id ?? null, { via: "webhook", event: ev.event });
        break;
      case "payment.failed":
        await markFailed(payment.id, { via: "webhook" });
        break;
      case "refund.processed":
      case "refund.created":
      case "payment.refunded":
        await applyRefund(payment.id, pay?.amount_refunded ?? ev.payload.refund?.entity.amount ?? 0, { via: "webhook", event: ev.event });
        break;
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    logError("webhook-razorpay", e);
    return new Response("error", { status: 500 }); // provider retries
  }
}
