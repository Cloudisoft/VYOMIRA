import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { features } from "@/server/env";
import { startSubscription, subscriptionMode } from "@/server/billing/subscription-flow";

export const GET = authed("subscriptions", async (_req, { user }) => {
  const subs = await db.subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { charges: { orderBy: { periodStart: "desc" }, take: 6 } } });
  return json({ mode: subscriptionMode(), subscriptions: subs });
});

export const POST = authed("subscription-start", async (req, { user }) => {
  const p = await parseBody(req, z.object({ planId: z.enum(["explorer_monthly", "cosmic_plus_monthly"]) }));
  if (!p.ok) return p.res;
  if (!features().payu) return err(503, "Monthly plans need PayU to be configured.");
  try {
    return json(await startSubscription(user, p.data.planId));
  } catch (e) {
    return err(409, e instanceof Error ? e.message : "Could not start the subscription.");
  }
}, { perIp: 10, perUser: 5, windowSeconds: 600 });
