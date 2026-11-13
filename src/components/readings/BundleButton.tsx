"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function BundleButton({ productId, label }: { productId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [test, setTest] = useState<string | null>(null);
  const go = async () => {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/readings/bundle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error ?? "Could not start checkout.");
    if (j.provider === "test") return setTest(j.paymentId);
    if (j.checkoutUrl) window.location.href = j.checkoutUrl;
  };
  const sim = async () => {
    await fetch("/api/payments/test-complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: test, outcome: "success" }) });
    setTest(null); router.refresh();
  };
  return (
    <div>
      <button className="btn-primary" onClick={go} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}</button>
      {msg && <p className="mt-2 text-xs text-rose-300">{msg}</p>}
      {test && <div className="mt-3 flex gap-2 text-xs"><span className="text-amethyst">Test mode:</span><button className="underline" onClick={sim}>Simulate success</button><button className="underline" onClick={() => setTest(null)}>Cancel</button></div>}
    </div>
  );
}
