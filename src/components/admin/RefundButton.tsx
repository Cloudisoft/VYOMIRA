"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ id, max, currency }: { id: string; max: number; currency: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button className="rounded-full border border-[#E07A5F]/50 px-2.5 py-0.5 text-[11px] text-[#F0A08A]" onClick={async () => {
        const amt = prompt(`Refund issued in the provider dashboard — amount in ${currency} (max ${(max / 100).toFixed(2)})`);
        if (!amt) return;
        const reference = prompt("Provider refund reference / request ID") ?? "";
        const r = await fetch(`/api/admin/payments/${id}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMinor: Math.round(Number(amt) * 100), reference }) });
        const j = await r.json().catch(() => ({}));
        setMsg(r.ok ? "recorded" : j.error ?? "failed");
        router.refresh();
      }}>Record refund</button>
      {msg && <span className="text-[11px] text-slate">{msg}</span>}
    </span>
  );
}
