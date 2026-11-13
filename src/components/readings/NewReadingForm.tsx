"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TAROT_CATEGORIES, TAROT_CATEGORY_LABEL } from "@/lib/readings/tarot";

export interface ProductCard { id: string; tier: string; name: string; description: string; price: string; was: string | null; credit: boolean }

export function NewReadingForm({ category, products, defaultName, lang }: { category: "numerology" | "tarot" | "palmistry"; products: ProductCard[]; defaultName: string; lang: string }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products.find((p) => p.credit)?.id ?? products[0]?.id);
  const [name, setName] = useState(defaultName);
  const [dob, setDob] = useState("");
  const [method, setMethod] = useState("pythagorean");
  const [topic, setTopic] = useState<string>("general");
  const [question, setQuestion] = useState("");
  const [dominant, setDominant] = useState("right");
  const [hands, setHands] = useState("right");
  const [language, setLanguage] = useState(lang);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const input = category === "numerology" ? { name, dob, method } : category === "tarot" ? { category: topic, question } : { dominant, hands };
    const res = await fetch("/api/readings/service", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, input, language, aiConsent: consent }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.issues?.[0]?.message && j.issues[0].path ? `${j.error} (${j.issues[0].path})` : j.error ?? "Something went wrong."); setBusy(false); return; }
    router.push(`/dashboard/readings/${j.reading.id}`);
  };

  const field = "mt-1.5 w-full rounded-xl border hairline bg-navy/50 px-4 py-3 text-moon outline-none focus:border-gold/60";
  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="font-display text-2xl">Choose your reading</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <label key={p.id} className={`glass flex cursor-pointer flex-col rounded-2xl p-5 transition ${productId === p.id ? "ring-2 ring-gold" : "hover:ring-1 hover:ring-gold/40"}`}>
              <input type="radio" name="product" value={p.id} checked={productId === p.id} onChange={() => setProductId(p.id)} className="sr-only" />
              <span className="font-display text-xl">{p.name}</span>
              <span className="mt-1 flex-1 text-sm text-slate">{p.description}</span>
              <span className="mt-4 flex items-baseline gap-2">
                {p.credit ? <span className="text-gold">Included in your bundle</span> : <><span className="font-display text-2xl text-gold">{p.price}</span>{p.was && <span className="text-sm text-slate line-through">{p.was}</span>}{p.was && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] tracking-widest text-gold">LAUNCH PRICE</span>}</>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="glass grid gap-5 rounded-[1.5rem] p-6 sm:grid-cols-2">
        <legend className="sr-only">Your details</legend>
        {category === "numerology" && <>
          <label className="text-sm">Full name at birth<input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" /></label>
          <label className="text-sm">Date of birth<input required type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} className={field} /></label>
          <label className="text-sm">Method<select value={method} onChange={(e) => setMethod(e.target.value)} className={field}><option value="pythagorean">Pythagorean (most common)</option><option value="chaldean">Chaldean (traditional)</option></select></label>
        </>}
        {category === "tarot" && <>
          <label className="text-sm">Area of life<select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>{TAROT_CATEGORIES.map((c) => <option key={c} value={c}>{TAROT_CATEGORY_LABEL[c]}</option>)}</select></label>
          <label className="text-sm sm:col-span-2">Your question <span className="text-slate">(optional)</span><textarea maxLength={300} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} className={field} placeholder="e.g. What should I keep in mind about the new job offer?" /></label>
        </>}
        {category === "palmistry" && <>
          <label className="text-sm">Dominant hand (the one you write with)<select value={dominant} onChange={(e) => setDominant(e.target.value)} className={field}><option value="right">Right</option><option value="left">Left</option></select></label>
          <label className="text-sm">Photos you&apos;ll upload<select value={hands} onChange={(e) => setHands(e.target.value)} className={field}><option value="right">Right palm</option><option value="left">Left palm</option><option value="both">Both palms (recommended for Complete)</option></select></label>
        </>}
        <label className="text-sm">Report language<select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}><option value="en">English</option><option value="hi">हिन्दी (Hindi)</option><option value="hinglish">Hinglish</option></select></label>
        <label className="flex items-start gap-3 text-sm text-slate sm:col-span-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required={category === "palmistry"} className="mt-1 accent-[#E8C98B]" />
          <span>Use AI to write my reading{category === "palmistry" ? " and analyse my palm photos (required for palm readings)" : " (without it, you get a clear rule-based report in English)"}. Inputs are sent securely to our AI provider and not used to train models.</span>
        </label>
      </fieldset>
      {err && <p role="alert" className="text-sm text-rose-300">{err}</p>}
      <button className="btn-primary" disabled={busy || !productId}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Continue</button>
    </form>
  );
}
