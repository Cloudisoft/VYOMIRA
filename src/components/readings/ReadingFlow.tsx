"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, FlaskConical, Trash2, Sparkles, Download, RefreshCw, Camera, ShieldCheck } from "lucide-react";
import { ReportView, LoShuGrid } from "./ReportView";
import { TarotBack, TarotFace } from "./TarotCard";
import { PICK_POOL, SPREADS, type SpreadId } from "@/lib/readings/tarot";
import type { ReportDoc } from "@/lib/readings/report";
import { HandMap } from "./HandMap";
import { rui } from "@/lib/readings/ui-strings";
import { positionL } from "@/lib/readings/tarot";
import type { RLang } from "@/lib/readings/lang";
import type { PalmHand } from "@/lib/readings/palm";

type Img = { side: string; width: number; height: number; quality: { ok: boolean; issues: string[] } | null };
export interface FlowData {
  reading: { id: string; category: string; productId: string; tier: string; title: string; status: string; error: string | null; result: Record<string, unknown> | null; drawn: { position: string; cardId: string; reversed: boolean; name?: string }[] | null; input: Record<string, string> | null };
  images: Img[];
  hasCredit: boolean;
}

const post = (url: string, body?: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

export function ReadingFlow({ initial, price, lang = "en" }: { initial: FlowData; price: string; lang?: RLang }) {
  const t = rui(lang);
  const router = useRouter();
  const search = useSearchParams();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [testPay, setTestPay] = useState<string | null>(null);
  const r = d.reading;
  const base = `/api/readings/service/${r.id}`;

  const refresh = useCallback(async () => {
    const res = await fetch(base, { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, [base]);

  const generate = useCallback(async () => {
    setBusy(true); setMsg(null);
    setD((x) => ({ ...x, reading: { ...x.reading, status: "GENERATING" } }));
    const res = await post(`${base}/generate`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error ?? "Something went wrong.");
    else if (j.error) setMsg(j.error);
    await refresh();
    setBusy(false);
  }, [base, refresh]);

  // Returning from PayU: confirm server-to-server, then continue.
  const payu = search.get("payu");
  const confirmed = useRef(false);
  useEffect(() => {
    if (!payu || confirmed.current || r.status !== "AWAITING_PAYMENT") return;
    confirmed.current = true;
    (async () => {
      setMsg(t.confirming);
      for (let i = 0; i < 8; i++) {
        const res = await post("/api/payments/payu/confirm", { paymentId: payu });
        const j = res.ok ? await res.json() : { status: "error" };
        if (j.status === "PAID") { setMsg(null); await refresh(); router.replace(`/dashboard/readings/${r.id}`); return; }
        if (j.status === "FAILED") { setMsg(t.payFailed); return; }
        await new Promise((res2) => setTimeout(res2, 2500));
      }
      setMsg(t.payPending);
    })();
  }, [payu, r.status, r.id, refresh, router, t]);

  // Numerology starts as soon as it's paid; polling while generating elsewhere.
  useEffect(() => {
    if (r.status === "PAID" && r.category === "numerology" && !busy) { const t = setTimeout(() => void generate(), 0); return () => clearTimeout(t); }
    if (r.status === "GENERATING" && !busy) { const t = setTimeout(refresh, 3000); return () => clearTimeout(t); }
  }, [r.status, r.category, busy, generate, refresh]);

  const pay = async (useCredit = false) => {
    setBusy(true); setMsg(null);
    const res = await post(`${base}/checkout`, { useCredit });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(j.error ?? "Could not start checkout.");
    if (j.unlocked) return refresh();
    if (j.provider === "test") return setTestPay(j.paymentId);
    if (j.checkoutUrl) window.location.href = j.checkoutUrl;
  };
  const simulate = async (outcome: "success" | "failure") => {
    if (!testPay) return;
    setBusy(true);
    await post("/api/payments/test-complete", { paymentId: testPay, outcome });
    setTestPay(null); setBusy(false);
    if (outcome === "failure") setMsg(t.payFailed);
    await refresh();
  };
  const remove = async () => {
    if (!confirm(t.delConfirm)) return;
    const res = await fetch(base, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/readings");
  };

  const needsPhotos = r.category === "palmistry" && (() => { const hands = r.input?.hands; const need = hands === "both" ? ["left", "right"] : [hands]; return need.some((s) => !d.images.find((i) => i.side === s)); })();
  const doc = (r.result as { report?: ReportDoc } | null)?.report;

  return (
    <div className="space-y-8">
      {msg && <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{msg}</p>}

      {r.category === "palmistry" && ["AWAITING_PAYMENT", "PAID", "NEEDS_PHOTO", "FAILED"].includes(r.status) && (
        <PalmUpload lang={lang} readingId={r.id} hands={r.input?.hands ?? "right"} dominant={r.input?.dominant ?? "right"} images={d.images} onChange={refresh}
          retake={r.status === "NEEDS_PHOTO" ? ((r.result as { retake?: string[] } | null)?.retake ?? []) : []} />
      )}

      {r.status === "AWAITING_PAYMENT" && (
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="font-display text-2xl">{t.unlockTitle}</h2>
          <p className="mt-1 text-sm text-slate">{t.unlockText}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {d.hasCredit && <button className="btn-primary" disabled={busy} onClick={() => pay(true)}><Sparkles className="h-4 w-4" /> {t.useCredit}</button>}
            <button className={d.hasCredit ? "btn-ghost" : "btn-primary"} disabled={busy || needsPhotos} onClick={() => pay(false)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.pay(price)}</button>
            {needsPhotos && <span className="text-xs text-slate">{t.photosFirst(r.input?.hands === "both")}</span>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> {t.payNote}</p>
        </div>
      )}

      {r.status === "PAID" && r.category === "tarot" && <TarotPicker lang={lang} readingId={r.id} spread={r.tier as SpreadId} onDrawn={generate} />}
      {r.status === "PAID" && r.category === "palmistry" && (
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={busy || needsPhotos} onClick={generate}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.analyse}</button>
          {needsPhotos && <span className="text-xs text-slate">{t.missingPhoto}</span>}
        </div>
      )}

      {r.status === "GENERATING" && (
        <div className="glass flex items-center gap-4 rounded-[1.5rem] p-6">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
          <div><p className="font-display text-xl">{t.working[r.category]}</p><p className="text-sm text-slate">{t.workingNote}</p></div>
        </div>
      )}

      {(r.status === "FAILED" || r.status === "NEEDS_PHOTO") && (
        <div className="glass rounded-[1.5rem] p-6">
          <p className="text-moon">{r.status === "NEEDS_PHOTO" ? t.needPhoto : r.error ?? t.failed}</p>
          <p className="mt-1 text-sm text-slate">{t.noCharge}</p>
          <button className="btn-primary mt-4" disabled={busy || needsPhotos} onClick={generate}><RefreshCw className="h-4 w-4" /> {t.retry}</button>
        </div>
      )}

      {r.category === "tarot" && r.drawn && r.status !== "PAID" && <TarotSpreadView lang={lang} spread={r.tier as SpreadId} cards={r.drawn} />}

      {r.status === "READY" && doc && (
        <>
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/aura?mode=${r.category}&draft=${encodeURIComponent(t.aura[r.category])}`} className="btn-primary !py-2.5 text-sm"><Sparkles className="h-4 w-4" /> {t.askAura}</Link>
            <a href={`${base}/pdf`} className="btn-ghost !py-2.5 text-sm"><Download className="h-4 w-4" /> {t.pdf}</a>
            {r.category === "palmistry" && d.images.length > 0 && <button className="btn-ghost !py-2.5 text-sm" onClick={async () => { await fetch(`${base}/images`, { method: "DELETE" }); await refresh(); }}><Camera className="h-4 w-4" /> {t.delPhotos}</button>}
          </div>
          {r.category === "palmistry" && (r.result as { hands?: PalmHand[] }).hands && (
            <section className="glass rounded-[1.5rem] p-6 sm:p-8" aria-labelledby="handmap-h">
              <h2 id="handmap-h" className="font-display text-3xl">{t.handMap}</h2>
              <p className="mt-1 text-sm text-slate">{t.handMapNote}</p>
              <div className={`mt-6 grid gap-10 ${(r.result as { hands: PalmHand[] }).hands.filter((h) => h.isPalm).length > 1 ? "2xl:grid-cols-2" : ""}`}>
                {(r.result as { hands: PalmHand[] }).hands.filter((h) => h.isPalm).map((h) => <HandMap key={h.side} hand={h} lang={lang} dominant={r.input?.dominant} photoUrl={d.images.find((i) => i.side === h.side) ? `${base}/images/${h.side}` : undefined} />)}
              </div>
            </section>
          )}
          <div className="glass rounded-[1.5rem] p-6 sm:p-8">
            <ReportView lang={lang} doc={doc} extra={r.category === "numerology" ? { loshu: <LoShuGrid lang={lang} grid={(r.result as { profile: { loShu: { grid: { n: number; count: number }[][] } } }).profile.loShu.grid} /> } : undefined} />
          </div>
        </>
      )}

      <button onClick={remove} className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> {t.del}</button>

      {testPay && (
        <div role="dialog" aria-modal="true" aria-labelledby="tp-title" className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-6 backdrop-blur">
          <div className="glass w-full max-w-md rounded-[1.5rem] p-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-violet/20 px-3 py-1 text-xs text-amethyst"><FlaskConical className="h-3.5 w-3.5" /> LOCAL TEST MODE</p>
            <h2 id="tp-title" className="mt-4 font-display text-3xl">Payment simulator</h2>
            <p className="mt-2 text-sm text-slate">{r.title} · {price}. No money moves.</p>
            <div className="mt-6 flex gap-3">
              <button className="btn-primary flex-1" onClick={() => simulate("success")} disabled={busy}>Simulate success</button>
              <button className="btn-ghost flex-1" onClick={() => simulate("failure")} disabled={busy}>Simulate failure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TarotSpreadView({ spread, cards, lang }: { spread: SpreadId; cards: { position: string; cardId: string; reversed: boolean }[]; lang: RLang }) {
  const [flipped, setFlipped] = useState(0);
  useEffect(() => {
    if (flipped >= cards.length) return;
    const t = setTimeout(() => setFlipped((f) => f + 1), flipped === 0 ? 350 : 650);
    return () => clearTimeout(t);
  }, [flipped, cards.length]);
  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
      {cards.map((c, i) => (
        <figure key={c.position} className="w-[30%] max-w-[150px] min-w-[96px] text-center">
          <div className="flip-scene">
            <div className={`flip-card aspect-[3/5] ${i < flipped ? "is-flipped" : ""}`}>
              <div className="flip-face"><TarotBack className="h-full w-full drop-shadow-[0_10px_30px_rgba(114,86,216,.35)]" /></div>
              <div className="flip-face back-side"><TarotFace cardId={c.cardId} reversed={c.reversed} className="h-full w-full drop-shadow-[0_10px_30px_rgba(232,201,139,.25)]" /></div>
            </div>
          </div>
          <figcaption className="mt-2 text-xs tracking-wide text-gold">{positionL(spread, c.position, lang).label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function TarotPicker({ readingId, spread, onDrawn, lang }: { readingId: string; spread: SpreadId; onDrawn: () => void; lang: RLang }) {
  const t = rui(lang);
  const need = SPREADS[spread].positions.length;
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const slots = useMemo(() => Array.from({ length: PICK_POOL }, (_, i) => i), []);
  const toggle = (i: number) => setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < need ? [...p, i] : p));
  const submit = async () => {
    setBusy(true); setErr(null);
    const res = await post(`/api/readings/service/${readingId}/draw`, { picks });
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error ?? t.failed); setBusy(false); return; }
    onDrawn();
  };
  const nextPos = SPREADS[spread].positions[picks.length];
  const next = nextPos ? positionL(spread, nextPos.id, lang) : null;
  return (
    <div className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">{t.choose(need)}</h2>
      <p className="mt-1 text-sm text-slate">{t.chooseText}{next && <> {t.next}: <span className="text-gold">{next.label}</span>.</>}</p>
      <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-11" role="group" aria-label="Face-down cards">
        {slots.map((i) => {
          const order = picks.indexOf(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} aria-pressed={order >= 0} aria-label={order >= 0 ? t.chosenFor(i + 1, positionL(spread, SPREADS[spread].positions[order].id, lang).label) : t.faceDown(i + 1)}
              className={`deal-in relative rounded-lg transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-gold ${order >= 0 ? "-translate-y-3 ring-2 ring-gold" : "hover:-translate-y-1.5"}`}
              style={{ animationDelay: `${i * 28}ms`, ["--r" as string]: `${((i % 5) - 2) * 1.2}deg` }}>
              <TarotBack className="w-full" />
              {order >= 0 && <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-gold px-1.5 text-[10px] font-semibold text-[#1a1407]">{order + 1}</span>}
            </button>
          );
        })}
      </div>
      {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
      <button className="btn-primary mt-6" disabled={picks.length !== need || busy} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.reveal}</button>
    </div>
  );
}

function PalmUpload({ readingId, hands, dominant, images, onChange, retake, lang }: { readingId: string; hands: string; dominant: string; images: Img[]; onChange: () => void; retake: string[]; lang: RLang }) {
  const t = rui(lang);
  const sides = hands === "both" ? ["left", "right"] : [hands];
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const upload = async (side: string, f: File | undefined) => {
    if (!f) return;
    setBusy(side); setErr((e) => ({ ...e, [side]: "" }));
    const fd = new FormData(); fd.append("file", f); fd.append("side", side);
    const res = await fetch(`/api/readings/service/${readingId}/images`, { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setErr((e) => ({ ...e, [side]: j.error ?? t.failed }));
    setBusy(null);
    onChange();
  };
  return (
    <div className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">{t.photosTitle(sides.length > 1)}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
      {retake.length > 0 && <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold"><p className="font-semibold">{t.retake}</p><ul className="mt-1 list-disc pl-5">{retake.map((t) => <li key={t}>{t}</li>)}</ul></div>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {sides.map((side) => {
          const img = images.find((i) => i.side === side);
          return (
            <label key={side} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-navy/40 p-6 text-center hover:bg-navy/60">
              <Camera className="h-6 w-6 text-gold" />
              <span className="font-display text-lg">{t.hand(side, side === dominant)}</span>
              <span className="text-xs text-slate">{busy === side ? t.checking : img ? t.uploaded(img.width, img.height) : t.tapPhoto}</span>
              {img?.quality && !img.quality.ok && <span className="text-xs text-gold">{img.quality.issues.join(" ")}</span>}
              {err[side] && <span className="text-xs text-rose-300">{err[side]}</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" className="sr-only" onChange={(e) => upload(side, e.target.files?.[0])} />
            </label>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> {t.photoPrivacy}</p>
    </div>
  );
}
