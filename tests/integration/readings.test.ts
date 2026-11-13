import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "@/server/db";
import { fulfillPayment, markFailed } from "@/server/billing/fulfill";
import { availableCredits, createReading, startCheckout, unlockWithCredit } from "@/server/readings/service";
import { generateReading } from "@/server/readings/generate";
import { processPalmImage } from "@/server/readings/palm-image";
import { combinedInsights, userContext } from "@/server/readings/context";
import { resolvePicks } from "@/lib/readings/tarot";
import { assertNoRepetition, type ReportDoc } from "@/lib/readings/report";

const ids: string[] = [];
async function mkUser(role: "USER" | "ADMIN" = "USER") {
  const id = randomUUID();
  ids.push(id);
  await db.user.create({ data: { id, name: "Asha Verma", email: `${id}@test.local`, role } });
  return { id, name: "Asha Verma", email: `${id}@test.local`, role };
}
beforeAll(async () => { await db.$connect(); });
afterAll(async () => {
  await db.serviceReading.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

const numerology = (u: { id: string; role: string }) => createReading(u, "numerology_detailed", { name: "Asha Verma", dob: "1992-04-18", method: "pythagorean" }, "en");

describe("reading purchase flow", () => {
  it("rejects invalid input and unknown/inactive products", async () => {
    const u = await mkUser();
    expect("error" in (await createReading(u, "numerology_detailed", { name: "A", dob: "1992-04-18" }, "en"))).toBe(true);
    expect("error" in (await createReading(u, "numerology_detailed", { name: "Asha", dob: "2999-01-01" }, "en"))).toBe(true);
    expect("error" in (await createReading(u, "no_such_product", {}, "en"))).toBe(true);
    expect("error" in (await createReading(u, "bundle_insight", {}, "en"))).toBe(true);
  });

  it("encrypts inputs; price comes from server config; only provider confirmation unlocks", async () => {
    const u = await mkUser();
    const r = await numerology(u);
    if ("error" in r) throw new Error(r.error);
    expect(r.reading.encryptedInput).not.toContain("Asha");
    expect(r.reading.status).toBe("AWAITING_PAYMENT");
    const co = await startCheckout(u, { readingId: r.reading.id });
    if ("error" in co) throw new Error(co.error);
    expect(co.amount).toBe(14900);
    // Generation refuses until paid
    expect((await db.serviceReading.findUnique({ where: { id: r.reading.id } }))?.status).toBe("AWAITING_PAYMENT");
    await markFailed(co.paymentId);
    expect((await db.serviceReading.findUnique({ where: { id: r.reading.id } }))?.status).toBe("AWAITING_PAYMENT");
    await Promise.all([fulfillPayment(co.paymentId, "pay_x"), fulfillPayment(co.paymentId, "pay_x")]).catch(() => undefined);
    await fulfillPayment(co.paymentId, "pay_x");
    const after = await db.serviceReading.findUnique({ where: { id: r.reading.id } });
    expect(after?.status).toBe("PAID");
    expect(await db.entitlement.count({ where: { paymentId: co.paymentId } })).toBe(1);
    // A paid reading can't be checked out again
    expect("error" in (await startCheckout(u, { readingId: r.reading.id }))).toBe(true);
  });

  it("a second paid order for the same reading becomes a credit (never lost money)", async () => {
    const u = await mkUser();
    const r = await numerology(u);
    if ("error" in r) throw new Error(r.error);
    const a = await startCheckout(u, { readingId: r.reading.id });
    const b = await startCheckout(u, { readingId: r.reading.id });
    if ("error" in a || "error" in b) throw new Error("checkout");
    await fulfillPayment(a.paymentId, "pay_a");
    // b was created before a was confirmed; reading.paymentId now points to b, so link b manually as the "other tab"
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { paymentId: b.paymentId } });
    await fulfillPayment(b.paymentId, "pay_b");
    expect((await availableCredits(u.id)).numerology_detailed).toBe(1);
  });

  it("bundle grants credits that unlock readings exactly once", async () => {
    const u = await mkUser();
    const co = await startCheckout(u, { productId: "bundle_insight" });
    if ("error" in co) throw new Error(co.error);
    expect(co.amount).toBe(24900);
    await fulfillPayment(co.paymentId, "pay_bundle");
    expect(await availableCredits(u.id)).toEqual({ palmistry_detailed: 1, numerology_detailed: 1, tarot_three: 1 });
    const r = await numerology(u);
    if ("error" in r) throw new Error(r.error);
    const results = await Promise.all([unlockWithCredit(u.id, r.reading.id), unlockWithCredit(u.id, r.reading.id)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await availableCredits(u.id)).numerology_detailed).toBeUndefined();
    expect(await db.entitlement.count({ where: { userId: u.id, kind: "combined_insights" } })).toBe(1);
  });

  it("palmistry is admin-only while its flag is off", async () => {
    const u = await mkUser();
    const admin = await mkUser("ADMIN");
    const x = await createReading(u, "palmistry_basic", { dominant: "right", hands: "right" }, "en");
    expect("error" in x && x.status).toBe(403);
    const y = await createReading(admin, "palmistry_basic", { dominant: "right", hands: "right" }, "en");
    expect("reading" in y).toBe(true);
  });

  it("another user can't unlock, check out or generate someone else's reading", async () => {
    const a = await mkUser();
    const b = await mkUser();
    const r = await numerology(a);
    if ("error" in r) throw new Error(r.error);
    expect("error" in (await startCheckout(b, { readingId: r.reading.id }))).toBe(true);
    expect(await unlockWithCredit(b.id, r.reading.id)).toBe(false);
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
    expect((await generateReading(r.reading.id, b.id)).ok).toBe(false);
    expect((await db.serviceReading.findUnique({ where: { id: r.reading.id } }))?.status).toBe("PAID");
  });
});

describe("generation", () => {
  it("numerology generates a non-repetitive report (rules when AI consent is off)", async () => {
    const u = await mkUser();
    const r = await numerology(u);
    if ("error" in r) throw new Error(r.error);
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
    const out = await generateReading(r.reading.id, u.id);
    expect(out).toMatchObject({ ok: true, status: "READY" });
    const row = await db.serviceReading.findUnique({ where: { id: r.reading.id } });
    const doc = (row!.result as unknown as { report: ReportDoc }).report;
    expect(doc.sections.map((s) => s.id)).toEqual(["overview", "core", "personality", "career", "relationships", "strengths", "year", "summary"]);
    expect(() => assertNoRepetition(doc)).not.toThrow();
    // Regenerate on a READY reading is a no-op
    expect((await generateReading(r.reading.id, u.id)).status).toBe("READY");
  });

  it("tarot interprets exactly the recorded cards", async () => {
    const u = await mkUser();
    const r = await createReading(u, "tarot_three", { category: "career", question: "Should I change teams?" }, "en");
    if ("error" in r) throw new Error(r.error);
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
    const noPicks = await generateReading(r.reading.id, u.id);
    expect(noPicks.ok).toBe(false);
    const draw = (await db.serviceReading.findUnique({ where: { id: r.reading.id } }))!.draw as { deck: { id: string; reversed: boolean }[] };
    const picks = resolvePicks(draw.deck, "three", [3, 9, 14]);
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { draw: { ...draw, picks } as never } });
    expect((await generateReading(r.reading.id, u.id)).ok).toBe(true);
    const row = await db.serviceReading.findUnique({ where: { id: r.reading.id } });
    const res = row!.result as unknown as { report: ReportDoc; cards: { cardId: string }[] };
    expect(res.cards.map((c) => c.cardId)).toEqual(picks.map((p) => p.cardId));
    expect(res.report.sections.map((s) => s.id)).toEqual(["overview", "past", "present", "future", "synthesis", "guidance"]);
    const ctx = await userContext(u.id, ["tarot"]);
    expect(ctx.tarot?.[0].cards).toHaveLength(3);
    const ins = combinedInsights(ctx);
    expect(ins.find((a) => a.id === "career")?.points[0].system).toBe("tarot");
  });

  it("generation limit per day is enforced", async () => {
    const u = await mkUser();
    await db.usageLedger.createMany({ data: Array.from({ length: 20 }, () => ({ userId: u.id, kind: "reading_generation", delta: 0 })) });
    const r = await numerology(u);
    if ("error" in r) throw new Error(r.error);
    await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
    expect((await generateReading(r.reading.id, u.id)).status).toBe("LIMIT");
  });
});

describe("palm photo validation", () => {
  it("rejects non-images and tiny images; strips metadata; flags dark/blurry photos", async () => {
    expect((await processPalmImage(Buffer.from("not an image"))).ok).toBe(false);
    const tiny = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#c89070" } }).jpeg().toBuffer();
    expect((await processPalmImage(tiny)).ok).toBe(false);
    const flat = await sharp({ create: { width: 1200, height: 1600, channels: 3, background: "#c89070" } }).withMetadata({ exif: { IFD0: { Copyright: "secret-gps" } } }).jpeg().toBuffer();
    const out = await processPalmImage(flat);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.quality.ok).toBe(false); // featureless
      expect(Math.max(out.width, out.height)).toBeLessThanOrEqual(1568);
      expect((await sharp(out.jpeg).metadata()).exif).toBeUndefined();
    }
  });
});

import { mentionsUndrawnCard, numbersOutsideFacts } from "@/server/readings/generate";
describe("AI output guards", () => {
  it("flags cards that weren't drawn", () => {
    expect(mentionsUndrawnCard("The Tower in your past shows upheaval", ["The Tower"])).toBeNull();
    expect(mentionsUndrawnCard("This echoes The Star and the Three of Cups", ["The Tower"])).toBe("The Star");
    expect(mentionsUndrawnCard("you show real strength here", [])).toBeNull();
  });
  it("flags numbers that aren't in the computed facts", () => {
    const allowed = new Set([5, 8, 6, 11, 2026]);
    expect(numbersOutsideFacts("Life Path 5 and Expression 8 in 2026", allowed)).toEqual([]);
    expect(numbersOutsideFacts("your Destiny number 7", allowed)).toEqual([7]);
  });
});

describe("never ask twice", () => {
  it("re-entering the same numerology details reopens the existing reading (same or higher tier)", async () => {
    const u = await mkUser();
    const a = await createReading(u, "numerology_complete", { name: "Asha  verma", dob: "1992-04-18", method: "pythagorean" }, "en");
    if ("error" in a) throw new Error(a.error);
    // unpaid draft is reused, not duplicated
    const again = await createReading(u, "numerology_complete", { name: "asha verma", dob: "1992-04-18", method: "pythagorean" }, "en");
    expect("reading" in again && again.reading?.id).toBe(a.reading.id);
    await db.serviceReading.update({ where: { id: a.reading.id }, data: { status: "READY" } });
    // a lower tier for the same person opens the complete reading they already own
    const lower = await createReading(u, "numerology_basic", { name: "Asha Verma", dob: "1992-04-18", method: "pythagorean" }, "en");
    expect("reading" in lower && lower.reading?.id).toBe(a.reading.id);
    expect("existing" in lower && lower.existing).toBe(true);
    // different method or date → a genuinely new reading
    const other = await createReading(u, "numerology_basic", { name: "Asha Verma", dob: "1992-04-18", method: "chaldean" }, "en");
    expect("reading" in other && other.reading?.id).not.toBe(a.reading.id);
    expect(await db.serviceReading.count({ where: { userId: u.id } })).toBe(2);
  });
  it("a paid tarot reading is never reused, but an unpaid tarot draft is", async () => {
    const u = await mkUser();
    const a = await createReading(u, "tarot_single", { category: "love", question: "Will we reconnect?" }, "en");
    if ("error" in a) throw new Error(a.error);
    const b = await createReading(u, "tarot_single", { category: "love", question: "Will we reconnect?" }, "en");
    expect("reading" in b && b.reading?.id).toBe(a.reading.id);
    await db.serviceReading.update({ where: { id: a.reading.id }, data: { status: "READY" } });
    const c = await createReading(u, "tarot_single", { category: "love", question: "Will we reconnect?" }, "en");
    expect("reading" in c && c.reading?.id).not.toBe(a.reading.id);
  });
});
