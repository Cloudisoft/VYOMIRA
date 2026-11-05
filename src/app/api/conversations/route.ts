import { authed, json } from "@/server/http";
import { db } from "@/server/db";

export const GET = authed("conversations", async (_req, { user }) => {
  const list = await db.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, title: true, updatedAt: true, language: true, _count: { select: { messages: true } } } });
  return json({ conversations: list });
});
