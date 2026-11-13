import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { resolvePicks, type SpreadId } from "@/lib/readings/tarot";
import { CARD } from "@/lib/readings/tarot";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Record the user's face-down choices. The deck order was fixed (CSPRNG) when the reading was created
 * and is never sent to the browser, so the picks can't be steered. Recorded once; repeats return the same cards.
 */
export const POST = authed<Ctx>("tarot-draw", async (req, { user, params }) => {
  const { id } = await params;
  const p = await parseBody(req, z.object({ picks: z.array(z.number().int().min(0).max(77)).min(1).max(10) }));
  if (!p.ok) return p.res;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id, category: "tarot" } });
  if (!r) return err(404, "Not found");
  if (r.status === "AWAITING_PAYMENT") return err(402, "Please complete payment first.");
  const draw = r.draw as { deck: { id: string; reversed: boolean }[]; picks: ReturnType<typeof resolvePicks> | null };
  if (draw.picks) return json({ cards: draw.picks.map((c) => ({ ...c, name: CARD[c.cardId].name })) });
  let picks;
  try { picks = resolvePicks(draw.deck, r.tier as SpreadId, p.data.picks); } catch (e) { return err(422, (e as Error).message); }
  // Conditional write: only the first submission is kept.
  const upd = await db.$executeRaw`UPDATE "ServiceReading" SET "draw" = jsonb_set("draw", '{picks}', ${JSON.stringify(picks)}::jsonb), "updatedAt" = now() WHERE "id" = ${id} AND ("draw"->'picks') = 'null'::jsonb`;
  if (upd !== 1) {
    const again = await db.serviceReading.findUnique({ where: { id } });
    picks = (again!.draw as unknown as { picks: typeof picks }).picks;
  }
  return json({ cards: picks.map((c) => ({ ...c, name: CARD[c.cardId].name })) });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
