"use client";
import { useState } from "react";
import type { PricingConfig, ReadingProduct } from "@/lib/pricing";

/** Table editor for one-time reading products. Saves the whole pricing config (server validates with Zod). */
export function ReadingProductsEditor({ pricing }: { pricing: PricingConfig }) {
  const [rows, setRows] = useState<ReadingProduct[]>(pricing.readings);
  const [status, setStatus] = useState<string | null>(null);
  const set = (i: number, patch: Partial<ReadingProduct>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const rupee = (minor: number | null | undefined) => (minor ? String(minor / 100) : "");
  const save = async () => {
    const r = await fetch("/api/admin/config/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pricing, readings: rows }) });
    const j = await r.json().catch(() => ({}));
    setStatus(r.ok ? "Saved. New orders use these prices within 30 seconds; existing orders keep theirs." : `Rejected: ${j.issues?.map((i: { path: string; message: string }) => `${i.path} ${i.message}`).join("; ") ?? j.error}`);
  };
  return (
    <div className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">Reading products</h2>
      <p className="mt-1 text-sm text-slate">Prices in whole rupees. “Launch price” is charged while set (clear it to end the introductory offer). Inactive products can't be bought; existing purchases stay accessible.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Product id</th><th>Name</th><th>Price ₹</th><th>Launch ₹</th><th>Active</th></tr></thead>
        <tbody>{rows.map((p, i) => (
          <tr key={p.id} className="border-t hairline">
            <td className="py-2 font-mono text-xs">{p.id}</td>
            <td><input className="field !py-1.5 text-sm" value={p.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
            <td><input className="field !w-24 !py-1.5 text-sm" inputMode="numeric" value={rupee(p.priceMinor)} onChange={(e) => set(i, { priceMinor: Math.round(Number(e.target.value || 0)) * 100 })} /></td>
            <td><input className="field !w-24 !py-1.5 text-sm" inputMode="numeric" placeholder="—" value={rupee(p.launchPriceMinor)} onChange={(e) => set(i, { launchPriceMinor: e.target.value ? Math.round(Number(e.target.value)) * 100 : null })} /></td>
            <td><input type="checkbox" checked={p.active} onChange={(e) => set(i, { active: e.target.checked })} className="accent-[#E8C98B]" /></td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className="mt-4 flex items-center gap-4"><button className="btn-primary !py-2" onClick={save}>Save products</button>{status && <p role="status" className="text-sm text-slate">{status}</p>}</div>
    </div>
  );
}
