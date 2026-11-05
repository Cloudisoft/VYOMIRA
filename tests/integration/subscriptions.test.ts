import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

// PayU is mocked: these tests cover our lifecycle logic, not PayU's network.
const payu = vi.hoisted(() => ({ txns: [] as { transactionId: string; paymentId: number; status: string; settledAmount: number; mode: string; createdOn: string }[], links: 0 }));
const si = vi.hoisted(() => ({ notices: [] as string[], debitCalls: [] as string[], debitStatus: "captured" as string }));
vi.mock("@/server/billing/payu", () => ({
  createPayuLink: vi.fn(async (i: { invoiceNumber?: string }) => { payu.links++; return { url: "https://u.payu.in/test", invoiceNumber: i.invoiceNumber, totalAmount: 0 }; }),
  payuLinkTransactions: vi.fn(async () => payu.txns),
  payuInvoiceFor: (s: string) => s,
}));
vi.mock("@/server/billing/payu-si", () => ({
  siAutoDebitAvailable: () => true,
  preDebitNotify: vi.fn(async (i: { authpayuid: string }) => { si.notices.push(i.authpayuid); return { ok: true, message: "ok" }; }),
  siTransaction: vi.fn(async (i: { authpayuid: string }) => { si.debitCalls.push(i.authpayuid); return { accepted: true, status: si.debitStatus, payuid: "1", message: "" }; }),
  verifyPayment: vi.fn(async () => ({ status: "pending", mihpayid: null, amount: null })),
}));

import { db } from "@/server/db";
import { startSubscription, confirmSubscription, runRenewals, cancelSubscription } from "@/server/billing/subscription-flow";
import { addMonth } from "@/server/billing/subscriptions";
import { balance } from "@/server/billing/entitlements";

const ids: string[] = [];
async function mkUser() {
  const id = randomUUID();
  ids.push(id);
  return db.user.create({ data: { id, name: "Sub Test", email: `${id}@test.local` } });
}
beforeEach(() => { payu.txns = []; si.notices = []; si.debitCalls = []; si.debitStatus = "captured"; });
// runRenewals processes every due subscription in the shared test DB, so count calls per mandate.
const notices = (m: string) => si.notices.filter((x) => x === m).length;
const debits = (m: string) => si.debitCalls.filter((x) => x === m).length;
afterAll(async () => { await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); });

describe("addMonth", () => {
  it("clamps month ends", () => {
    expect(addMonth(new Date("2027-01-31T10:00:00Z")).toISOString()).toBe("2027-02-28T10:00:00.000Z");
    expect(addMonth(new Date("2028-01-31T10:00:00Z")).toISOString()).toBe("2028-02-29T10:00:00.000Z");
    expect(addMonth(new Date("2027-03-15T00:00:00Z")).toISOString()).toBe("2027-04-15T00:00:00.000Z");
  });
});

describe("monthly subscription lifecycle (autopay)", () => {
  it("activates only after PayU confirms the first payment, with the right allowance", async () => {
    const u = await mkUser();
    const { subscriptionId } = await startSubscription(u, "cosmic_plus_monthly");
    expect((await confirmSubscription(subscriptionId)).status).toBe("PENDING");
    expect((await balance(u.id)).aiMessages).toBe(0);
    payu.txns = [{ transactionId: "T1", paymentId: 99887766, status: "success", settledAmount: 649, mode: "UPI", createdOn: "" }];
    expect((await confirmSubscription(subscriptionId)).status).toBe("ACTIVE");
    expect((await confirmSubscription(subscriptionId)).status).toBe("ACTIVE"); // idempotent
    const b = await balance(u.id);
    expect(b.aiMessages).toBe(120);
    expect(b.detailedReports).toBe(true);
    const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    expect(sub.mandateRef).toBe("99887766");
    expect(sub.amountMinor).toBe(64900);
  });

  it("rejects a second concurrent plan and amount mismatches", async () => {
    const u = await mkUser();
    const { subscriptionId } = await startSubscription(u, "explorer_monthly");
    payu.txns = [{ transactionId: "T2", paymentId: 1, status: "success", settledAmount: 1, mode: "UPI", createdOn: "" }];
    expect((await confirmSubscription(subscriptionId)).status).toBe("mismatch");
    payu.txns = [{ transactionId: "T2", paymentId: 1, status: "success", settledAmount: 349, mode: "UPI", createdOn: "" }];
    await confirmSubscription(subscriptionId);
    await expect(startSubscription(u, "cosmic_plus_monthly")).rejects.toThrow(/already have/);
  });

  it("sends a pre-debit notice 48–72 h ahead, debits only ≥ 48 h later, then renews", async () => {
    const u = await mkUser();
    const { subscriptionId } = await startSubscription(u, "explorer_monthly");
    payu.txns = [{ transactionId: "T3", paymentId: 555, status: "success", settledAmount: 349, mode: "UPI", createdOn: "" }];
    await confirmSubscription(subscriptionId);
    const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    const due = sub.nextChargeAt!;

    await runRenewals(new Date(due.getTime() - 5 * 86400000)); // too early
    expect(notices("555")).toBe(0);
    await runRenewals(new Date(due.getTime() - 60 * 3600000)); // 60 h before → notify
    expect(notices("555")).toBe(1);
    await runRenewals(new Date(due.getTime() - 50 * 3600000)); // second run must not re-notify or debit
    expect(notices("555")).toBe(1);
    expect(debits("555")).toBe(0);
    await runRenewals(new Date(due.getTime() + 3600000)); // due → debit
    expect(debits("555")).toBe(1);
    const after = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    expect(after.currentPeriodStart!.toISOString()).toBe(due.toISOString());
    expect(after.currentPeriodEnd!.toISOString()).toBe(addMonth(due).toISOString());
    const grants = await db.entitlement.count({ where: { userId: u.id, kind: "ai_messages" } });
    expect(grants).toBe(2);
  });

  it("retries failed debits and pauses after the final attempt", async () => {
    const u = await mkUser();
    const { subscriptionId } = await startSubscription(u, "explorer_monthly");
    payu.txns = [{ transactionId: "T4", paymentId: 556, status: "success", settledAmount: 349, mode: "UPI", createdOn: "" }];
    await confirmSubscription(subscriptionId);
    const due = (await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } })).nextChargeAt!;
    si.debitStatus = "failed";
    await runRenewals(new Date(due.getTime() - 60 * 3600000));
    for (let d = 0; d < 3; d++) await runRenewals(new Date(due.getTime() + (d * 24 + 1) * 3600000));
    expect(debits("556")).toBe(3); // one attempt per day, max 3
    expect((await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } })).status).toBe("PAST_DUE");
    await runRenewals(new Date(due.getTime() + 4 * 86400000)); // after the 3-day grace period
    expect(debits("556")).toBe(3); // no further attempts
    expect((await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } })).status).toBe("EXPIRED");
  });

  it("cancellation stops future debits but keeps the paid period", async () => {
    const u = await mkUser();
    const { subscriptionId } = await startSubscription(u, "explorer_monthly");
    payu.txns = [{ transactionId: "T5", paymentId: 557, status: "success", settledAmount: 349, mode: "UPI", createdOn: "" }];
    await confirmSubscription(subscriptionId);
    const due = (await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } })).nextChargeAt!;
    await cancelSubscription(u.id, subscriptionId);
    await runRenewals(new Date(due.getTime() - 60 * 3600000));
    await runRenewals(new Date(due.getTime() + 3600000));
    expect(notices("557")).toBe(0);
    expect(debits("557")).toBe(0);
    expect((await balance(u.id)).aiMessages).toBe(50);
  });
});
