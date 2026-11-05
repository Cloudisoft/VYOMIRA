import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ rating: z.union([z.literal(1), z.literal(-1)]).optional(), report: z.boolean().optional(), feedback: z.string().trim().max(500).optional() });

export const POST = authed<Ctx>("message-feedback", async (req, { user, params }) => {
  const { id } = await params;
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  const r = await db.message.updateMany({
    where: { id, role: "ASSISTANT", conversation: { userId: user.id } },
    data: { ...(p.data.rating !== undefined ? { rating: p.data.rating } : {}), ...(p.data.report ? { reported: true } : {}), ...(p.data.feedback ? { feedback: p.data.feedback } : {}) },
  });
  if (!r.count) return err(404, "Not found");
  return json({ ok: true });
}, { perIp: 60, perUser: 60, windowSeconds: 600 });
