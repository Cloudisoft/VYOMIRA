import { chatSchema } from "@/lib/schemas";
import { authed, err, json, parseBody } from "@/server/http";
import { loadChart } from "@/server/charts";
import { db } from "@/server/db";
import { getConfig } from "@/server/config";
import { hasConsent } from "@/server/consent";
import { balance, consume, recordTokenUsage, refundUnit } from "@/server/billing/entitlements";
import { answerQuestion } from "@/server/ai/aura";
import { guard } from "@/server/ai/guardrails";

export const maxDuration = 60;

export const POST = authed("aura-chat", async (req, { user }) => {
  const p = await parseBody(req, chatSchema);
  if (!p.ok) return p.res;
  const flags = await getConfig("flags");
  if (!flags.aura) return err(503, "AURA is temporarily unavailable.");
  const loaded = await loadChart(user.id);
  if (!loaded) return err(409, "Create your birth chart first.");

  // Conversation (scoped to user — no IDOR)
  let conv = p.data.conversationId ? await db.conversation.findFirst({ where: { id: p.data.conversationId, userId: user.id } }) : null;
  if (p.data.conversationId && !conv) return err(404, "Conversation not found");
  const history = conv
    ? (await db.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" }, take: 6 })).reverse().map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content.slice(0, 1500) }))
    : [];

  const g = guard(p.data.question, p.data.language);
  let entitlementId: string | null = null;
  if (g.kind === "ok") {
    const ai = await getConfig("ai");
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const today = await db.usageLedger.count({ where: { userId: user.id, kind: "ai_message", delta: -1, createdAt: { gte: startOfDay } } });
    if (today >= ai.perUserDailyMessageCap) return err(429, "You've reached today's message limit. AURA will be back tomorrow.");
    entitlementId = await consume(user.id, "ai_messages", `pending:${Date.now()}`);
    if (!entitlementId) return err(402, "You've used all your AURA messages. Choose a pack to keep the conversation going.", { code: "NO_CREDITS" });
  }

  const bal = await balance(user.id);
  try {
    const answer = await answerQuestion({
      chartKey: loaded.chartId,
      chart: loaded.chart,
      question: p.data.question,
      language: p.data.language,
      history,
      aiConsent: await hasConsent(user.id, "ai_processing"),
      deep: Boolean(p.data.deep) || bal.detailedReports,
    });
    if (entitlementId && !answer.chargeable) {
      await refundUnit(user.id, entitlementId, "uncharged");
      entitlementId = null;
    }
    if (!conv) conv = await db.conversation.create({ data: { userId: user.id, chartSnapshotId: loaded.chartId, title: p.data.question.slice(0, 80), language: p.data.language } });
    await db.message.create({ data: { conversationId: conv.id, role: "USER", content: p.data.question } });
    const msg = await db.message.create({
      data: { conversationId: conv.id, role: "ASSISTANT", content: answer.content, evidence: answer.evidence as never, generator: answer.generator, validation: answer.validation, tokensIn: answer.tokensIn, tokensOut: answer.tokensOut, costMicros: answer.costMicros },
    });
    await db.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });
    if (answer.tokensIn || answer.tokensOut) await recordTokenUsage(user.id, answer.generator, answer.tokensIn, answer.tokensOut, answer.costMicros, msg.id);
    return json({ conversationId: conv.id, message: { id: msg.id, role: "assistant", content: msg.content, evidence: answer.evidence, generator: answer.generator, validation: answer.validation, charged: Boolean(entitlementId) }, balance: await balance(user.id) });
  } catch (e) {
    if (entitlementId) await refundUnit(user.id, entitlementId, "error");
    throw e;
  }
}, { perIp: 30, perUser: 20, windowSeconds: 300 });
