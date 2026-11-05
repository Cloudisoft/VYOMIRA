import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { confirmRenewal, confirmSubscription } from "@/server/billing/subscription-flow";

/** Called when the buyer returns from PayU; confirms server-to-server. */
export const POST = authed("subscription-confirm", async (req, { user }) => {
  const p = await parseBody(req, z.object({ subscriptionId: z.string().cuid(), kind: z.enum(["start", "renew"]) }));
  if (!p.ok) return p.res;
  const sub = await db.subscription.findFirst({ where: { id: p.data.subscriptionId, userId: user.id } });
  if (!sub) return err(404, "Not found");
  return json(p.data.kind === "start" ? await confirmSubscription(sub.id) : await confirmRenewal(sub.id));
}, { perIp: 60, perUser: 60, windowSeconds: 600 });
