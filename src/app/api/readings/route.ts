import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";

export const GET = authed("readings", async (_req, { user }) => {
  const readings = await db.reading.findMany({ where: { userId: user.id, saved: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return json({ readings });
});

/** Save an AURA answer as a reading (copied from a message the user owns). */
export const POST = authed("readings-save", async (req, { user }) => {
  const p = await parseBody(req, z.object({ messageId: z.string().cuid() }));
  if (!p.ok) return p.res;
  const m = await db.message.findFirst({ where: { id: p.data.messageId, role: "ASSISTANT", conversation: { userId: user.id } }, include: { conversation: true } });
  if (!m) return err(404, "Not found");
  const q = await db.message.findFirst({ where: { conversationId: m.conversationId, role: "USER", createdAt: { lte: m.createdAt } }, orderBy: { createdAt: "desc" } });
  const r = await db.reading.upsert({
    where: { chartSnapshotId_kind_topic_contextKey: { chartSnapshotId: m.conversation.chartSnapshotId, kind: "aura", topic: (m.evidence as { topic?: string } | null)?.topic ?? "general", contextKey: m.id } },
    create: { userId: user.id, chartSnapshotId: m.conversation.chartSnapshotId, kind: "aura", topic: (m.evidence as { topic?: string } | null)?.topic ?? "general", contextKey: m.id, content: { question: q?.content ?? "", answer: m.content } as never, evidence: (m.evidence ?? {}) as never, generator: m.generator ?? "unknown", validationStatus: m.validation ?? "unknown", saved: true },
    update: { saved: true },
  });
  return json({ id: r.id });
}, { perIp: 60, perUser: 60, windowSeconds: 600 });

export const DELETE = authed("readings-delete", async (req, { user }) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const r = await db.reading.deleteMany({ where: { id, userId: user.id } });
  return r.count ? json({ ok: true }) : err(404, "Not found");
});
