import { db } from "@/server/db";
import { verifyPayuWebhook } from "@/server/billing/payu";
import { confirmPayu } from "@/server/billing/payu-confirm";
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
