import { z } from "zod";
import { authed, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { CONSENT_VERSION, hasConsent } from "@/server/consent";
import { audit } from "@/server/audit";

export const GET = authed("consent-get", async (_req, { user }) => json({ aiProcessing: await hasConsent(user.id, "ai_processing"), marketing: await hasConsent(user.id, "marketing") }));

export const POST = authed("consent-set", async (req, { user }) => {
  const p = await parseBody(req, z.object({ kind: z.enum(["ai_processing", "marketing"]), granted: z.boolean() }));
  if (!p.ok) return p.res;
  await db.consent.create({ data: { userId: user.id, kind: p.data.kind, version: CONSENT_VERSION, granted: p.data.granted } });
  await audit(`consent.${p.data.kind}.${p.data.granted ? "granted" : "revoked"}`, { userId: user.id });
  return json({ ok: true });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
