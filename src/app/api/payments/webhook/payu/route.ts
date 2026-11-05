import { db } from "@/server/db";
import { verifyPayuWebhook } from "@/server/billing/payu";
import { confirmPayu } from "@/server/billing/payu-confirm";
import { confirmRenewal, confirmSubscription } from "@/server/billing/subscription-flow";
import { audit, logError } from "@/server/audit";

/**
 * PayU webhook (payment_success / payment_failure / payment_pending), form-encoded.
 * After the hash check we still reconcile via the API, so a forged-but-valid-looking body can't grant credits.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const fields = Object.fromEntries(new URLSearchParams(raw));
  if (!verifyPayuWebhook(fields)) {
    await audit("webhook.payu.invalid_hash", { level: "warn" });
    return new Response("invalid hash", { status: 400 });
  }
  try {
    // Subscription payments carry udf1 = "sub:<id>" (and udf2 = renewal invoice).
    if (fields.udf1?.startsWith("sub:")) {
      const id = fields.udf1.slice(4);
      const sub = await db.subscription.findUnique({ where: { id } });
      if (!sub) return new Response("ok (unknown subscription)");
      if (sub.status === "PENDING") await confirmSubscription(id);
      else await confirmRenewal(id);
      return new Response("ok");
    }
    const paymentId = fields.udf1;
    const payment = paymentId ? await db.payment.findUnique({ where: { id: paymentId } }) : null;
    if (!payment) return new Response("ok (unknown order)");
    await confirmPayu(payment.id);
    return new Response("ok");
  } catch (e) {
    logError("webhook-payu", e);
    return new Response("error", { status: 500 });
  }
}
