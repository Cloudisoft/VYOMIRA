import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { confirmPayu } from "@/server/billing/payu-confirm";

type Ctx = { params: Promise<{ id: string }> };

/** Re-check a PayU order against PayU's API (idempotent — safe to run any number of times). */
export const POST = authed<Ctx>("admin-reconcile", async (_req, { user, params }) => {
  const { id } = await params;
  const p = await db.payment.findUnique({ where: { id } });
  if (!p) return err(404, "Not found");
  if (p.provider !== "payu") return err(422, "Only PayU orders can be reconciled here.");
  const r = await confirmPayu(id);
  await audit("admin.payment_reconciled", { userId: user.id, target: id, meta: { result: r.status } });
  return json(r);
}, { perIp: 60, perUser: 60, windowSeconds: 600 }, { admin: true });
