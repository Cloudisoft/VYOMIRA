import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { saveChart, loadChart } from "@/server/charts";
import { consume, balance } from "@/server/billing/entitlements";
import { fulfillPayment, applyRefund } from "@/server/billing/fulfill";
import { encryptJson, decryptJson, hmacSha256Hex } from "@/server/crypto";
import { verifyWebhookSignature } from "@/server/billing/razorpay";
import { searchPlaces } from "@/server/places";

const ids: string[] = [];
async function mkUser() {
  const id = randomUUID();
  ids.push(id);
  await db.user.create({ data: { id, name: "Test", email: `${id}@test.local` } });
  return id;
}
const delhi = () => searchPlaces("New Delhi")[0];

beforeAll(async () => { await db.$connect(); });
afterAll(async () => { await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); });

describe("encryption", () => {
  it("round-trips and produces non-deterministic ciphertext", () => {
    const a = encryptJson({ d: "1990-01-01" });
    expect(a).not.toContain("1990");
    expect(encryptJson({ d: "1990-01-01" })).not.toBe(a);
    expect(decryptJson(a)).toEqual({ d: "1990-01-01" });
  });
});

describe("data isolation", () => {
  it("a user cannot load another user's chart by id", async () => {
    const a = await mkUser();
    const b = await mkUser();
    const saved = await saveChart(a, { fullName: "Alpha", date: "1990-08-15", time: "10:30", precision: "exact", placeId: delhi().id, language: "en" });
    expect((await loadChart(a, saved.chartId))?.chartId).toBe(saved.chartId);
    expect(await loadChart(b, saved.chartId)).toBeNull();
    expect(await loadChart(b)).toBeNull();
    const row = await db.birthProfile.findFirst({ where: { userId: a } });
    expect(row?.encryptedDetails).not.toContain("Alpha");
    expect(await db.planetaryPlacement.count({ where: { chartSnapshotId: saved.chartId } })).toBe(27);
  });
});

describe("billing", () => {
  it("concurrent consumption never overspends", async () => {
    const u = await mkUser();
    await db.entitlement.create({ data: { userId: u, kind: "ai_messages", quantity: 3, remaining: 3, source: "admin" } });
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => consume(u, "ai_messages", `t${i}`)));
    expect(results.filter(Boolean)).toHaveLength(3);
    expect((await balance(u)).aiMessages).toBe(0);
  });
  it("fulfilment is idempotent and refunds revoke unused units", async () => {
    const u = await mkUser();
    const p = await db.payment.create({ data: { userId: u, provider: "test", providerOrderId: `test_${randomUUID()}`, planId: "cosmic_plus", amountMinor: 59900, currency: "INR", idempotencyKey: randomUUID() } });
    await Promise.all([fulfillPayment(p.id, "pay_1"), fulfillPayment(p.id, "pay_1"), fulfillPayment(p.id, "pay_1")]).catch(() => undefined);
    await fulfillPayment(p.id, "pay_1");
    expect(await db.entitlement.count({ where: { paymentId: p.id } })).toBe(2);
    expect((await balance(u)).aiMessages).toBe(25);
    expect((await balance(u)).detailedReports).toBe(true);
    await applyRefund(p.id, 59900);
    expect((await balance(u)).aiMessages).toBe(0);
    expect((await db.payment.findUnique({ where: { id: p.id } }))?.status).toBe("REFUNDED");
  });
  it("verifies Razorpay webhook signatures", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, hmacSha256Hex("whsec_test", body))).toBe(true);
    expect(verifyWebhookSignature(body, hmacSha256Hex("wrong", body))).toBe(false);
    expect(verifyWebhookSignature(body + " ", hmacSha256Hex("whsec_test", body))).toBe(false);
  });
});

describe("places", () => {
  it("finds cities with IANA zones", () => {
    const r = searchPlaces("Varanasi");
    expect(r[0].tz).toBe("Asia/Kolkata");
    expect(searchPlaces("London, United Kingdom")[0].tz).toBe("Europe/London");
  });
});
