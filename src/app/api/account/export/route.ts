import { authed, json } from "@/server/http";
import { db } from "@/server/db";
import { decryptJson } from "@/server/crypto";
import { audit } from "@/server/audit";

/** Data portability: everything we hold about the signed-in user, decrypted, as JSON. */
export const GET = authed("account-export", async (_req, { user }) => {
  const [u, profiles, conversations, reports, payments, entitlements, consents, usage] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, createdAt: true, locale: true, country: true } }),
    db.birthProfile.findMany({ where: { userId: user.id }, include: { place: true, charts: true } }),
    db.conversation.findMany({ where: { userId: user.id }, include: { messages: true } }),
    db.report.findMany({ where: { userId: user.id } }),
    db.payment.findMany({ where: { userId: user.id }, select: { id: true, provider: true, providerOrderId: true, planId: true, amountMinor: true, currency: true, status: true, createdAt: true } }),
    db.entitlement.findMany({ where: { userId: user.id } }),
    db.consent.findMany({ where: { userId: user.id } }),
    db.usageLedger.findMany({ where: { userId: user.id } }),
  ]);
  await audit("account.exported", { userId: user.id });
  const body = {
    exportedAt: new Date().toISOString(),
    user: u,
    birthProfiles: profiles.map((p) => ({ id: p.id, label: p.label, details: decryptJson(p.encryptedDetails), precision: p.precision, place: p.place, charts: p.charts.map((c) => ({ id: c.id, calculatedAt: c.calculatedAt, computationVersion: c.computationVersionId, chart: decryptJson(c.encryptedPayload) })) })),
    conversations,
    reports,
    payments,
    entitlements,
    consents,
    usage,
  };
  return json(body, { headers: { "Content-Disposition": 'attachment; filename="vyomira-export.json"', "Cache-Control": "no-store" } });
}, { perIp: 5, perUser: 5, windowSeconds: 3600 });
