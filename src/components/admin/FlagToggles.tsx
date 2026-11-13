"use client";
import { useState } from "react";
import type { FeatureFlags } from "@/server/config";

const LABELS: [keyof FeatureFlags, string, string][] = [
  ["numerology", "Numerology readings", "Customers can buy numerology reports."],
  ["tarot", "Tarot readings", "Customers can buy tarot readings."],
  ["palmistry", "Palm readings", "When off, only admins can use palm readings (for testing)."],
  ["aura", "AURA chat", "Turning this off pauses AURA for everyone."],
  ["reports", "Astrology reports", "Detailed Kundli reports."],
  ["compatibility", "Compatibility", "Kundli matching."],
  ["signups", "New sign-ups", "Allow new accounts to be created."],
  ["stripe", "Stripe (non-INR)", "International card payments via Stripe."],
];

/** One-click on/off switches for feature flags (saved immediately; applies within 30 seconds). */
export function FlagToggles({ initial }: { initial: FeatureFlags }) {
  const [flags, setFlags] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = async (k: keyof FeatureFlags) => {
    const next = { ...flags, [k]: !flags[k] };
    setFlags(next);
    const r = await fetch("/api/admin/config/flags", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    if (r.ok) setMsg(`${LABELS.find((l) => l[0] === k)?.[1]} is now ${next[k] ? "ON" : "OFF"}. Live for customers within 30 seconds.`);
    else { setFlags(flags); setMsg("Couldn't save — please try again."); }
  };
  return (
    <section className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">Features on / off</h2>
      <ul className="mt-4 divide-y divide-[rgba(165,139,255,.12)]">
        {LABELS.map(([k, label, help]) => (
          <li key={k} className="flex items-center justify-between gap-4 py-3">
            <div><p className="text-moon">{label}</p><p className="text-xs text-slate">{help}</p></div>
            <button type="button" role="switch" aria-checked={Boolean(flags[k])} aria-label={label} onClick={() => toggle(k)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${flags[k] ? "bg-gold" : "bg-slate/30"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${flags[k] ? "left-6" : "left-1"}`} />
            </button>
          </li>
        ))}
      </ul>
      {msg && <p role="status" className="mt-3 text-sm text-gold">{msg}</p>}
    </section>
  );
}
