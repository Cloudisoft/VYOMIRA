import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import { env } from "../env";
import { audit } from "../audit";
import { sendEmail, emailLayout } from "../email";
import { createPayuLink, payuLinkTransactions } from "./payu";
import { preDebitNotify, siAutoDebitAvailable, siTransaction, verifyPayment } from "./payu-si";
import { activateSubscription, addMonth, cancelSubscriptionLocal, MAX_ATTEMPTS, PRE_DEBIT_LEAD_MS, renewalFailed, renewalSucceeded, subscriptionPlan } from "./subscriptions";

/**
 * PayU monthly subscriptions.
 *  - Autopay mode (merchant key + salt set): the first payment registers a monthly mandate
 *    (UPI Autopay / card SI); renewals are pre-notified 48 h ahead and debited automatically.
 *  - Link mode (OAuth only): each renewal is a fresh single-use payment link emailed 3 days before
 *    the period ends; the plan stays active until the end of the paid period.
 * In both modes nothing is granted until PayU confirms the payment server-to-server.
 */
const LINK_RENEWAL_LEAD_MS = 3 * 86400000;
const GRACE_MS = 3 * 86400000;
const inv = () => `VYS${Date.now().toString(36)}${randomUUID().replace(/-/g, "").slice(0, 8)}`.toUpperCase().slice(0, 25);

export const subscriptionMode = () => (siAutoDebitAvailable() ? "autopay" : "link");

export async function startSubscription(user: { id: string; name: string; email: string }, planId: string) {
  const plan = await subscriptionPlan(planId);
  if (!plan) throw new Error("Unknown plan");
  const existing = await db.subscription.findFirst({ where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE"] } } });
  if (existing) throw new Error("You already have an active monthly plan. Cancel it before switching.");
  const invoice = inv();
  const sub = await db.subscription.create({
    data: { userId: user.id, planId, provider: "payu", providerSubscriptionId: invoice, status: "PENDING", amountMinor: plan.priceMinor, currency: "INR" },
  });
  const now = new Date();
  const link = await createPayuLink({
    paymentId: sub.id,
    invoiceNumber: invoice,
    amountMinor: plan.priceMinor,
    description: `VYOMIRA ${plan.name} — monthly plan (renews monthly, cancel anytime)`,
    name: user.name,
    email: user.email,
    udf1: `sub:${sub.id}`,
    returnUrl: `${env().NEXT_PUBLIC_APP_URL}/dashboard/billing?sub=${sub.id}`,
    ...(subscriptionMode() === "autopay" ? { si: { billingAmountMinor: plan.priceMinor, startDate: now, endDate: new Date(now.getTime() + 5 * 365 * 86400000) } } : {}),
  });
  await audit("subscription.started", { userId: user.id, target: sub.id, meta: { plan: planId, mode: subscriptionMode() } });
  return { subscriptionId: sub.id, url: link.url };
}

/** Confirm the first payment (and mandate) by reading the link's transactions from PayU. */
export async function confirmSubscription(subscriptionId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return { status: "unknown" as const };
  if (sub.status !== "PENDING") return { status: sub.status };
  const txns = await payuLinkTransactions(sub.providerSubscriptionId);
  const ok = txns.find((t) => t.status?.toLowerCase() === "success");
  if (!ok) return { status: txns.some((t) => t.status?.toLowerCase() === "failure") ? ("FAILED" as const) : ("PENDING" as const) };
  if (Math.round(ok.settledAmount * 100) !== sub.amountMinor) {
    await audit("subscription.amount_mismatch", { userId: sub.userId, target: sub.id, level: "error" });
    return { status: "mismatch" as const };
  }
  // mihpayid of the registration payment = authpayuid for future mandate debits
  await activateSubscription(sub.id, String(ok.paymentId), ok.transactionId, { via: "payu-link", mode: ok.mode });
  return { status: "ACTIVE" as const };
}

export async function cancelSubscription(userId: string, subscriptionId: string) {
  const sub = await db.subscription.findFirst({ where: { id: subscriptionId, userId } });
  if (!sub) throw new Error("Not found");
  if (sub.status === "PENDING") {
    await db.subscription.update({ where: { id: sub.id }, data: { status: "CANCELLED", nextChargeAt: null } });
    return;
  }
  await cancelSubscriptionLocal(sub.id, "user");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user) await sendEmail(user.email, "Your VYOMIRA plan is cancelled", emailLayout("Cancellation confirmed", `<p>No further payments will be taken. You keep access until ${sub.currentPeriodEnd?.toDateString() ?? "the end of your paid period"}.${sub.mandateRef && subscriptionMode() === "autopay" ? " You can also remove the mandate from your UPI app or bank at any time." : ""}</p>`));
}

/** Daily job: pre-debit notices, debits/renewal links, pending reconciliation and expiry. Idempotent. */
export async function runRenewals(now = new Date()) {
  const report = { notified: 0, debited: 0, linksSent: 0, confirmed: 0, failed: 0, expired: 0, errors: 0 };
  const mode = subscriptionMode();

  // 1) Expire plans whose paid period has ended without renewal.
  const ended = await db.subscription.findMany({ where: { status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED"] }, currentPeriodEnd: { lt: new Date(now.getTime() - GRACE_MS) } } });
  for (const s of ended) {
    const paidLater = await db.subscriptionCharge.findFirst({ where: { subscriptionId: s.id, status: "PAID", periodStart: { gte: s.currentPeriodEnd! } } });
    if (paidLater) continue;
    await db.subscription.update({ where: { id: s.id }, data: { status: "EXPIRED", nextChargeAt: null } });
    report.expired++;
  }

  const due = await db.subscription.findMany({ where: { status: "ACTIVE", cancelAtPeriodEnd: false, nextChargeAt: { not: null, lte: new Date(now.getTime() + Math.max(PRE_DEBIT_LEAD_MS, LINK_RENEWAL_LEAD_MS)) } }, include: { user: true } });
  for (const s of due) {
    try {
      const periodStart = s.currentPeriodEnd!;
      const plan = await subscriptionPlan(s.planId);
      if (!plan) continue;
      let charge = await db.subscriptionCharge.findUnique({ where: { subscriptionId_periodStart: { subscriptionId: s.id, periodStart } } });

      if (mode === "autopay" && s.mandateRef) {
        if (!charge) {
          if (s.nextChargeAt!.getTime() - now.getTime() > PRE_DEBIT_LEAD_MS + 24 * 3600000) continue; // notify 48–72 h ahead
          const txnid = inv();
          const r = await preDebitNotify({ authpayuid: s.mandateRef, requestId: txnid, debitDate: periodStart, amountMinor: s.amountMinor, invoiceDisplayNumber: txnid });
          charge = await db.subscriptionCharge.create({ data: { subscriptionId: s.id, periodStart, amountMinor: s.amountMinor, txnid, status: r.ok ? "NOTIFIED" : "FAILED", preDebitAt: now, raw: { preDebit: r.message } } });
          if (r.ok) report.notified++;
          else { await renewalFailed(s.id, periodStart, { preDebit: r.message }, now); report.failed++; }
          continue;
        }
        // Debit only on/after the due date and ≥ 48 h after the notice (RBI).
        if (["NOTIFIED", "RETRY", "PENDING"].includes(charge.status) && s.nextChargeAt! <= now && charge.preDebitAt && now.getTime() - charge.preDebitAt.getTime() >= PRE_DEBIT_LEAD_MS && charge.attempts < MAX_ATTEMPTS) {
          if (charge.status === "PENDING" && charge.attemptedAt) {
            const v = await verifyPayment(charge.txnid);
            if (v.status === "success") { await renewalSucceeded(s.id, periodStart); report.confirmed++; continue; }
            if (v.status === "pending" || v.status === "in progress") continue;
          }
          const r = await siTransaction({ authpayuid: s.mandateRef, txnid: charge.attempts ? `${charge.txnid.slice(0, 22)}R${charge.attempts}` : charge.txnid, amountMinor: s.amountMinor, email: s.user.email, invoiceDisplayNumber: charge.txnid, subscriptionId: s.id });
          await db.subscriptionCharge.update({ where: { id: charge.id }, data: { attempts: { increment: 1 }, attemptedAt: now, status: r.status === "captured" ? "PAID" : r.status === "failed" ? "FAILED" : "PENDING", raw: { debit: r.message, status: r.status } } });
          if (r.status === "captured") { await renewalSucceeded(s.id, periodStart); report.debited++; }
          else if (r.status === "failed") { await renewalFailed(s.id, periodStart, { debit: r.message }, now); report.failed++; }
        }
        continue;
      }

      // Link mode: create one renewal link per period, email it, and reconcile.
      if (!charge) {
        const invoice = inv();
        const link = await createPayuLink({
          paymentId: s.id,
          invoiceNumber: invoice,
          amountMinor: s.amountMinor,
          description: `VYOMIRA ${plan.name} — renewal from ${periodStart.toDateString()}`,
          name: s.user.name,
          email: s.user.email,
          udf1: `sub:${s.id}`,
          udf2: invoice,
          expiresInMinutes: Math.round((LINK_RENEWAL_LEAD_MS + GRACE_MS) / 60000),
          returnUrl: `${env().NEXT_PUBLIC_APP_URL}/dashboard/billing?renew=${s.id}`,
        });
        await db.subscriptionCharge.create({ data: { subscriptionId: s.id, periodStart, amountMinor: s.amountMinor, txnid: invoice, status: "PENDING", preDebitAt: now, raw: { link: link.url } } });
        await sendEmail(s.user.email, `Renew your VYOMIRA ${plan.name}`, emailLayout("Time to renew", `<p>Your plan renews on ${periodStart.toDateString()} for ₹${(s.amountMinor / 100).toFixed(0)}. Renew securely with PayU:</p><p><a style="color:#D8B477" href="${link.url}">Renew my plan</a></p><p>Not renewing? Do nothing — your plan simply ends with the current period.</p>`));
        report.linksSent++;
        continue;
      }
      if (charge.status === "PENDING") {
        const txns = await payuLinkTransactions(charge.txnid);
        const ok = txns.find((t) => t.status?.toLowerCase() === "success");
        if (ok && Math.round(ok.settledAmount * 100) === s.amountMinor) {
          await renewalSucceeded(s.id, periodStart);
          report.confirmed++;
        }
      }
    } catch (e) {
      report.errors++;
      await audit("subscription.renewal_error", { target: s.id, level: "error", meta: { message: e instanceof Error ? e.message.slice(0, 200) : "unknown" } });
    }
  }
  return report;
}

/** Link-mode renewal confirmation when the buyer returns from PayU. */
export async function confirmRenewal(subscriptionId: string) {
  const charge = await db.subscriptionCharge.findFirst({ where: { subscriptionId, status: "PENDING" }, orderBy: { periodStart: "desc" } });
  if (!charge) return { status: "none" as const };
  const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const txns = await payuLinkTransactions(charge.txnid);
  const ok = txns.find((t) => t.status?.toLowerCase() === "success");
  if (ok && Math.round(ok.settledAmount * 100) === sub.amountMinor) {
    await renewalSucceeded(subscriptionId, charge.periodStart);
    return { status: "PAID" as const };
  }
  return { status: "PENDING" as const };
}

export const nextPeriodEnd = addMonth;
