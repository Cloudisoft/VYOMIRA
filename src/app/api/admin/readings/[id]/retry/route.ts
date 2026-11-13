import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { generateReading } from "@/server/readings/generate";

type Ctx = { params: Promise<{ id: string }> };

/** Retry a failed generation on the customer's behalf (never charges). */
export const POST = authed<Ctx>("admin-reading-retry", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!r) return err(404, "Not found");
  if (!["FAILED", "GENERATING", "PAID"].includes(r.status)) return err(409, `Reading is ${r.status}`);
  const out = await generateReading(id, r.userId);
  await audit("admin.reading_retry", { userId: user.id, target: id, meta: { status: out.status } });
  return json(out);
}, { perIp: 30, perUser: 30, windowSeconds: 600 }, { admin: true });
