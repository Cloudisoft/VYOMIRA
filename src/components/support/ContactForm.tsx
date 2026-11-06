"use client";
import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const TOPICS = [["general", "General question"], ["billing", "Billing & payments"], ["account", "My account"], ["privacy", "Privacy & data"], ["partnership", "Partnerships"]] as const;

/** Sends the enquiry to our private inbox via /api/contact; the inbox address is never shown. */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setState("sent"); return; }
      const j = await res.json().catch(() => ({}));
      setError(j.issues?.[0]?.message ?? j.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "sent") {
    return (
      <div className="glass rounded-[1.5rem] p-8 text-center not-prose">
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-4 font-display text-3xl text-moon">Message sent</p>
        <p className="mt-2 text-slate">Thank you — we&apos;ll reply to your email within 2 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-[1.5rem] p-6 sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate">Name<input name="name" required maxLength={80} autoComplete="name" className="field mt-1.5" /></label>
        <label className="block text-sm text-slate">Email<input name="email" type="email" required maxLength={160} autoComplete="email" className="field mt-1.5" /></label>
        <label className="block text-sm text-slate">Phone <span className="text-slate/60">(optional)</span><input name="phone" type="tel" maxLength={24} autoComplete="tel" className="field mt-1.5" /></label>
        <label className="block text-sm text-slate">Topic
          <select name="topic" defaultValue="general" className="field mt-1.5">
            {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm text-slate">Message<textarea name="message" required minLength={10} maxLength={4000} rows={5} className="field mt-1.5 resize-y" placeholder="How can we help? Please don't include birth details." /></label>
      {/* honeypot — hidden from people, tempting to bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {error && <p role="alert" className="text-sm text-[#F0A08A]">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-primary w-full sm:w-auto">
        {state === "sending" ? "Sending…" : <>Send message <Send className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
