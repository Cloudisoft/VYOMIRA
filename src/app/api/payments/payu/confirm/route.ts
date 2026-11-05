import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { confirmPayu } from "@/server/billing/payu-confirm";

/** Called when the buyer returns from PayU. Confirms server-to-server; never trusts the redirect. */
export const POST = authed("payu-confirm", async (req, { user }) => {
  const p = await parseBody(req, z.object({ paymentId: z.string().cuid() }));
  if (!p.ok) return p.res;
  const pay = await db.payment.findFirst({ where: { id: p.data.paymentId, userId: user.id, provider: "payu" } });
  if (!pay) return err(404, "Not found");
  return json(await confirmPayu(pay.id));
}, { perIp: 60, perUser: 60, windowSeconds: 600 });
