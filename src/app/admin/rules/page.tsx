import { db } from "@/server/db";
import { COMPUTATION_VERSION } from "@/lib/astro/chart";
import { RULE_REGISTRY } from "@/lib/interpret/rule-catalog";
import { Panel } from "@/components/dashboard/ui";

export default async function AdminRules() {
  const [stored, versions] = await Promise.all([db.interpretationRule.count(), db.computationVersion.findMany({ include: { _count: { select: { charts: true } } } })]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Astrology rule versions</h1>
      <Panel title="Computation versions in use">
        <ul className="space-y-2 text-sm">{versions.map((v) => <li key={v.id} className="flex justify-between"><span className="font-mono">{v.id}{v.id === COMPUTATION_VERSION.id && <span className="ml-2 text-xs text-gold">current</span>}</span><span className="text-slate">{v._count.charts} charts</span></li>)}</ul>
        <p className="mt-3 text-xs text-slate">Changing any calculation convention requires bumping the computation version in code, which triggers recalculation for new charts while keeping old snapshots reproducible.</p>
      </Panel>
      <Panel title={`Interpretation rule catalog (${RULE_REGISTRY.length} rules; ${stored} seeded in DB)`}>
        <ul className="divide-y divide-[rgba(165,139,255,.12)] text-sm">
          {RULE_REGISTRY.map((r) => <li key={r.key} className="py-3"><p><span className="font-mono text-amethyst">{r.key}</span> <span className="text-xs text-slate">{r.version}</span></p><p className="text-moon/90">{r.title}</p><p className="text-slate">{r.body}</p><p className="text-xs text-slate/70">{r.sources.join(" · ")}</p></li>)}
        </ul>
        <p className="mt-3 text-xs text-slate">Rules are code-reviewed and versioned in the repository so every reading can be reproduced. Editing rule text in production is intentionally not supported.</p>
      </Panel>
    </div>
  );
}
