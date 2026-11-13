import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { startCheckout, unlockWithCredit } from "@/server/readings/service";

type Ctx = { params: Promise<{ id: string }> };

/** Pay for a reading (or unlock it with a bundle credit). The price is always taken from server config. */
export const POST = authed<Ctx>("service-reading-checkout", async (req, { user, params }) => {
  const { id } = await params;
  const p = await parseBody(req, z.object({ useCredit: z.boolean().default(false) }));
  if (!p.ok) return p.res;
  if (p.data.useCredit) {
    const ok = await unlockWithCredit(user.id, id);
    return ok ? json({ unlocked: true }) : err(409, "No credit available for this reading.");
  }
  const r = await startCheckout(user, { readingId: id });
  if ("error" in r) return err((r as { status: number }).status, r.error!);
  return json(r);
}, { perIp: 20, perUser: 10, windowSeconds: 600 });
