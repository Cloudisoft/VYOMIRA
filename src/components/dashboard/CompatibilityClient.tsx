"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PlaceAutocomplete, type PlaceOption } from "@/components/onboarding/PlaceAutocomplete";

interface Result { result: { reliable: boolean; moon: { a: string; b: string }; nakshatra: { a: string; b: string }; kootas: { name: string; max: number; score: number; detail: string }[]; note: string }; partner: { moonSign: string; nakshatra: string; lagna: string | null; venus?: string } }

export function CompatibilityClient() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;
    setBusy(true); setError(null);
    const r = await fetch("/api/compatibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partner: { fullName: name || "Partner", date, time, precision: time ? "exact" : "unknown", placeId: place.id, language: "en" } }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setError(j.error ?? "Could not compare charts."); return; }
    setRes(j);
  };
  const total = res?.result.kootas.reduce((s, k) => s + k.score, 0) ?? 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={submit} className="glass space-y-4 rounded-[1.5rem] p-6">
        <h2 className="font-display text-2xl">Partner's birth details</h2>
        <input className="field" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Partner name" />
        <input className="field [color-scheme:dark]" type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-label="Partner date of birth" />
        <input className="field [color-scheme:dark]" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Partner time of birth (optional)" />
        <PlaceAutocomplete value={place} onChange={setPlace} />
        {error && <p role="alert" className="text-sm text-[#F0A08A]">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !place || !date}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Compare</button>
      </form>
      <div className="glass rounded-[1.5rem] p-6" aria-live="polite">
        {res ? (
          <>
            <p className="eyebrow !text-[0.6rem]">Partial score</p>
            <p className="mt-2 font-display text-6xl">{total}<span className="text-2xl text-slate"> / 21</span></p>
            <p className="mt-1 text-sm text-slate">Moon: {res.result.moon.a} & {res.result.moon.b} · Nakshatra: {res.result.nakshatra.a} & {res.result.nakshatra.b}</p>
            <ul className="mt-6 space-y-3">
              {res.result.kootas.map((k) => (
                <li key={k.name} className="rounded-xl border hairline p-4">
                  <div className="flex justify-between"><span className="text-moon">{k.name}</span><span className="text-gold">{k.score}/{k.max}</span></div>
                  <p className="mt-1 text-sm text-slate">{k.detail}</p>
                </li>
              ))}
            </ul>
            {!res.result.reliable && <p className="mt-4 text-xs text-gold">One of the birth times is too imprecise to be sure of the nakshatra; treat these results as indicative.</p>}
            <p className="mt-4 text-xs text-slate/80">{res.result.note}</p>
          </>
        ) : <p className="text-slate">Enter your partner's details to see the three kootas we can compute with confidence.</p>}
      </div>
    </div>
  );
}
