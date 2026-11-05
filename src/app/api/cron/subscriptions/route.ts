import { timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";
import { runRenewals } from "@/server/billing/subscription-flow";
import { logError } from "@/server/audit";

export const maxDuration = 300;

/** Daily renewal job. Call with `Authorization: Bearer $CRON_SECRET` (Railway cron service). */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return new Response("unauthorized", { status: 401 });
  try {
    return Response.json(await runRenewals());
  } catch (e) {
    logError("cron-subscriptions", e);
    return new Response("error", { status: 500 });
  }
}
