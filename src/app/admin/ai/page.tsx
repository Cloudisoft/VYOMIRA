import { db } from "@/server/db";
import { getConfig } from "@/server/config";
import { ConfigEditor } from "@/components/admin/ConfigEditor";
import { Panel } from "@/components/dashboard/ui";

export default async function AdminAi() {
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [byModel, byValidation, ai] = await Promise.all([
    db.usageLedger.groupBy({ by: ["model"], where: { kind: "llm_tokens", createdAt: { gte: monthStart } }, _sum: { tokensIn: true, tokensOut: true, costMicros: true }, _count: true }),
    db.message.groupBy({ by: ["validation"], where: { role: "ASSISTANT", createdAt: { gte: monthStart } }, _count: true }),
    getConfig("ai"),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">AI usage & models</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="This month by model">
          {byModel.length ? <ul className="space-y-2 text-sm">{byModel.map((m) => <li key={m.model ?? "?"} className="flex justify-between gap-4"><span className="truncate">{m.model}</span><span className="text-slate">{m._count} calls · ${((m._sum.costMicros ?? 0) / 1e6).toFixed(3)}</span></li>)}</ul> : <p className="text-sm text-slate">No LLM calls this month.</p>}
        </Panel>
        <Panel title="Answer outcomes">
          <ul className="space-y-2 text-sm">{byValidation.map((v) => <li key={v.validation ?? "?"} className="flex justify-between"><span>{v.validation}</span><span className="text-slate">{v._count}</span></li>)}</ul>
          <p className="mt-3 text-xs text-slate">passed = AI answer passed fact-check · fallback = rule engine · guardrail = care/boundary reply · cached = repeat.</p>
        </Panel>
      </div>
      <ConfigEditor configKey="ai" initial={ai} help="Models, output limits, monthly budget (USD) and per-user daily caps. Prices are USD per 1M tokens and are used for accounting only." />
    </div>
  );
}
