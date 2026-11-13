import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { CONSENT_VERSION, hasConsent } from "@/server/consent";
import { availableCredits, createReading, publicReading } from "@/server/readings/service";

/** My Readings: list (no inputs/results — those load per reading). */
export const GET = authed("service-readings", async (req, { user }) => {
  const cat = new URL(req.url).searchParams.get("category");
  const rows = await db.serviceReading.findMany({ where: { userId: user.id, ...(cat ? { category: cat } : {}) }, orderBy: { createdAt: "desc" }, take: 200, include: { payment: { select: { status: true, amountMinor: true } } } });
  return json({ readings: rows.map((r) => ({ id: r.id, category: r.category, title: r.title, status: r.status, createdAt: r.createdAt, payment: r.payment?.status ?? (r.creditId ? "CREDIT" : null) })), credits: await availableCredits(user.id) });
});

const schema = z.object({ productId: z.string().min(3).max(40), input: z.record(z.string(), z.unknown()), language: z.enum(["en", "hi", "hinglish"]).default("en"), aiConsent: z.boolean().optional() });

export const POST = authed("service-reading-create", async (req, { user }) => {
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  if (p.data.aiConsent && !(await hasConsent(user.id, "ai_processing"))) {
    await db.consent.create({ data: { userId: user.id, kind: "ai_processing", version: CONSENT_VERSION, granted: true } });
  }
  const r = await createReading(user, p.data.productId, p.data.input, p.data.language);
  if ("error" in r) return err((r as { status: number }).status, r.error!, "issues" in r ? { issues: r.issues } : undefined);
  const credits = await availableCredits(user.id);
  return json({ reading: publicReading(r.reading), existing: "existing" in r && r.existing, hasCredit: (credits[r.reading.productId] ?? 0) > 0 }, "existing" in r && r.existing ? 200 : 201);
}, { perIp: 30, perUser: 20, windowSeconds: 600 });
