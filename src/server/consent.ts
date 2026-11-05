import "server-only";
import { db } from "./db";

export const CONSENT_VERSION = "2026-11-05";

export async function hasConsent(userId: string, kind: "ai_processing" | "store_birth_data" | "marketing") {
  const c = await db.consent.findFirst({ where: { userId, kind }, orderBy: { createdAt: "desc" } });
  return Boolean(c?.granted && !c.revokedAt);
}
