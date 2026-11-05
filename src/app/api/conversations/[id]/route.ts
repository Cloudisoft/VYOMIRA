import { authed, err, json } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authed<Ctx>("conversation", async (_req, { user, params }) => {
  const { id } = await params;
  const conv = await db.conversation.findFirst({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!conv) return err(404, "Not found");
  return json({ conversation: { id: conv.id, title: conv.title, messages: conv.messages.map((m) => ({ id: m.id, role: m.role === "USER" ? "user" : "assistant", content: m.content, evidence: m.evidence, generator: m.generator, validation: m.validation, rating: m.rating, reported: m.reported })) } });
});

export const DELETE = authed<Ctx>("conversation-delete", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.conversation.deleteMany({ where: { id, userId: user.id } });
  if (!r.count) return err(404, "Not found");
  await audit("conversation.deleted", { userId: user.id, target: id });
  return json({ ok: true });
});
