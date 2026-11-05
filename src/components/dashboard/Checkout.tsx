"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Order { provider: "razorpay" | "test" | "stripe"; paymentId: string; orderId: string; checkoutUrl?: string; amount: number; currency: string; keyId: string | null; planName: string; email: string; name: string }

export function Checkout({ planId, label, highlight }: { planId: string; label: string; highlight?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [testOrder, setTestOrder] = useState<Order | null>(null);

  const start = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
      const o = (await r.json()) as Order & { error?: string };
      if (!r.ok) throw new Error(o.error ?? "Could not start checkout");
      if (o.provider === "test") { setTestOrder(o); return; }
      if (o.provider === "stripe" && o.checkoutUrl) { window.location.href = o.checkoutUrl; return; }
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Could not load Razorpay checkout. Check your connection.");
      const rz = new window.Razorpay({
        key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency, name: "VYOMIRA", description: o.planName,
        prefill: { email: o.email, name: o.name }, theme: { color: "#7256D8" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          setMsg(v.ok ? "Payment confirmed — your pack is active." : "We couldn't verify the payment yet. If you were charged, it will activate automatically once Razorpay confirms.");
          router.refresh();
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on("payment.failed", () => setMsg("The payment didn't go through. You have not been charged."));
      rz.open();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  const simulate = async (outcome: "success" | "failure") => {
    if (!testOrder) return;
    setBusy(true);
    const r = await fetch("/api/payments/test-complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: testOrder.paymentId, outcome }) });
    setBusy(false);
    setTestOrder(null);
    setMsg(r.ok ? (outcome === "success" ? "Test payment simulated — pack activated (no money moved)." : "Simulated a failed payment.") : "Simulation failed.");
    router.refresh();
  };

  return (
    <div className="mt-6">
      <button onClick={start} disabled={busy} className={cn("w-full", highlight ? "btn-primary" : "btn-ghost")}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}</button>
      {msg && <p role="status" className="mt-3 text-xs text-slate">{msg}</p>}
      {testOrder && (
        <div role="dialog" aria-modal="true" aria-labelledby="test-pay-title" className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-6 backdrop-blur">
          <div className="glass w-full max-w-md rounded-[1.5rem] p-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-violet/20 px-3 py-1 text-xs text-amethyst"><FlaskConical className="h-3.5 w-3.5" /> LOCAL TEST MODE</p>
            <h2 id="test-pay-title" className="mt-4 font-display text-3xl">Payment simulator</h2>
            <p className="mt-2 text-sm text-slate">{testOrder.planName} · {(testOrder.amount / 100).toFixed(2)} {testOrder.currency}. Razorpay isn't configured, so this simulates the provider's callback. <strong className="text-moon">No money moves.</strong></p>
            <p className="mt-2 font-mono text-[11px] text-slate/70">{testOrder.orderId}</p>
            <div className="mt-6 flex gap-3">
              <button className="btn-primary flex-1" onClick={() => simulate("success")} disabled={busy}>Simulate success</button>
              <button className="btn-ghost flex-1" onClick={() => simulate("failure")} disabled={busy}>Simulate failure</button>
            </div>
            <button className="mt-4 w-full text-xs text-slate hover:text-moon" onClick={() => setTestOrder(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
