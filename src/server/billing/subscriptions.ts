import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { getConfig } from "../config";
import { sendEmail, emailLayout } from "../email";
import type { SubscriptionPlanDef } from "@/lib/pricing";

/**
 * Monthly subscriptions (provider-independent core).
 *
 * Lifecycle: PENDING (mandate registration started) → ACTIVE (first payment + mandate confirmed)
 * → each period: pre-debit notice ≥ 24 h before the due date (RBI e-mandate rule; we send it 48 h ahead),
 * debit on the due date, retry up to 3 times (daily) → PAST_DUE after the final failure → EXPIRED.
 * Cancellation stops future debits immediately and keeps access until the paid period ends.
 */
export const PRE_DEBIT_LEAD_MS = 48 * 3600 * 1000;
export const MAX_ATTEMPTS = 3;

export const addMonth = (d: Date) => {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCMonth(r.getUTCMonth() + 1);
  if (r.getUTCDate() < day) r.setUTCDate(0); // clamp 31 Jan → 28/29 Feb
  return r;
};

export async function subscriptionPlan(planId: string): Promise<SubscriptionPlanDef | null> {
  const pricing = await getConfig("pricing");
  return pricing.subscriptions?.find((p) => p.id === planId) ?? null;
}

/** Grant one period's allowance. Unused messages from a previous period expire with it (they are not rolled over). */
export async function grantPeriod(subscriptionId: string, periodStart: Date, periodEnd: Date) {
  const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const plan = await subscriptionPlan(sub.planId);
  if (!plan) throw new Error(`unknown subscription plan ${sub.planId}`);
  const source = `subscription:${sub.id}:${periodStart.toISOString().slice(0, 10)}`;
  const exists = await db.entitlement.findFirst({ where: { userId: sub.userId, source, kind: "ai_messages" } });
  if (exists) return; // idempotent per period
  await db.entitlement.create({ data: { userId: sub.userId, kind: "ai_messages", quantity: plan.aiMessagesPerMonth, remaining: plan.aiMessagesPerMonth, source, expiresAt: periodEnd } });
  if (plan.detailedReports) await db.entitlement.create({ data: { userId: sub.userId, kind: "detailed_reports", quantity: 1, remaining: 1, source, expiresAt: periodEnd } });
}

/** First successful payment + mandate registration confirmed. */
export async function activateSubscription(subscriptionId: string, mandateRef: string, firstTxnid: string, raw?: unknown) {
  const now = new Date();
  const end = addMonth(now);
  const upd = await db.subscription.updateMany({
    where: { id: subscriptionId, status: "PENDING" },
    data: { status: "ACTIVE", mandateRef, currentPeriodStart: now, currentPeriodEnd: end, nextChargeAt: end, failedAttempts: 0 },
  });
  if (upd.count === 0) return false;
  const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId }, include: { user: true } });
  await db.subscriptionCharge.create({ data: { subscriptionId, periodStart: now, amountMinor: sub.amountMinor, txnid: firstTxnid, status: "PAID", attemptedAt: now, attempts: 1, raw: (raw ?? undefined) as never } });
  await grantPeriod(subscriptionId, now, end);
  await audit("subscription.activated", { userId: sub.userId, target: sub.id, meta: { plan: sub.planId } });
  const plan = await subscriptionPlan(sub.planId);
  await sendEmail(sub.user.email, "Your VYOMIRA subscription is active", emailLayout("Welcome to " + (plan?.name ?? "your plan"), `<p>Your monthly plan is active until ${end.toDateString()}. It renews automatically for ₹${(sub.amountMinor / 100).toFixed(0)}/month; we'll notify you before every charge. You can cancel anytime from Billing.</p>`));
  return true;
}

/** Renewal debit succeeded for the period starting at `periodStart`. */
export async function renewalSucceeded(subscriptionId: string, periodStart: Date) {
  const end = addMonth(periodStart);
  await db.$transaction([
    db.subscription.update({ where: { id: subscriptionId }, data: { status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: end, nextChargeAt: end, failedAttempts: 0 } }),
    db.subscriptionCharge.update({ where: { subscriptionId_periodStart: { subscriptionId, periodStart } }, data: { status: "PAID" } }),
  ]);
  await grantPeriod(subscriptionId, periodStart, end);
  await audit("subscription.renewed", { target: subscriptionId });
}

export async function renewalFailed(subscriptionId: string, periodStart: Date, raw?: unknown, now = new Date()) {
  const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId }, include: { user: true } });
  const attempts = sub.failedAttempts + 1;
  const giveUp = attempts >= MAX_ATTEMPTS;
  await db.$transaction([
    db.subscription.update({ where: { id: subscriptionId }, data: { failedAttempts: attempts, status: giveUp ? "PAST_DUE" : "ACTIVE", nextChargeAt: giveUp ? null : new Date(now.getTime() + 24 * 3600 * 1000) } }),
    db.subscriptionCharge.update({ where: { subscriptionId_periodStart: { subscriptionId, periodStart } }, data: { status: giveUp ? "FAILED" : "RETRY", raw: (raw ?? undefined) as never } }),
  ]);
  await audit("subscription.renewal_failed", { userId: sub.userId, target: subscriptionId, level: "warn", meta: { attempts } });
  await sendEmail(sub.user.email, "We couldn't renew your VYOMIRA plan", emailLayout("Renewal payment failed", giveUp ? "<p>We tried several times but couldn't collect this month's payment, so your plan has paused. Your saved chart and readings are safe. You can resubscribe anytime from Billing.</p>" : "<p>This month's automatic payment didn't go through. We'll retry tomorrow — please make sure your UPI Autopay / card mandate is active.</p>"));
}

export async function cancelSubscriptionLocal(subscriptionId: string, by: "user" | "provider" | "admin") {
  const sub = await db.subscription.update({ where: { id: subscriptionId }, data: { status: "CANCELLED", cancelAtPeriodEnd: true, nextChargeAt: null } });
  await audit("subscription.cancelled", { userId: sub.userId, target: sub.id, meta: { by } });
  return sub;
}

export async function activeSubscription(userId: string) {
  return db.subscription.findFirst({ where: { userId, status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED"] }, currentPeriodEnd: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
}
