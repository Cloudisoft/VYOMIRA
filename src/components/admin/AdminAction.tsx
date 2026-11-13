"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAction({ url, label }: { url: string; label: string }) {
  const router = useRouter();
  const [s, setS] = useState<string | null>(null);
  return <span className="inline-flex items-center gap-2"><button className="text-xs text-gold underline" onClick={async () => { setS("…"); const r = await fetch(url, { method: "POST" }); const j = await r.json().catch(() => ({})); setS(r.ok ? (j.status ?? "done") : (j.error ?? "failed")); router.refresh(); }}>{label}</button>{s && <span className="text-xs text-slate">{s}</span>}</span>;
}
