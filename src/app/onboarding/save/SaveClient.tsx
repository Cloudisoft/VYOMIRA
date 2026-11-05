"use client";
import { useState } from "react";
import { useSessionJSON } from "@/lib/use-session-json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { PREVIEW_KEY, type PreviewState } from "@/components/onboarding/Wizard";

export function SaveClient() {
  const router = useRouter();
  const s = useSessionJSON<PreviewState>(PREVIEW_KEY);
  const [store, setStore] = useState(false);
  const [ai, setAi] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (s === undefined) return null;
  if (!s) return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-5xl">Let's calculate your chart</h1>
      <p className="mt-4 text-slate">We couldn't find a chart preview in this tab.</p>
      <Link href="/onboarding" className="btn-primary mt-8">Enter birth details</Link>
    </div>
  );
  const save = async () => {
    setBusy(true); setError(null);
    const r = await fetch("/api/charts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth: s.birth, consent: { storeBirthData: true, aiProcessing: ai, terms: true } }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Could not save. Please try again."); setBusy(false); return; }
    sessionStorage.removeItem(PREVIEW_KEY);
    router.push("/dashboard");
    router.refresh();
  };
  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">Your consent</p>
      <h1 className="mt-3 font-display text-5xl">Save {s.birth.fullName.split(" ")[0]}'s chart</h1>
      <p className="mt-4 text-slate">Birth details are personal information. Here is exactly what we'll do with them — and what you can change later in Settings.</p>
      <div className="mt-8 space-y-3">
        <label className="flex cursor-pointer gap-4 rounded-2xl border hairline bg-surface/40 p-5">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#D8B477]" checked={store} onChange={(e) => setStore(e.target.checked)} />
          <span><span className="block text-moon">Store my birth details <span className="text-xs text-gold">required</span></span><span className="mt-1 block text-sm text-slate">Name, date, time and place are encrypted (AES-256-GCM) and used only to compute your chart. Never in logs or analytics. Delete any time.</span></span>
        </label>
        <label className="flex cursor-pointer gap-4 rounded-2xl border hairline bg-surface/40 p-5">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#D8B477]" checked={ai} onChange={(e) => setAi(e.target.checked)} />
          <span><span className="block text-moon">Let AURA use an AI provider <span className="text-xs text-slate">optional</span></span><span className="mt-1 block text-sm text-slate">AURA sends a compact summary of chart factors (not your name or birth details) and your question to our AI provider to phrase answers. Without this, AURA answers with our rule engine only.</span></span>
        </label>
        <label className="flex cursor-pointer gap-4 rounded-2xl border hairline bg-surface/40 p-5">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#D8B477]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span className="text-sm text-slate">I agree to the <Link className="text-amethyst underline" href="/legal/terms" target="_blank">Terms</Link>, have read the <Link className="text-amethyst underline" href="/legal/privacy" target="_blank">Privacy Notice</Link>, and understand astrology readings are traditional interpretations, not professional advice. <span className="text-xs text-gold">required</span></span>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-[#F0A08A]">{error}</p>}
      <button onClick={save} disabled={!store || !terms || busy} className="btn-primary mt-8 w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Save securely & open my dashboard</button>
    </div>
  );
}
