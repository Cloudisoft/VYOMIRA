import { authed, err, json } from "@/server/http";
import { cancelSubscription } from "@/server/billing/subscription-flow";

type Ctx = { params: Promise<{ id: string }> };

export const POST = authed<Ctx>("subscription-cancel", async (_req, { user, params }) => {
  const { id } = await params;
  try {
    await cancelSubscription(user.id, id);
    return json({ ok: true });
  } catch {
    return err(404, "Not found");
  }
}, { perIp: 20, perUser: 10, windowSeconds: 600 });
