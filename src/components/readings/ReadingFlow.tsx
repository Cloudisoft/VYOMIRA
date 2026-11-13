"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, FlaskConical, Trash2, Sparkles, Download, RefreshCw, Camera, ShieldCheck } from "lucide-react";
import { ReportView, LoShuGrid } from "./ReportView";
import { TarotBack, TarotFace } from "./TarotCard";
import { PICK_POOL, SPREADS, type SpreadId } from "@/lib/readings/tarot";
import type { ReportDoc } from "@/lib/readings/report";

type Img = { side: string; width: number; height: number; quality: { ok: boolean; issues: string[] } | null };
export interface FlowData {
  reading: { id: string; category: string; productId: string; tier: string; title: string; status: string; error: string | null; result: Record<string, unknown> | null; drawn: { position: string; cardId: string; reversed: boolean; name?: string }[] | null; input: Record<string, string> | null };
  images: Img[];
  hasCredit: boolean;
}

const post = (url: string, body?: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

export function ReadingFlow({ initial, price }: { initial: FlowData; price: string }) {
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
      setMsg("Confirming your payment with PayU…");
      for (let i = 0; i < 8; i++) {
        const res = await post("/api/payments/payu/confirm", { paymentId: payu });
        const j = res.ok ? await res.json() : { status: "error" };
        if (j.status === "PAID") { setMsg(null); await refresh(); router.replace(`/dashboard/readings/${r.id}`); return; }
        if (j.status === "FAILED") { setMsg("The payment didn't go through. You have not been charged."); return; }
        await new Promise((res2) => setTimeout(res2, 2500));
      }
      setMsg("PayU is still processing this payment. This reading unlocks automatically once it's confirmed.");
    })();
  }, [payu, r.status, r.id, refresh, router]);

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
    if (outcome === "failure") setMsg("Simulated a failed payment. You have not been charged.");
    await refresh();
  };
  const remove = async () => {
    if (!confirm("Delete this reading permanently? Photos, inputs and the report will be erased.")) return;
    const res = await fetch(base, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/readings");
  };

  const needsPhotos = r.category === "palmistry" && (() => { const hands = r.input?.hands; const need = hands === "both" ? ["left", "right"] : [hands]; return need.some((s) => !d.images.find((i) => i.side === s)); })();
  const doc = (r.result as { report?: ReportDoc } | null)?.report;

  return (
    <div className="space-y-8">
      {msg && <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{msg}</p>}

      {r.category === "palmistry" && ["AWAITING_PAYMENT", "PAID", "NEEDS_PHOTO", "FAILED"].includes(r.status) && (
        <PalmUpload readingId={r.id} hands={r.input?.hands ?? "right"} dominant={r.input?.dominant ?? "right"} images={d.images} onChange={refresh}
          retake={r.status === "NEEDS_PHOTO" ? ((r.result as { retake?: string[] } | null)?.retake ?? []) : []} />
      )}

      {r.status === "AWAITING_PAYMENT" && (
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="font-display text-2xl">Unlock this reading</h2>
          <p className="mt-1 text-sm text-slate">One-time payment. No subscription. Your reading stays in My Readings — reopen it any time without paying again.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {d.hasCredit && <button className="btn-primary" disabled={busy} onClick={() => pay(true)}><Sparkles className="h-4 w-4" /> Use my bundle credit</button>}
            <button className={d.hasCredit ? "btn-ghost" : "btn-primary"} disabled={busy || needsPhotos} onClick={() => pay(false)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay {price} securely</button>
            {needsPhotos && <span className="text-xs text-slate">Upload your palm photo{r.input?.hands === "both" ? "s" : ""} first — we check them before you pay.</span>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Payments by PayU. Unlocked only after PayU confirms the payment to our server.</p>
        </div>
      )}

      {r.status === "PAID" && r.category === "tarot" && <TarotPicker readingId={r.id} spread={r.tier as SpreadId} onDrawn={generate} />}
      {r.status === "PAID" && r.category === "palmistry" && (
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={busy || needsPhotos} onClick={generate}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Analyse my palm</button>
          {needsPhotos && <span className="text-xs text-slate">Upload the missing photo first.</span>}
        </div>
      )}

      {r.status === "GENERATING" && (
        <div className="glass flex items-center gap-4 rounded-[1.5rem] p-6">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
          <div><p className="font-display text-xl">{r.category === "palmistry" ? "Studying your palm…" : r.category === "tarot" ? "Reading your cards…" : "Calculating your numbers…"}</p><p className="text-sm text-slate">This usually takes 10–60 seconds. You can leave this page — the reading will be waiting in My Readings.</p></div>
        </div>
      )}

      {(r.status === "FAILED" || r.status === "NEEDS_PHOTO") && (
        <div className="glass rounded-[1.5rem] p-6">
          <p className="text-moon">{r.status === "NEEDS_PHOTO" ? "We need a clearer photo before we can read your palm reliably." : r.error ?? "This reading couldn't be completed."}</p>
          <p className="mt-1 text-sm text-slate">You won&apos;t be charged again.</p>
          <button className="btn-primary mt-4" disabled={busy || needsPhotos} onClick={generate}><RefreshCw className="h-4 w-4" /> Try again</button>
        </div>
      )}

      {r.category === "tarot" && r.drawn && r.status !== "PAID" && <TarotSpreadView spread={r.tier as SpreadId} cards={r.drawn} />}

      {r.status === "READY" && doc && (
        <>
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/aura?mode=${r.category}&draft=${encodeURIComponent(r.category === "tarot" ? "What should I focus on after this tarot reading?" : r.category === "numerology" ? "How does my Life Path show up in my career?" : "What does my palm say about my strengths?")}`} className="btn-primary !py-2.5 text-sm"><Sparkles className="h-4 w-4" /> Ask AURA about this</Link>
            <a href={`${base}/pdf`} className="btn-ghost !py-2.5 text-sm"><Download className="h-4 w-4" /> Download PDF</a>
            {r.category === "palmistry" && d.images.length > 0 && <button className="btn-ghost !py-2.5 text-sm" onClick={async () => { await fetch(`${base}/images`, { method: "DELETE" }); await refresh(); }}><Camera className="h-4 w-4" /> Delete my palm photos</button>}
          </div>
          <div className="glass rounded-[1.5rem] p-6 sm:p-8">
            <ReportView doc={doc} extra={r.category === "numerology" ? { loshu: <LoShuGrid grid={(r.result as { profile: { loShu: { grid: { n: number; count: number }[][] } } }).profile.loShu.grid} /> } : undefined} />
          </div>
        </>
      )}

      <button onClick={remove} className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Delete this reading</button>

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

function TarotSpreadView({ spread, cards }: { spread: SpreadId; cards: { position: string; cardId: string; reversed: boolean }[] }) {
  const pos = SPREADS[spread].positions;
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
          <figcaption className="mt-2 text-xs tracking-wide text-gold">{pos.find((p) => p.id === c.position)?.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function TarotPicker({ readingId, spread, onDrawn }: { readingId: string; spread: SpreadId; onDrawn: () => void }) {
  const need = SPREADS[spread].positions.length;
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const slots = useMemo(() => Array.from({ length: PICK_POOL }, (_, i) => i), []);
  const toggle = (i: number) => setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < need ? [...p, i] : p));
  const submit = async () => {
    setBusy(true); setErr(null);
    const res = await post(`/api/readings/service/${readingId}/draw`, { picks });
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error ?? "Couldn't record your cards."); setBusy(false); return; }
    onDrawn();
  };
  const next = SPREADS[spread].positions[picks.length];
  return (
    <div className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">Choose {need === 1 ? "your card" : `${need} cards`}</h2>
      <p className="mt-1 text-sm text-slate">Hold your question in mind and pick the cards that draw you. The deck was shuffled securely on our server before you arrived.{next && <> Next: <span className="text-gold">{next.label}</span>.</>}</p>
      <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-11" role="group" aria-label="Face-down cards">
        {slots.map((i) => {
          const order = picks.indexOf(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} aria-pressed={order >= 0} aria-label={order >= 0 ? `Card ${i + 1}, chosen for ${SPREADS[spread].positions[order].label}` : `Face-down card ${i + 1}`}
              className={`deal-in relative rounded-lg transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-gold ${order >= 0 ? "-translate-y-3 ring-2 ring-gold" : "hover:-translate-y-1.5"}`}
              style={{ animationDelay: `${i * 28}ms`, ["--r" as string]: `${((i % 5) - 2) * 1.2}deg` }}>
              <TarotBack className="w-full" />
              {order >= 0 && <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-gold px-1.5 text-[10px] font-semibold text-[#1a1407]">{order + 1}</span>}
            </button>
          );
        })}
      </div>
      {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
      <button className="btn-primary mt-6" disabled={picks.length !== need || busy} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Reveal my cards</button>
    </div>
  );
}

function PalmUpload({ readingId, hands, dominant, images, onChange, retake }: { readingId: string; hands: string; dominant: string; images: Img[]; onChange: () => void; retake: string[] }) {
  const sides = hands === "both" ? ["left", "right"] : [hands];
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const upload = async (side: string, f: File | undefined) => {
    if (!f) return;
    setBusy(side); setErr((e) => ({ ...e, [side]: "" }));
    const fd = new FormData(); fd.append("file", f); fd.append("side", side);
    const res = await fetch(`/api/readings/service/${readingId}/images`, { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setErr((e) => ({ ...e, [side]: j.error ?? "Upload failed." }));
    setBusy(null);
    onChange();
  };
  return (
    <div className="glass rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl">Your palm photo{sides.length > 1 ? "s" : ""}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate">
        <li>Daylight or a bright room, no flash. Palm flat, facing the camera, filling most of the frame.</li>
        <li>Fingers together and slightly relaxed; include the wrist crease and fingertips.</li>
        <li>Hold the phone directly above, steady and in focus.</li>
      </ul>
      {retake.length > 0 && <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold"><p className="font-semibold">Please retake:</p><ul className="mt-1 list-disc pl-5">{retake.map((t) => <li key={t}>{t}</li>)}</ul></div>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {sides.map((side) => {
          const img = images.find((i) => i.side === side);
          return (
            <label key={side} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-navy/40 p-6 text-center hover:bg-navy/60">
              <Camera className="h-6 w-6 text-gold" />
              <span className="font-display text-lg capitalize">{side} hand{side === dominant ? " (dominant)" : ""}</span>
              <span className="text-xs text-slate">{busy === side ? "Checking photo…" : img ? `Uploaded ✓ ${img.width}×${img.height} — tap to replace` : "Tap to take or choose a photo"}</span>
              {img?.quality && !img.quality.ok && <span className="text-xs text-gold">{img.quality.issues.join(" ")}</span>}
              {err[side] && <span className="text-xs text-rose-300">{err[side]}</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" className="sr-only" onChange={(e) => upload(side, e.target.files?.[0])} />
            </label>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Photos are stripped of location data, encrypted, visible only to you, and can be deleted at any time.</p>
    </div>
  );
}
