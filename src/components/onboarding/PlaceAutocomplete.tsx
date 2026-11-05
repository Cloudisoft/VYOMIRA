"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlaceOption { id: number; label: string; name: string; country: string; lat: number; lng: number; tz: string }

export function PlaceAutocomplete({ value, onChange, inputId }: { value: PlaceOption | null; onChange: (p: PlaceOption | null) => void; inputId?: string }) {
  const [q, setQ] = useState(value?.label ?? "");
  const [opts, setOpts] = useState<PlaceOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value && q === value.label) return;
    if (q.trim().length < 2) return;
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal: ctrl.current.signal });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { places: PlaceOption[] };
        setOpts(j.places);
        setOpen(true);
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Place search is unavailable right now.");
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, value]);

  const shown = q.trim().length < 2 ? [] : opts;
  const pick = (p: PlaceOption) => { onChange(p); setQ(p.label); setOpen(false); };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate" />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="Start typing a city — e.g. Varanasi, Pune, London"
          className="field !pl-11"
          value={q}
          onChange={(e) => { setQ(e.target.value); if (value) onChange(null); }}
          onFocus={() => shown.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !shown.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); pick(shown[active]); }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {loading && <Loader2 className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin text-slate" />}
      </div>
      {open && shown.length > 0 && (
        <ul id={listId} role="listbox" className="glass absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl p-1.5">
          {shown.map((o, i) => (
            <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); pick(o); }} onMouseEnter={() => setActive(i)} className={cn("cursor-pointer rounded-xl px-3.5 py-2.5", i === active && "bg-violet/20")}>
              <p className="text-sm text-moon">{o.label}</p>
              <p className="text-xs text-slate">{o.lat.toFixed(3)}°, {o.lng.toFixed(3)}° · {o.tz}</p>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && q.trim().length >= 2 && shown.length === 0 && !error && <p className="mt-2 text-xs text-slate">No match. Try the nearest larger town (our database covers places with 15,000+ residents) or add the country after a comma.</p>}
      {error && <p className="mt-2 text-xs text-[#F0A08A]">{error}</p>}
      {value && (
        <p className="mt-2 text-xs text-slate">
          <span className="text-gold">✓</span> {value.lat.toFixed(4)}°, {value.lng.toFixed(4)}° · timezone <span className="text-moon">{value.tz}</span> (historical offsets applied automatically)
        </p>
      )}
    </div>
  );
}
