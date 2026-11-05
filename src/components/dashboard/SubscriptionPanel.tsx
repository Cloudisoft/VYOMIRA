"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan { id: string; name: string; tagline: string; aiMessagesPerMonth: number; priceMinor: number; features: string[]; highlight?: boolean }
interface Sub { id: string; planId: string; status: string; amountMinor: number; currentPeriodEnd: string | null; nextChargeAt: string | null; cancelAtPeriodEnd: boolean }

export function SubscriptionPanel({ plans, current, mode, returnSub, returnRenew }: { plans: Plan[]; current: Sub | null; mode: "autopay" | "link"; returnSub?: string; returnRenew?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Returning from PayU: confirm server-to-server (polls briefly while PayU settles).
  useEffect(() => {
    const id = returnSub ?? returnRenew;
    if (!id) return;
    let cancelled = false;
    (async () => {
      setMsg("Confirming your payment with PayU…");
      for (let i = 0; i < 8 && !cancelled; i++) {
        const r = await fetch("/api/subscriptions/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionId: id, kind: returnSub ? "start" : "renew" }) });
        const j = r.ok ? await r.json() : { status: "error" };
        if (["ACTIVE", "PAID"].includes(j.status)) { setMsg("Payment confirmed — your monthly plan is active."); router.refresh(); return; }
        if (j.status === "FAILED") { setMsg("The payment didn't go through. You have not been charged."); return; }
        await new Promise((res) => setTimeout(res, 2500));
      }
      if (!cancelled) setMsg("PayU is still processing this payment. Your plan activates automatically once it's confirmed.");
    })();
    return () => { cancelled = true; };
  }, [returnSub, returnRenew, router]);

  const subscribe = async (planId: string) => {
    setBusy(planId); setMsg(null);
    const r = await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error ?? "Could not start the subscription."); setBusy(null); return; }
    window.location.assign(j.url);
  };
  const cancel = async () => {
    if (!current || !confirm("Cancel your monthly plan? You keep access until the end of the paid period, and no further payments are taken.")) return;
    setBusy("cancel");
    await fetch(`/api/subscriptions/${current.id}/cancel`, { method: "POST" });
    setBusy(null);
    router.refresh();
  };
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const active = current && ["ACTIVE", "PAST_DUE", "CANCELLED"].includes(current.status);

  return (
    <section className="glass rounded-[1.5rem] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl">Monthly plans</h2>
        <p className="flex items-center gap-2 text-xs text-slate"><RefreshCw className="h-3.5 w-3.5" />{mode === "autopay" ? "Renews automatically via UPI Autopay or card mandate — you're notified before every charge." : "Renews monthly by a secure PayU link we email you — no automatic charges."}</p>
      </div>
      {msg && <p role="status" className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{msg}</p>}
      {active && current ? (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/[.05] p-5">
          <p className="text-sm text-slate">Current plan</p>
          <p className="mt-1 font-display text-3xl">{plans.find((p) => p.id === current.planId)?.name ?? current.planId} <span className="text-lg text-slate">· ₹{current.amountMinor / 100}/month</span></p>
          <p className="mt-2 text-sm text-slate">
            {current.status === "CANCELLED" ? <>Cancelled — access until <span className="text-moon">{fmt(current.currentPeriodEnd)}</span>. No further charges.</> : current.status === "PAST_DUE" ? <span className="text-[#F0A08A]">Renewal payment failed — plan paused. Your chart and readings are safe; you can resubscribe below once this period ends.</span> : <>Active until <span className="text-moon">{fmt(current.currentPeriodEnd)}</span> · renews {fmt(current.nextChargeAt)}</>}
          </p>
          {current.status === "ACTIVE" && <button onClick={cancel} disabled={busy === "cancel"} className="mt-4 rounded-full border border-[#E07A5F]/50 px-4 py-2 text-xs text-[#F0A08A] disabled:opacity-50">{busy === "cancel" ? "Cancelling…" : "Cancel plan"}</button>}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className={cn("rounded-2xl border p-5", p.highlight ? "border-gold/50 bg-gold/[.04]" : "hairline")}>
              <div className="flex items-baseline justify-between"><h3 className="font-display text-2xl">{p.name}</h3><p className="font-display text-2xl text-gold">₹{p.priceMinor / 100}<span className="text-sm text-slate">/mo</span></p></div>
              <p className="text-xs text-slate">{p.tagline}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate">{p.features.map((f) => <li key={f}>· {f}</li>)}</ul>
              <button onClick={() => subscribe(p.id)} disabled={busy !== null} className={cn("mt-4 w-full", p.highlight ? "btn-primary" : "btn-ghost")}>{busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />} Subscribe</button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-slate/70">Monthly messages refresh each billing period and don't roll over. One-time packs below never expire and are used after your monthly allowance. Cancel anytime; refunds per our <a className="underline" href="/legal/refunds">refund policy</a>.</p>
    </section>
  );
}
