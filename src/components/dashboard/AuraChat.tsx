"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, Flag, Loader2, MessageSquarePlus, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2, Layers } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { SUGGESTIONS } from "./AskBox";
import { cn } from "@/lib/utils";

interface Evidence { topicLabel: string; factors: { id: string; statement: string; interpretation: string; polarity: string }[]; timing: { label: string; start: string; end: string; basis: string }[]; notes: string[]; rulesVersion: string; computationVersion: string }
interface Msg { id: string; role: "user" | "assistant"; content: string; evidence?: Evidence | null; generator?: string | null; validation?: string | null; rating?: number | null; reported?: boolean; pending?: boolean }
interface ConvRow { id: string; title: string; updatedAt: string }

const LANGS = [["en", "English"], ["hi", "हिन्दी"], ["hinglish", "Hinglish"]] as const;

export function AuraChat({ initialBalance, aiConsent, aiConfigured, defaultLanguage }: { initialBalance: number; aiConsent: boolean; aiConfigured: boolean; defaultLanguage: "en" | "hi" | "hinglish" }) {
  const params = useSearchParams();
  const router = useRouter();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [convId, setConvId] = useState<string | null>(params.get("c"));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  // ?draft= pre-fills a suggested question (e.g. from the Life Guide) without sending it — sending spends a message
  const [q, setQ] = useState(() => params.get("draft")?.slice(0, 600) ?? "");
  const [lang, setLang] = useState(defaultLanguage);
  const [busy, setBusy] = useState(false);
  const [bal, setBal] = useState(initialBalance);
  const [error, setError] = useState<{ text: string; upsell?: boolean } | null>(null);
  const [openEv, setOpenEv] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const autoAsked = useRef(false);

  const loadConvs = useCallback(() => {
    fetch("/api/conversations").then(async (r) => { if (r.ok) setConvs((await r.json()).conversations); });
  }, []);
  useEffect(() => {
    let live = true;
    fetch("/api/conversations").then(async (r) => { if (r.ok && live) setConvs((await r.json()).conversations); });
    return () => { live = false; };
  }, []);
  const openConv = useCallback((id: string | null) => {
    setConvId(id);
    setMsgs([]);
    if (id) fetch(`/api/conversations/${id}`).then(async (r) => { if (r.ok) setMsgs((await r.json()).conversation.messages); });
  }, []);
  useEffect(() => {
    const initial = params.get("c");
    if (initial) fetch(`/api/conversations/${initial}`).then(async (r) => { if (r.ok) setMsgs((await r.json()).conversation.messages); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  const send = useCallback(async (question: string) => {
    if (question.trim().length < 3 || busy) return;
    setBusy(true); setError(null); setQ("");
    setMsgs((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: question }, { id: "pending", role: "assistant", content: "", pending: true }]);
    try {
      const r = await fetch("/api/aura/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, language: lang, conversationId: convId ?? undefined }) });
      const j = await r.json();
      if (!r.ok) {
        setMsgs((m) => m.filter((x) => x.id !== "pending"));
        setError({ text: j.error ?? "Something went wrong.", upsell: j.code === "NO_CREDITS" });
        return;
      }
      setMsgs((m) => [...m.filter((x) => x.id !== "pending"), j.message]);
      setBal(j.balance.aiMessages);
      if (!convId) { setConvId(j.conversationId); router.replace(`/dashboard/aura?c=${j.conversationId}`); }
      loadConvs();
    } catch {
      setMsgs((m) => m.filter((x) => x.id !== "pending"));
      setError({ text: "Network error — your message was not charged." });
    } finally { setBusy(false); }
  }, [busy, lang, convId, router, loadConvs]);

  useEffect(() => {
    const pre = params.get("q");
    if (pre && !autoAsked.current && !params.get("c")) { autoAsked.current = true; send(pre); }
  }, [params, send]);

  const feedback = async (id: string, body: object) => {
    await fetch(`/api/messages/${id}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, ...("rating" in body ? { rating: (body as { rating: number }).rating } : {}), ...("report" in body ? { reported: true } : {}) } : x)));
  };
  const save = async (id: string) => { const r = await fetch("/api/readings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) }); if (r.ok) setError({ text: "Saved to your readings." }); };
  const del = async (id: string) => {
    if (!confirm("Delete this conversation permanently?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (id === convId) { openConv(null); router.replace("/dashboard/aura"); }
    loadConvs();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="order-2 lg:order-1">
        <button onClick={() => { openConv(null); router.replace("/dashboard/aura"); }} className="btn-ghost w-full !py-2.5 text-sm"><MessageSquarePlus className="h-4 w-4" /> New conversation</button>
        <ul className="mt-4 space-y-1">
          {convs.map((c) => (
            <li key={c.id} className={cn("group flex items-center gap-1 rounded-xl", c.id === convId && "bg-moon/5")}>
              <button onClick={() => { openConv(c.id); router.replace(`/dashboard/aura?c=${c.id}`); }} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-slate hover:text-moon">{c.title}</button>
              <button onClick={() => del(c.id)} aria-label={`Delete conversation ${c.title}`} className="p-2 text-slate/50 opacity-0 group-hover:opacity-100 hover:text-[#F0A08A] focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="glass order-1 flex min-h-[70vh] flex-col rounded-[1.75rem] lg:order-2">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet to-amethyst shadow-[0_0_30px_rgba(114,86,216,.5)]"><Sparkles className="h-5 w-5" /></span>
            <div><p className="font-display text-2xl leading-none">AURA</p><p className="text-xs text-slate">Your Cosmic Companion</p></div>
          </div>
          <div className="flex items-center gap-3">
            <select aria-label="Answer language" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="rounded-full border hairline bg-navy px-3 py-1.5 text-xs text-moon">{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <span className="rounded-full bg-gold/10 px-3 py-1.5 text-xs text-gold">{bal} left</span>
          </div>
        </header>
        {(!aiConfigured || !aiConsent) && (
          <p className="mx-6 mt-4 rounded-xl border hairline bg-surface/50 px-4 py-2.5 text-xs text-slate">
            {!aiConfigured ? "AI language generation isn't configured on this server, so AURA answers with VYOMIRA's rule engine — every statement still comes straight from your chart." : <>AI processing is off, so AURA answers with the rule engine. <Link href="/dashboard/settings" className="text-amethyst underline">Enable in Settings</Link></>}
          </p>
        )}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6" aria-live="polite">
          {msgs.length === 0 && (
            <div className="py-6">
              <p className="font-display text-3xl">What would you like to understand?</p>
              <p className="mt-2 text-sm text-slate">AURA answers from your computed chart and shows the factors behind every answer.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {Object.entries(SUGGESTIONS).map(([topic, qs]) => (
                  <div key={topic}>
                    <p className="mb-2 text-[11px] tracking-[0.2em] text-gold uppercase">{topic}</p>
                    {qs.map((x) => <button key={x} onClick={() => send(x)} className="mb-2 block w-full rounded-xl border hairline px-3.5 py-2.5 text-left text-sm text-slate hover:border-amethyst/40 hover:text-moon">{x}</button>)}
                  </div>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-violet/25 px-4 py-3 text-sm">{m.content}</div>
                ) : m.pending ? (
                  <div className="flex items-center gap-3 text-sm text-slate"><Loader2 className="h-4 w-4 animate-spin text-amethyst" /> Consulting your chart…</div>
                ) : (
                  <div className="max-w-[95%]">
                    <div className="prose-aura rounded-2xl rounded-tl-sm border hairline bg-navy/50 px-5 py-4 text-[15px] text-moon/90" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate">
                      {m.evidence && m.evidence.factors?.length > 0 && <button onClick={() => setOpenEv(openEv === m.id ? null : m.id)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-moon/5 hover:text-moon"><Layers className="h-3.5 w-3.5" /> Chart factors</button>}
                      <button aria-label="Helpful" onClick={() => feedback(m.id, { rating: 1 })} className={cn("rounded-full p-1.5 hover:bg-moon/5", m.rating === 1 && "text-gold")}><ThumbsUp className="h-3.5 w-3.5" /></button>
                      <button aria-label="Not helpful" onClick={() => feedback(m.id, { rating: -1 })} className={cn("rounded-full p-1.5 hover:bg-moon/5", m.rating === -1 && "text-[#F0A08A]")}><ThumbsDown className="h-3.5 w-3.5" /></button>
                      <button aria-label="Report a problem" onClick={() => feedback(m.id, { report: true })} className={cn("rounded-full p-1.5 hover:bg-moon/5", m.reported && "text-[#F0A08A]")}><Flag className="h-3.5 w-3.5" /></button>
                      <button aria-label="Save reading" onClick={() => save(m.id)} className="rounded-full p-1.5 hover:bg-moon/5"><Bookmark className="h-3.5 w-3.5" /></button>
                      <span className="ml-2 text-[10px] tracking-wide text-slate/60">{m.validation === "passed" ? "AI · fact-checked" : m.validation === "guardrail" ? "care response · not charged" : m.validation === "cached" ? "repeat · not charged" : "rule engine"}</span>
                    </div>
                    {openEv === m.id && m.evidence && (
                      <div className="mt-3 rounded-2xl border border-amethyst/25 bg-violet/5 p-4 text-sm">
                        <p className="text-[11px] tracking-[0.2em] text-amethyst uppercase">{m.evidence.topicLabel} · {m.evidence.rulesVersion} · {m.evidence.computationVersion}</p>
                        <ul className="mt-3 space-y-3">{m.evidence.factors.map((f) => <li key={f.id}><p className="text-moon">{f.statement}</p><p className="text-slate">{f.interpretation}</p></li>)}</ul>
                        {m.evidence.timing?.length > 0 && <><p className="mt-4 text-[11px] tracking-[0.2em] text-amethyst uppercase">Timing referenced</p><ul className="mt-2 space-y-1 text-slate">{m.evidence.timing.map((t) => <li key={t.label + t.start}>{t.label}: {t.start.slice(0, 10)}{t.end !== t.start ? ` → ${t.end.slice(0, 10)}` : ""}</li>)}</ul></>}
                        {m.evidence.notes?.length > 0 && <p className="mt-3 text-xs text-gold/80">{m.evidence.notes.join(" ")}</p>}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
        {error && (
          <div role="status" className={cn("mx-6 mb-3 rounded-xl px-4 py-3 text-sm", error.upsell ? "border border-gold/40 bg-gold/10 text-gold" : "border hairline bg-surface/60 text-slate")}>
            {error.text} {error.upsell && <Link href="/dashboard/billing" className="ml-1 underline">See packs →</Link>}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(q); }} className="flex gap-2 border-t hairline p-4">
          <label htmlFor="aura-q" className="sr-only">Ask AURA</label>
          <textarea id="aura-q" rows={1} value={q} maxLength={600} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }} placeholder={lang === "hi" ? "अपनी कुंडली के बारे में पूछें…" : "Ask about your chart…"} className="field resize-none" />
          <button className="btn-primary !px-4" disabled={busy || q.trim().length < 3} aria-label="Send">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
        </form>
        <p className="px-6 pb-4 text-[11px] text-slate/70">Traditional interpretations for reflection — not medical, legal or financial advice. In crisis? Call Tele-MANAS 14416 (India).</p>
      </section>
    </div>
  );
}
