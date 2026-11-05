"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** After PayU redirects back, confirm server-to-server (polls briefly while PayU settles). */
export function PayuReturn({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "PAID" | "FAILED" | "PENDING" | "error">("checking");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        const r = await fetch("/api/payments/payu/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId }) });
        const j = r.ok ? await r.json() : { status: "error" };
        if (j.status === "PAID" || j.status === "FAILED" || j.status === "error") { if (!cancelled) { setState(j.status); router.refresh(); } return; }
        await new Promise((res) => setTimeout(res, 2500));
      }
      if (!cancelled) setState("PENDING");
    })();
    return () => { cancelled = true; };
  }, [paymentId, router]);
  const text = { checking: "Confirming your payment with PayU…", PAID: "Payment confirmed — your pack is active.", FAILED: "The payment didn't go through. You have not been charged.", PENDING: "PayU is still processing this payment. It will activate automatically once confirmed — you can safely leave this page.", error: "We couldn't confirm this payment yet. If you were charged, it will activate automatically." }[state];
  return <p role="status" className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{state === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}{text}</p>;
}
