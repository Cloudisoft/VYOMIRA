import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { fulfillPayment, markFailed } from "@/server/billing/fulfill";

/**
 * LOCAL TEST MODE ONLY. Simulates the payment provider's success/failure callback for orders
 * created with provider "test". Refused unless PAYMENTS_MODE=test. No money moves.
 */
const schema = z.object({ paymentId: z.string().cuid(), outcome: z.enum(["success", "failure"]) });

export const POST = authed("payment-test", async (req, { user }) => {
  if (env().PAYMENTS_MODE !== "test" || env().APP_ENV === "production") return err(404, "Not found");
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  const payment = await db.payment.findFirst({ where: { id: p.data.paymentId, userId: user.id, provider: "test" } });
  if (!payment) return err(404, "Not found");
  if (p.data.outcome === "failure") {
    await markFailed(payment.id, { test: true });
    return json({ ok: true, status: "FAILED" });
  }
  await fulfillPayment(payment.id, `test_pay_${payment.id}`, { test: true, note: "Simulated in local test mode — no money moved" });
  return json({ ok: true, status: "PAID" });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
