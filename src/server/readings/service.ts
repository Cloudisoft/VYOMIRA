import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { db } from "../db";
import { env, features } from "../env";
import { getConfig } from "../config";
import { audit } from "../audit";
import { decryptJson, encryptJson } from "../crypto";
import { createPayuLink } from "../billing/payu";
import { chargePrice, type ReadingProduct } from "@/lib/pricing";
import { shuffleDeck, SPREADS, TAROT_CATEGORY_LABEL, type SpreadId } from "@/lib/readings/tarot";
import { INPUT_SCHEMA, type ReadingInput, type TarotInput } from "./inputs";

export type ReadingStatus = "AWAITING_PAYMENT" | "PAID" | "GENERATING" | "READY" | "FAILED" | "NEEDS_PHOTO";
export type Category = "numerology" | "tarot" | "palmistry";

export async function products() {
  return (await getConfig("pricing")).readings ?? [];
}

export async function productById(id: string): Promise<ReadingProduct | null> {
  return (await products()).find((p) => p.id === id) ?? null;
}

/** Is the category open for this user? Admins may always use it (to test before release). */
export async function categoryOpen(category: Category, isAdmin: boolean) {
  const flags = await getConfig("flags");
  return isAdmin || flags[category] !== false;
}

export function readInput<T extends ReadingInput>(r: { encryptedInput: string }): T {
  return decryptJson<T>(r.encryptedInput);
}

function titleFor(product: ReadingProduct, input: ReadingInput) {
  if (product.category === "tarot") {
    const t = input as TarotInput;
    return `${SPREADS[product.tier as SpreadId].name} — ${TAROT_CATEGORY_LABEL[t.category]}`;
  }
  return product.name;
}

export async function createReading(user: { id: string; role: string }, productId: string, rawInput: unknown, language: string) {
  const product = await productById(productId);
  if (!product || !product.active || product.category === "bundle") return { error: "This reading isn't available right now.", status: 404 } as const;
  const category = product.category as Category;
  if (!(await categoryOpen(category, user.role === "ADMIN"))) return { error: "This reading isn't open yet.", status: 403 } as const;
  const parsed = INPUT_SCHEMA[category].safeParse(rawInput);
  if (!parsed.success) return { error: "Please check the details you entered.", status: 422, issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } as const;
  if (category === "numerology") {
    const { parseDob } = await import("@/lib/readings/numerology");
    try {
      const d = parseDob((parsed.data as { dob: string }).dob);
      if (d.year < 1900 || new Date(Date.UTC(d.year, d.month - 1, d.day)) > new Date()) throw new Error();
    } catch { return { error: "Please enter a valid date of birth.", status: 422 } as const; }
  }
  const reading = await db.serviceReading.create({
    data: {
      userId: user.id,
      category,
      productId: product.id,
      tier: product.tier,
      title: titleFor(product, parsed.data),
      status: "AWAITING_PAYMENT",
      encryptedInput: encryptJson(parsed.data),
      language: ["en", "hi", "hinglish"].includes(language) ? language : "en",
      // Tarot: the deck is shuffled once, server-side, with a CSPRNG. It is never sent to the browser.
      draw: category === "tarot" ? ({ deck: shuffleDeck(randomInt), picks: null } as never) : undefined,
    },
  });
  await audit("reading.created", { userId: user.id, target: reading.id, meta: { product: product.id } });
  return { reading } as const;
}

/** Unlock with a prepaid credit (from a bundle, or a converted duplicate payment) if one exists. */
export async function unlockWithCredit(userId: string, readingId: string) {
  const r = await db.serviceReading.findFirst({ where: { id: readingId, userId } });
  if (!r || r.status !== "AWAITING_PAYMENT") return false;
  return db.$transaction(async (tx) => {
    const credit = await tx.entitlement.findFirst({ where: { userId, kind: `credit:${r.productId}`, remaining: { gt: 0 }, revokedAt: null }, orderBy: { createdAt: "asc" } });
    if (!credit) return false;
    const used = await tx.entitlement.updateMany({ where: { id: credit.id, remaining: { gt: 0 } }, data: { remaining: { decrement: 1 } } });
    if (used.count !== 1) return false;
    const upd = await tx.serviceReading.updateMany({ where: { id: r.id, status: "AWAITING_PAYMENT" }, data: { status: "PAID", paidAt: new Date(), creditId: credit.id } });
    if (upd.count !== 1) throw new Error("reading already unlocked"); // rolls back the credit use
    await tx.usageLedger.create({ data: { userId, kind: "reading_credit", delta: -1, entitlementId: credit.id, refId: r.id } });
    return true;
  });
}

export async function availableCredits(userId: string) {
  const ents = await db.entitlement.findMany({ where: { userId, kind: { startsWith: "credit:" }, remaining: { gt: 0 }, revokedAt: null } });
  const m: Record<string, number> = {};
  for (const e of ents) m[e.kind.slice(7)] = (m[e.kind.slice(7)] ?? 0) + e.remaining;
  return m;
}

/**
 * Start a one-time payment. The amount always comes from server config; the browser only sends ids.
 * Payment is linked to the reading, and only the provider confirmation (fulfillPayment) unlocks it.
 */
export async function startCheckout(user: { id: string; name: string; email: string }, opts: { readingId?: string; productId?: string }) {
  let product: ReadingProduct | null;
  let readingId: string | null = null;
  if (opts.readingId) {
    const r = await db.serviceReading.findFirst({ where: { id: opts.readingId, userId: user.id } });
    if (!r) return { error: "Not found", status: 404 } as const;
    if (r.status !== "AWAITING_PAYMENT") return { error: "This reading is already paid for.", status: 409 } as const;
    product = await productById(r.productId);
    readingId = r.id;
  } else {
    product = opts.productId ? await productById(opts.productId) : null;
    if (product?.category !== "bundle") return { error: "Unknown product", status: 404 } as const;
  }
  if (!product || !product.active) return { error: "This product isn't available right now.", status: 404 } as const;
  const f = features();
  const provider = f.payu ? "payu" : f.testPayments ? "test" : null;
  if (!provider) return { error: "Payments are not configured yet.", status: 503 } as const;
  const amountMinor = chargePrice(product);
  const idempotencyKey = randomUUID();
  const orderId = provider === "payu" ? `payu_pending_${idempotencyKey}` : `test_order_${idempotencyKey.replace(/-/g, "").slice(0, 18)}`;
  const payment = await db.payment.create({ data: { userId: user.id, provider, providerOrderId: orderId, planId: product.id, amountMinor, currency: "INR", idempotencyKey } });
  if (readingId) await db.serviceReading.update({ where: { id: readingId }, data: { paymentId: payment.id } });
  let checkoutUrl: string | undefined;
  let finalOrderId = orderId;
  if (provider === "payu") {
    const back = readingId ? `/dashboard/readings/${readingId}` : "/dashboard/readings";
    const link = await createPayuLink({ paymentId: payment.id, amountMinor, description: `VYOMIRA ${product.name}`, name: user.name, email: user.email, returnUrl: `${env().NEXT_PUBLIC_APP_URL}${back}?payu=${payment.id}` });
    await db.payment.update({ where: { id: payment.id }, data: { providerOrderId: link.invoiceNumber } });
    checkoutUrl = link.url;
    finalOrderId = link.invoiceNumber;
  }
  await audit("payment.order_created", { userId: user.id, target: payment.id, meta: { provider, product: product.id, kind: "reading" } });
  return { provider, paymentId: payment.id, orderId: finalOrderId, checkoutUrl, amount: amountMinor, currency: "INR", planName: product.name } as const;
}

/** Public, browser-safe view of a reading (no deck order, no encrypted fields, no image data). */
export function publicReading(r: { id: string; category: string; productId: string; tier: string; title: string; status: string; result: unknown; draw: unknown; language: string; createdAt: Date; paidAt: Date | null; generatedAt: Date | null; error: string | null }, input?: ReadingInput) {
  const d = r.draw as { picks?: unknown } | null;
  return {
    id: r.id, category: r.category, productId: r.productId, tier: r.tier, title: r.title, status: r.status, language: r.language,
    createdAt: r.createdAt, paidAt: r.paidAt, generatedAt: r.generatedAt, error: r.error,
    result: r.result, drawn: d?.picks ?? null, input: input ?? null,
  };
}
