import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { encryptJson } from "@/server/crypto";
import { processPalmImage } from "@/server/readings/palm-image";
import { palmPrecheck } from "@/server/readings/palm-precheck";

type Ctx = { params: Promise<{ id: string }> };

/** Upload one palm photo (multipart: file, side). Validated, stripped of metadata, encrypted at rest. */
export const POST = authed<Ctx>("palm-upload", async (req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id, category: "palmistry" } });
  if (!r) return err(404, "Not found");
  if (r.status === "GENERATING" || r.status === "READY") return err(409, "This reading is already complete. Start a new reading to use different photos.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const side = String(form?.get("side") ?? "");
  if (!(file instanceof File) || !["left", "right"].includes(side)) return err(422, "Please choose a photo and which hand it shows.");
  const out = await processPalmImage(Buffer.from(await file.arrayBuffer()));
  if (!out.ok) return err(422, out.error);
  const b64 = out.jpeg.toString("base64");
  // Before payment: reject photos that clearly aren't a readable palm, with a reason in the user's language.
  const pre = await palmPrecheck(user.id, id, b64, side, r.language);
  if (pre && !pre.ok) return err(422, pre.problem || "We couldn't see your palm lines clearly. Please retake the photo in good light, palm flat and filling the frame.");
  const data = encryptJson(b64);
  await db.palmImage.upsert({ where: { readingId_side: { readingId: id, side } }, create: { readingId: id, side, mime: "image/jpeg", width: out.width, height: out.height, data, quality: out.quality as never }, update: { mime: "image/jpeg", width: out.width, height: out.height, data, quality: out.quality as never, createdAt: new Date() } });
  await audit("palm.uploaded", { userId: user.id, target: id, meta: { side } });
  return json({ ok: true, side, width: out.width, height: out.height, quality: out.quality });
}, { perIp: 30, perUser: 20, windowSeconds: 600 });

/** Delete palm photos (all, or ?side=left|right). The written report, if any, is kept. */
export const DELETE = authed<Ctx>("palm-delete", async (req, { user, params }) => {
  const { id } = await params;
  const side = new URL(req.url).searchParams.get("side");
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id, category: "palmistry" } });
  if (!r) return err(404, "Not found");
  const d = await db.palmImage.deleteMany({ where: { readingId: id, ...(side ? { side } : {}) } });
  await audit("palm.deleted", { userId: user.id, target: id, meta: { count: d.count } });
  return json({ ok: true, deleted: d.count });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
