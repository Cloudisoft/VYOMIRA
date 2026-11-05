import "server-only";
import { db } from "../db";

export async function balance(userId: string) {
  const ents = await db.entitlement.findMany({ where: { userId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
  const aiMessages = ents.filter((e) => e.kind === "ai_messages").reduce((s, e) => s + e.remaining, 0);
  const detailedReports = ents.some((e) => e.kind === "detailed_reports" && e.remaining > 0);
  return { aiMessages, detailedReports };
}

/**
 * Atomically consume one unit of `kind`. Uses a conditional decrement so concurrent requests
 * can never drive a balance negative. Returns the entitlement id consumed, or null.
 */
export async function consume(userId: string, kind: "ai_messages", refId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = await db.entitlement.findFirst({
      where: { userId, kind, remaining: { gt: 0 }, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
    });
    if (!candidate) return null;
    const res = await db.$transaction(async (tx) => {
      const upd = await tx.entitlement.updateMany({ where: { id: candidate.id, remaining: { gt: 0 } }, data: { remaining: { decrement: 1 } } });
      if (upd.count !== 1) return null;
      await tx.usageLedger.create({ data: { userId, kind: "ai_message", delta: -1, entitlementId: candidate.id, refId } });
      return candidate.id;
    });
    if (res) return res;
  }
  return null;
}

/** Return a unit after a failed generation so users are never charged for errors. */
export async function refundUnit(userId: string, entitlementId: string, refId: string) {
  await db.$transaction([
    db.entitlement.update({ where: { id: entitlementId }, data: { remaining: { increment: 1 } } }),
    db.usageLedger.create({ data: { userId, kind: "ai_message", delta: 1, entitlementId, refId: `refund:${refId}` } }),
  ]);
}

export async function recordTokenUsage(userId: string, model: string, tokensIn: number, tokensOut: number, costMicros: number, refId: string) {
  await db.usageLedger.create({ data: { userId, kind: "llm_tokens", delta: 0, model, tokensIn, tokensOut, costMicros, refId } });
}
