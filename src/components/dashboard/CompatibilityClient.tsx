"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PlaceAutocomplete, type PlaceOption } from "@/components/onboarding/PlaceAutocomplete";
import { cn } from "@/lib/utils";

interface Koota { name: string; max: number; score: number; detail: string }
interface Result { result: { version: string; total: number; max: number; band: string; kootas: Koota[]; notes: string[]; reliable: boolean }; me: { moonSign: string; nakshatra: string }; partner: { moonSign: string; nakshatra: string; lagna: string | null } }

export function CompatibilityClient() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceOption | null>(null);
  const [role, setRole] = useState<"bride" | "groom">("bride");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;
    setBusy(true); setError(null);
    const r = await fetch("/api/compatibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ myRole: role, partner: { fullName: name || "Partner", date, time, precision: time ? "exact" : "unknown", placeId: place.id, language: "en" } }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setError(j.error ?? "Could not compare charts."); return; }
    setRes(j);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <form onSubmit={submit} className="glass space-y-4 rounded-[1.5rem] p-6">
        <h2 className="font-display text-2xl">Partner's birth details</h2>
        <div role="radiogroup" aria-label="Your role in the traditional calculation" className="grid grid-cols-2 gap-2 text-sm">
          {(["bride", "groom"] as const).map((r) => <button type="button" role="radio" aria-checked={role === r} key={r} onClick={() => setRole(r)} className={cn("rounded-xl border px-3 py-2", role === r ? "border-gold/60 bg-gold/10 text-moon" : "hairline text-slate")}>I'm the {r}</button>)}
        </div>
        <p className="text-xs text-slate">Varna, Vashya, Yoni and Gana are scored by direction in the classical method, so roles matter.</p>
        <input className="field" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Partner name" />
        <input className="field [color-scheme:dark]" type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-label="Partner date of birth" />
        <input className="field [color-scheme:dark]" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Partner time of birth (optional)" />
        <PlaceAutocomplete value={place} onChange={setPlace} />
        {error && <p role="alert" className="text-sm text-[#F0A08A]">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !place || !date}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Calculate Guna Milan</button>
      </form>
      <div className="glass rounded-[1.5rem] p-6" aria-live="polite">
        {res ? (
          <>
            <p className="eyebrow !text-[0.6rem]">Ashtakoota · {res.result.version}</p>
            <p className="mt-2 font-display text-6xl">{res.result.total}<span className="text-2xl text-slate"> / 36</span></p>
            <p className="mt-1 text-sm text-gold">Traditionally {res.result.band}</p>
            <p className="mt-1 text-sm text-slate">You: {res.me.moonSign}, {res.me.nakshatra} · Partner: {res.partner.moonSign}, {res.partner.nakshatra}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {res.result.kootas.map((k) => (
                <li key={k.name} className="rounded-xl border hairline p-3">
                  <div className="flex justify-between"><span className="text-moon">{k.name}</span><span className={k.score === k.max ? "text-gold" : k.score === 0 ? "text-[#F0A08A]" : "text-moon"}>{k.score}/{k.max}</span></div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-moon/10"><div className="h-full bg-gradient-to-r from-violet to-gold" style={{ width: `${(k.score / k.max) * 100}%` }} /></div>
                  <p className="mt-2 text-xs text-slate">{k.detail}</p>
                </li>
              ))}
            </ul>
            {res.result.notes.map((n) => <p key={n} className="mt-3 text-xs text-gold/90">{n}</p>)}
            {!res.result.reliable && <p className="mt-3 text-xs text-gold">One birth time is too imprecise to be sure of the nakshatra; treat this as indicative.</p>}
            <p className="mt-4 text-xs leading-relaxed text-slate/80">Guna Milan is one traditional lens, not a verdict on a relationship. Tables differ between traditions; ours are documented on the Methodology page. Never make a life decision on a score.</p>
          </>
        ) : <p className="text-slate">Enter your partner's details to compute all eight kootas (36 points).</p>}
      </div>
    </div>
  );
}
