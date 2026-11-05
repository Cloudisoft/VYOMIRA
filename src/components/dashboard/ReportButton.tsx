"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ReportButton({ type }: { type: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button className="btn-primary !py-2.5 text-sm" disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        const r = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
        const j = await r.json();
        setBusy(false);
        if (!r.ok) { setError(j.error ?? "Could not generate report."); return; }
        router.push(`/dashboard/reports/${j.id}`);
      }}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Open report</button>
      {error && <p role="alert" className="mt-2 text-xs text-[#F0A08A]">{error}</p>}
    </div>
  );
}
