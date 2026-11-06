import { z } from "zod";
import { authed, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";

/** Preferred language for the Life Guide, dashboard summary and AURA (stored on the user's birth profiles). */
export const POST = authed("preferences-set", async (req, { user }) => {
  const p = await parseBody(req, z.object({ language: z.enum(["en", "hi", "hinglish"]) }));
  if (!p.ok) return p.res;
  await db.birthProfile.updateMany({ where: { userId: user.id }, data: { language: p.data.language } });
  await audit("preferences.language", { userId: user.id, meta: { language: p.data.language } });
  return json({ ok: true });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
