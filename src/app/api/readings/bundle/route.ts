import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { startCheckout } from "@/server/readings/service";

export const POST = authed("bundle-checkout", async (req, { user }) => {
  const p = await parseBody(req, z.object({ productId: z.string().min(3).max(40) }));
  if (!p.ok) return p.res;
  const r = await startCheckout(user, { productId: p.data.productId });
  if ("error" in r) return err((r as { status: number }).status, r.error!);
  return json(r);
}, { perIp: 20, perUser: 10, windowSeconds: 600 });
