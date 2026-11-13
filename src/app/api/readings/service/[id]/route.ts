import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { availableCredits, publicReading, readInput } from "@/server/readings/service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authed<Ctx>("service-reading-get", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id }, include: { images: { select: { side: true, width: true, height: true, quality: true, createdAt: true } }, payment: { select: { status: true, amountMinor: true, provider: true } } } });
  if (!r) return err(404, "Not found");
  const credits = await availableCredits(user.id);
  return json({ reading: publicReading(r, readInput(r)), images: r.images, payment: r.payment, hasCredit: (credits[r.productId] ?? 0) > 0 });
});

/** Delete a reading and everything attached to it (photos, results). Payment records are kept for accounting. */
export const DELETE = authed<Ctx>("service-reading-delete", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.deleteMany({ where: { id, userId: user.id } });
  if (!r.count) return err(404, "Not found");
  await audit("reading.deleted", { userId: user.id, target: id });
  return json({ ok: true });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
