import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { verifyCheckoutSignature } from "@/server/billing/razorpay";
import { fulfillPayment } from "@/server/billing/fulfill";
import { audit } from "@/server/audit";

const schema = z.object({ razorpay_order_id: z.string().min(5), razorpay_payment_id: z.string().min(5), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/) });

/** Checkout callback. The webhook is the source of truth; this just makes fulfilment instant. */
export const POST = authed("payment-verify", async (req, { user }) => {
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  const payment = await db.payment.findFirst({ where: { providerOrderId: p.data.razorpay_order_id, userId: user.id, provider: "razorpay" } });
  if (!payment) return err(404, "Order not found");
  if (!verifyCheckoutSignature(p.data.razorpay_order_id, p.data.razorpay_payment_id, p.data.razorpay_signature)) {
    await audit("payment.signature_invalid", { userId: user.id, target: payment.id, level: "warn" });
    return err(400, "Payment signature could not be verified.");
  }
  await fulfillPayment(payment.id, p.data.razorpay_payment_id, { via: "checkout" });
  return json({ ok: true });
}, { perIp: 20, perUser: 20, windowSeconds: 600 });
