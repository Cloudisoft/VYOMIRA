import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { getConfig } from "../config";
import { sendEmail, emailLayout } from "../email";

/**
 * Idempotent fulfilment. Safe to call from the checkout callback AND the webhook, in any order,
 * any number of times: the status transition is conditional and entitlements are unique per
 * (paymentId, kind).
 */
export async function fulfillPayment(paymentId: string, providerPaymentId: string | null, raw?: unknown) {
  const pricing = await getConfig("pricing");
  const result = await db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new Error("payment not found");
    if (p.status === "REFUNDED") return { already: true, payment: p };
    const upd = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ["CREATED", "FAILED"] } },
      data: { status: "PAID", providerPaymentId: providerPaymentId ?? p.providerPaymentId, raw: (raw ?? p.raw ?? undefined) as never },
    });
    if (upd.count === 0) return { already: true, payment: p };
    const product = (pricing.readings ?? []).find((x) => x.id === p.planId);
    if (product) {
      // One-time reading product. Bundles grant one credit per included product.
      if (product.category === "bundle") {
        for (const g of product.grants ?? []) {
          await tx.entitlement.upsert({ where: { paymentId_kind: { paymentId, kind: `credit:${g}` } }, create: { userId: p.userId, kind: `credit:${g}`, quantity: 1, remaining: 1, source: "payment", paymentId }, update: {} });
        }
        await tx.entitlement.upsert({ where: { paymentId_kind: { paymentId, kind: "combined_insights" } }, create: { userId: p.userId, kind: "combined_insights", quantity: 1, remaining: 1, source: "payment", paymentId }, update: {} });
        return { already: false, payment: p, plan: { name: product.name } };
      }
      const unlocked = await tx.serviceReading.updateMany({ where: { paymentId, userId: p.userId, status: "AWAITING_PAYMENT" }, data: { status: "PAID", paidAt: new Date() } });
      if (unlocked.count === 0) {
        // The reading was already unlocked by another payment (e.g. two checkout tabs both paid).
        // Never lose the customer's money: convert this payment into a credit for the same product.
        await tx.entitlement.upsert({ where: { paymentId_kind: { paymentId, kind: `credit:${product.id}` } }, create: { userId: p.userId, kind: `credit:${product.id}`, quantity: 1, remaining: 1, source: "payment", paymentId }, update: {} });
        return { already: false, payment: p, plan: { name: product.name }, duplicate: true };
      }
      await tx.entitlement.upsert({ where: { paymentId_kind: { paymentId, kind: `reading:${product.id}` } }, create: { userId: p.userId, kind: `reading:${product.id}`, quantity: 1, remaining: 0, source: "payment", paymentId }, update: {} });
      return { already: false, payment: p, plan: { name: product.name } };
    }
    const plan = pricing.plans.find((x) => x.id === p.planId);
    if (!plan) throw new Error(`unknown plan ${p.planId}`);
    await tx.entitlement.upsert({
      where: { paymentId_kind: { paymentId, kind: "ai_messages" } },
      create: { userId: p.userId, kind: "ai_messages", quantity: plan.aiMessages, remaining: plan.aiMessages, source: "payment", paymentId },
      update: {},
    });
    if (plan.detailedReports) {
      await tx.entitlement.upsert({
        where: { paymentId_kind: { paymentId, kind: "detailed_reports" } },
        create: { userId: p.userId, kind: "detailed_reports", quantity: 1, remaining: 1, source: "payment", paymentId },
        update: {},
      });
    }
    return { already: false, payment: p, plan };
  });
  if (!result.already) {
    await audit("payment.fulfilled", { userId: result.payment.userId, target: paymentId, meta: { plan: result.payment.planId, provider: result.payment.provider } });
    if ("duplicate" in result && result.duplicate) await audit("payment.duplicate_converted_to_credit", { userId: result.payment.userId, target: paymentId, level: "warn", meta: { product: result.payment.planId } });
    const user = await db.user.findUnique({ where: { id: result.payment.userId } });
    if (user) await sendEmail(user.email, "Your VYOMIRA purchase", emailLayout("Payment received", `<p>Thank you. ${result.plan?.name} is now active in your account.</p><p>Order reference: ${result.payment.providerOrderId}</p>`));
  }
  return result;
}

export async function markFailed(paymentId: string, raw?: unknown) {
  await db.payment.updateMany({ where: { id: paymentId, status: "CREATED" }, data: { status: "FAILED", raw: raw as never } });
}

/** Refund handling: mark payment and revoke unused units from that purchase. */
export async function applyRefund(paymentId: string, refundedMinor: number, raw?: unknown) {
  await db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) return;
    const full = refundedMinor >= p.amountMinor;
    await tx.payment.update({ where: { id: paymentId }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", refundedMinor, raw: raw as never } });
    if (full) await tx.entitlement.updateMany({ where: { paymentId }, data: { remaining: 0, revokedAt: new Date() } });
  });
  await audit("payment.refunded", { target: paymentId, meta: { refundedMinor } });
}
