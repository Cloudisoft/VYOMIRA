import { authed, err } from "@/server/http";
import { db } from "@/server/db";
import { decryptJson } from "@/server/crypto";

type Ctx = { params: Promise<{ id: string; side: string }> };

/** Owner-only view of an uploaded palm photo (decrypted on the fly, never cached). */
export const GET = authed<Ctx>("palm-image-view", async (_req, { user, params }) => {
  const { id, side } = await params;
  const img = await db.palmImage.findFirst({ where: { readingId: id, side, reading: { userId: user.id } } });
  if (!img) return err(404, "Not found");
  return new Response(Buffer.from(decryptJson<string>(img.data), "base64"), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}, { perIp: 120, perUser: 120, windowSeconds: 600 });
