import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { generateReading } from "@/server/readings/generate";

type Ctx = { params: Promise<{ id: string }> };

/** Generate (or retry) a paid reading. Never charges; payment status is checked server-side. */
export const POST = authed<Ctx>("reading-generate", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id }, select: { status: true } });
  if (!r) return err(404, "Not found");
  if (r.status === "AWAITING_PAYMENT") return err(402, "Please complete payment first.");
  if (r.status === "READY") return json({ ok: true, status: "READY" });
  const out = await generateReading(id, user.id);
  if (out.status === "LIMIT") return err(429, out.error!);
  return json(out);
}, { perIp: 20, perUser: 12, windowSeconds: 600 });
