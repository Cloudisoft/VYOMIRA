"use client";
import { useState } from "react";
import { Panel } from "@/components/dashboard/ui";

/** JSON editor for AdminConfig values; the server validates every field with Zod before saving. */
export function ConfigEditor({ configKey, initial, help }: { configKey: string; initial: unknown; help: string }) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [status, setStatus] = useState<string | null>(null);
  return (
    <Panel title={`Configuration · ${configKey}`}>
      <p className="mb-3 text-sm text-slate">{help}</p>
      <textarea aria-label={`${configKey} configuration JSON`} className="field min-h-[320px] font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <div className="mt-3 flex items-center gap-4">
        <button className="btn-primary !py-2" onClick={async () => {
          let parsed: unknown;
          try { parsed = JSON.parse(text); } catch { setStatus("Invalid JSON"); return; }
          const r = await fetch(`/api/admin/config/${configKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
          const j = await r.json().catch(() => ({}));
          setStatus(r.ok ? "Saved. Changes apply within 30 seconds." : `Rejected: ${j.issues?.map((i: { path: string; message: string }) => `${i.path} ${i.message}`).join("; ") ?? j.error}`);
        }}>Save</button>
        {status && <p role="status" className="text-sm text-slate">{status}</p>}
      </div>
    </Panel>
  );
}
