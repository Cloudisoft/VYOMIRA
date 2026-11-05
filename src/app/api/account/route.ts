import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";

/** Permanent deletion. Cascades remove profiles, charts, conversations, reports, entitlements.
 * Payment rows are deleted with the user too; keep provider-side records for statutory accounting. */
export const DELETE = authed("account-delete", async (req, { user }) => {
  const p = await parseBody(req, z.object({ confirm: z.literal("DELETE") }));
  if (!p.ok) return p.res;
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u) return err(404, "Not found");
  await audit("account.deleted", { meta: { userIdHash: user.id.slice(0, 6) } });
  await db.user.delete({ where: { id: user.id } });
  return json({ ok: true });
}, { perIp: 5, perUser: 3, windowSeconds: 3600 });
