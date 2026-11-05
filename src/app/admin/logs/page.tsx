import { db } from "@/server/db";

export default async function AdminLogs() {
  const events = await db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="text-4xl">Errors & audit trail</h1>
      <p className="mt-2 text-sm text-slate">Operational events. By design these never include birth details, chart payloads, message text or raw IP addresses.</p>
      <ul className="mt-6 divide-y divide-[rgba(165,139,255,.12)] font-mono text-xs">
        {events.map((e) => (
          <li key={e.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2">
            <span className="text-slate">{e.createdAt.toISOString()}</span>
            <span className={e.level === "error" ? "text-[#F0A08A]" : e.level === "warn" ? "text-gold" : "text-amethyst"}>{e.level}</span>
            <span className="text-moon">{e.action}</span>
            {e.target && <span className="text-slate">{e.target}</span>}
            {e.meta && <span className="text-slate/70">{JSON.stringify(e.meta)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
