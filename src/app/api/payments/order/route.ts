import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { env, features } from "@/server/env";
import { getConfig } from "@/server/config";
import { detectCountry } from "@/server/country";
import { regionFor } from "@/lib/pricing";
import { createRazorpayOrder } from "@/server/billing/razorpay";
import { createStripeCheckout } from "@/server/billing/stripe";
import { audit } from "@/server/audit";

const schema = z.object({ planId: z.enum(["starter", "cosmic_plus"]) });

export const POST = authed("payment-order", async (req, { user }) => {
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  const pricing = await getConfig("pricing");
  const plan = pricing.plans.find((x) => x.id === p.data.planId);
  if (!plan) return err(404, "Unknown plan");
  const { region } = regionFor(await detectCountry(), pricing);
  const amountMinor = region.prices[plan.id];
  const f = features();
  const flags = await getConfig("flags");

  // Reuse a very recent unpaid order for the same plan/amount (double-click / retry idempotency).
  const recent = await db.payment.findFirst({ where: { userId: user.id, planId: plan.id, status: "CREATED", amountMinor, currency: region.currency, createdAt: { gte: new Date(Date.now() - 20 * 60000) } }, orderBy: { createdAt: "desc" } });

  const useStripe = region.currency !== "INR" && flags.stripe && f.stripe;
  const provider = useStripe ? "stripe" : f.razorpay ? "razorpay" : f.testPayments ? "test" : null;
  if (!provider) return err(503, "Payments are not configured yet.");
  if (recent && recent.provider === provider && provider !== "stripe") {
    return json({ provider, paymentId: recent.id, orderId: recent.providerOrderId, amount: amountMinor, currency: region.currency, keyId: env().RAZORPAY_KEY_ID ?? null, planName: plan.name, email: user.email, name: user.name });
  }
  const idempotencyKey = randomUUID();
  let orderId: string;
  let checkoutUrl: string | undefined;
  if (provider === "razorpay") {
    const o = await createRazorpayOrder({ amountMinor, currency: region.currency, receipt: idempotencyKey.slice(0, 36), notes: { plan: plan.id, uid: user.id } });
    orderId = o.id;
  } else if (provider === "test") {
    orderId = `test_order_${idempotencyKey.replace(/-/g, "").slice(0, 18)}`;
  } else {
    orderId = `stripe_pending_${idempotencyKey}`;
  }
  const payment = await db.payment.create({ data: { userId: user.id, provider, providerOrderId: orderId, planId: plan.id, amountMinor, currency: region.currency, idempotencyKey } });
  if (provider === "stripe") {
    const base = env().NEXT_PUBLIC_APP_URL;
    const s = await createStripeCheckout({ amountMinor, currency: region.currency, name: `VYOMIRA ${plan.name}`, paymentId: payment.id, successUrl: `${base}/dashboard/billing?status=processing`, cancelUrl: `${base}/dashboard/billing?status=cancelled`, email: user.email });
    await db.payment.update({ where: { id: payment.id }, data: { providerOrderId: s.id } });
    orderId = s.id;
    checkoutUrl = s.url;
  }
  await audit("payment.order_created", { userId: user.id, target: payment.id, meta: { provider, plan: plan.id, currency: region.currency } });
  return json({ provider, paymentId: payment.id, orderId, checkoutUrl, amount: amountMinor, currency: region.currency, keyId: env().RAZORPAY_KEY_ID ?? null, planName: plan.name, email: user.email, name: user.name });
}, { perIp: 20, perUser: 10, windowSeconds: 600 });
