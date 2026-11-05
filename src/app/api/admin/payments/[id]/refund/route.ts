import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { applyRefund } from "@/server/billing/fulfill";
import { audit } from "@/server/audit";

type Ctx = { params: Promise<{ id: string }> };

/** Records a refund issued in the PayU (or other provider) dashboard and revokes unused units. */
export const POST = authed<Ctx>("admin-refund", async (req, { user, params }) => {
  const { id } = await params;
  const p = await parseBody(req, z.object({ amountMinor: z.number().int().positive(), reference: z.string().trim().min(3).max(80) }));
  if (!p.ok) return p.res;
  const pay = await db.payment.findUnique({ where: { id } });
  if (!pay) return err(404, "Not found");
  if (!["PAID", "PARTIALLY_REFUNDED"].includes(pay.status)) return err(409, `Payment is ${pay.status}`);
  if (pay.refundedMinor + p.data.amountMinor > pay.amountMinor) return err(422, "Refund exceeds amount paid");
  await applyRefund(pay.id, pay.refundedMinor + p.data.amountMinor, { via: "admin", by: user.id, reference: p.data.reference });
  await audit("admin.refund_recorded", { userId: user.id, target: pay.id, meta: { amountMinor: p.data.amountMinor, reference: p.data.reference } });
  return json({ ok: true });
}, { perIp: 30, perUser: 30, windowSeconds: 600 }, { admin: true });
