"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "./ui";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-gold" : "bg-moon/15"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-navy transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function SettingsClient({ aiConsent, marketingConsent, email, language }: { aiConsent: boolean; marketingConsent: boolean; email: string; language: "en" | "hi" | "hinglish" | null }) {
  const router = useRouter();
  const [ai, setAi] = useState(aiConsent);
  const [mk, setMk] = useState(marketingConsent);
  const [lang, setLang] = useState(language ?? "en");
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const setConsent = async (kind: string, granted: boolean) => {
    await fetch("/api/account/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, granted }) });
  };
  return (
    <>
      {language && (
        <Panel title="Language · भाषा">
          <p className="text-sm text-slate">Your Life Guide, dashboard summary and AURA&apos;s answers will use this language. · आपकी जीवन मार्गदर्शिका, डैशबोर्ड और AURA के उत्तर इसी भाषा में होंगे।</p>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-2" role="radiogroup" aria-label="Preferred language">
            {([["en", "English"], ["hi", "हिन्दी"], ["hinglish", "Hinglish"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={lang === v} onClick={async () => { setLang(v); setSaved(false); const r = await fetch("/api/account/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: v }) }); if (r.ok) { setSaved(true); router.refresh(); } }} className={`rounded-2xl border px-3 py-3 text-sm ${lang === v ? "border-gold/60 bg-gold/10 text-moon" : "hairline text-slate"}`}>{l}</button>
            ))}
          </div>
          {saved && <p className="mt-3 text-xs text-gold" role="status">Saved · सहेजा गया</p>}
        </Panel>
      )}
      <Panel title="Consent">
        <ul className="space-y-5">
          <li className="flex items-start justify-between gap-6">
            <div><p className="text-moon">AI processing for AURA</p><p className="text-sm text-slate">Send a compact summary of chart factors and your question to our AI provider so AURA can phrase answers conversationally. Off = AURA answers in simple words from your chart's timings, without an AI model.</p></div>
            <Switch label="AI processing" checked={ai} onChange={(v) => { setAi(v); setConsent("ai_processing", v); }} />
          </li>
          <li className="flex items-start justify-between gap-6">
            <div><p className="text-moon">Product updates by email</p><p className="text-sm text-slate">Occasional emails about new features. Never sold or shared.</p></div>
            <Switch label="Marketing email" checked={mk} onChange={(v) => { setMk(v); setConsent("marketing", v); }} />
          </li>
        </ul>
      </Panel>
      <Panel title="Your data">
        <p className="text-sm text-slate">Download everything we hold about you — profile, decrypted birth details, charts, conversations, reports, payments and consent history — as JSON.</p>
        <a href="/api/account/export" className="btn-ghost mt-4 !py-2.5 text-sm">Export my data</a>
      </Panel>
      <Panel title="Delete account" className="border-[#E07A5F]/30">
        <p className="text-sm text-slate">Permanently deletes your account, birth profiles, charts, conversations, readings, reports and remaining message balance. This cannot be undone. Signed in as {email}.</p>
        <label className="mt-4 block text-sm text-slate" htmlFor="del">Type DELETE to confirm</label>
        <div className="mt-2 flex gap-2">
          <input id="del" className="field max-w-xs" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button disabled={confirm !== "DELETE" || busy} onClick={async () => { setBusy(true); const r = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) }); if (r.ok) { router.push("/"); router.refresh(); } else setBusy(false); }} className="rounded-full border border-[#E07A5F]/60 px-5 text-sm text-[#F0A08A] disabled:opacity-40">Delete forever</button>
        </div>
      </Panel>
    </>
  );
}
