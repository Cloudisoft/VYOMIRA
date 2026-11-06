"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Info, Send, Sparkles, Loader2 } from "lucide-react";
import { useSessionJSON } from "@/lib/use-session-json";
import { KundliExplorer } from "@/components/chart/KundliExplorer";
import { DashaTimeline } from "@/components/chart/DashaTimeline";
import { LifeGuideView } from "@/components/guide/LifeGuideView";
import { PREVIEW_KEY, type PreviewState } from "@/components/onboarding/Wizard";
import { activePeriods } from "@/lib/astro/dasha";
import { dms } from "@/lib/astro/math";
import { renderMarkdown } from "@/lib/markdown";
import { DICT, toLang, type Lang } from "@/lib/interpret/life-guide-i18n";
import { useSession } from "@/lib/auth-client";

const UI: Record<Lang, Record<string, string>> = {
  en: { title: "'s cosmic blueprint", lagna: "Rising sign", moon: "Moon sign", nak: "Nakshatra", sun: "Sun sign", md: "Life chapter now", unknown: "Unknown", exact: "needs exact time", rashi: "Rashi", unc: "uncertain", sid: "sidereal", ad: "phase", guide: "Your life, past · present · future", kundli: "Your Kundli in detail", dasha: "Planetary periods (Vimshottari Dasha)", balance: "Balance at birth", keep: "Keep your universe close.", keepSub: "Save this chart to your private dashboard — encrypted — and ask AURA your first question free.", save: "Save to my account", create: "Create free account & save", notReady: "Not ready? This preview disappears when you close the tab. Nothing has been stored.", ask: "Ask AURA", askSub: "Ask anything — answers come from your chart's timings, in simple words.", ph: "Ask about your chart…", q1: "How will my career be in the next 2 years?", q2: "When is a good time for marriage?", q3: "Is this a good time to start a business?", net: "Network error.", again: "Please try again.", none: "No chart yet", noneSub: "Your preview lives only in this browser tab. Enter your birth details to calculate it.", enter: "Enter birth details", switching: "Switching language…", mahadasha: "Mahadasha" },
  hi: { title: " की कॉस्मिक ब्लूप्रिंट", lagna: "लग्न", moon: "चंद्र राशि", nak: "नक्षत्र", sun: "सूर्य राशि", md: "वर्तमान जीवन-अध्याय", unknown: "अज्ञात", exact: "सटीक समय चाहिए", rashi: "राशि", unc: "अनिश्चित", sid: "निरयन", ad: "अंतर्दशा", guide: "आपका जीवन — अतीत · वर्तमान · भविष्य", kundli: "आपकी कुंडली विस्तार से", dasha: "ग्रह दशाएँ (विंशोत्तरी दशा)", balance: "जन्म के समय शेष दशा", keep: "अपना ब्रह्मांड अपने पास रखें।", keepSub: "इस कुंडली को अपने निजी डैशबोर्ड में सुरक्षित (एन्क्रिप्टेड) सहेजें और AURA से पहला प्रश्न मुफ़्त पूछें।", save: "मेरे खाते में सहेजें", create: "मुफ़्त खाता बनाएँ और सहेजें", notReady: "अभी तैयार नहीं? टैब बंद करते ही यह प्रीव्यू हट जाएगा। कुछ भी संग्रहीत नहीं हुआ है।", ask: "AURA से पूछें", askSub: "कुछ भी पूछें — उत्तर आपकी कुंडली के समय-संकेतों से, आसान शब्दों में।", ph: "अपनी कुंडली के बारे में पूछें…", q1: "अगले 2 साल में मेरा करियर कैसा रहेगा?", q2: "विवाह के लिए अच्छा समय कब है?", q3: "क्या यह व्यापार शुरू करने का अच्छा समय है?", net: "नेटवर्क त्रुटि।", again: "कृपया फिर से प्रयास करें।", none: "अभी कोई कुंडली नहीं", noneSub: "आपका प्रीव्यू केवल इसी ब्राउज़र टैब में रहता है। गणना के लिए जन्म विवरण दर्ज करें।", enter: "जन्म विवरण दर्ज करें", switching: "भाषा बदल रही है…", mahadasha: "महादशा" },
  hinglish: { title: " ki cosmic blueprint", lagna: "Lagna", moon: "Chandra rashi", nak: "Nakshatra", sun: "Surya rashi", md: "Abhi ka life chapter", unknown: "Pata nahi", exact: "exact time chahiye", rashi: "Rashi", unc: "pakka nahi", sid: "nirayan", ad: "antardasha", guide: "Aapki zindagi — beeta · abhi · aage", kundli: "Aapki kundli detail mein", dasha: "Grah dashayein (Vimshottari Dasha)", balance: "Janam ke samay bachi dasha", keep: "Apna brahmand apne paas rakhiye.", keepSub: "Is kundli ko apne private dashboard mein safe (encrypted) save kijiye aur AURA se pehla sawaal free poochiye.", save: "Mere account mein save karein", create: "Free account banaiye aur save kijiye", notReady: "Abhi ready nahi? Tab band karte hi yeh preview hat jayega. Kuch bhi store nahi hua hai.", ask: "AURA se poochiye", askSub: "Kuch bhi poochiye — jawaab aapki kundli ki timings se, aasaan shabdon mein.", ph: "Apni kundli ke baare mein poochiye…", q1: "Agle 2 saal mein mera career kaisa rahega?", q2: "Shaadi ke liye achha time kab hai?", q3: "Kya yeh business shuru karne ka achha time hai?", net: "Network error.", again: "Phir se try kijiye.", none: "Abhi koi kundli nahi", noneSub: "Aapka preview sirf isi browser tab mein rehta hai. Calculate karne ke liye birth details daaliye.", enter: "Birth details daaliye", switching: "Bhasha badal rahi hai…", mahadasha: "Mahadasha" },
};

export function PreviewClient() {
  const s = useSessionJSON<PreviewState>(PREVIEW_KEY);
  const { data: session } = useSession();
  const params = useSearchParams();
  const want = params.get("lang");
  const busy = useRef(false);

  // Switching language re-computes the preview in that language (nothing is stored server-side).
  useEffect(() => {
    if (!s || !want || busy.current) return;
    const target = toLang(want);
    if (target === toLang(s.birth.language) && s.guide?.lang === target) return;
    busy.current = true;
    const birth = { ...s.birth, language: target };
    fetch("/api/charts/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(birth) })
      .then(async (r) => {
        if (!r.ok) return;
        const j = await r.json();
        sessionStorage.setItem(PREVIEW_KEY, JSON.stringify({ ...s, birth, chart: j.chart, insight: j.insight, guide: j.guide ?? null }));
        window.dispatchEvent(new Event("vy-session"));
      })
      .finally(() => { busy.current = false; });
  }, [s, want]);

  const lang = toLang(s?.birth.language);
  const switching = Boolean(s && want && toLang(want) !== s.guide?.lang);
  const T = UI[lang];
  if (s === undefined) return <div className="mx-auto max-w-7xl px-6"><div className="h-96 animate-pulse rounded-3xl bg-surface/50" /></div>;
  if (s === null) return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-5xl">{T.none}</h1>
      <p className="mt-4 text-slate">{T.noneSub}</p>
      <Link href="/onboarding" className="btn-primary mt-8">{T.enter}</Link>
    </div>
  );
  const c = s.chart;
  const D = DICT[lang];
  const md = activePeriods(c.dasha, new Date(s.guide?.now ?? c.computation.calculatedAt));
  const saveHref = session ? "/onboarding/save" : `/sign-up?next=${encodeURIComponent("/onboarding/save")}`;
  const sign = (n: string) => { const i = DICT.en.signs.indexOf(n); return i >= 0 ? D.signs[i] : n; };
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24" lang={lang === "hi" ? "hi" : "en"}>
      <section className="py-10">
        <p className="eyebrow">Kundli · {c.computation.id}</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">{s.birth.fullName.split(" ")[0]}{T.title}</h1>
        <p className="mt-3 text-slate">{c.input.local} · {s.placeLabel} · {c.input.timeZone} ({c.input.utcOffset}) · UTC {c.input.utc.replace("T", " ").slice(0, 19)}</p>
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border hairline bg-[rgba(165,139,255,.14)] md:grid-cols-5">
          {[
            [T.lagna, c.lagna ? sign(c.lagna.signName) : T.unknown, c.lagna ? dms(c.lagna.degree) : T.exact],
            [T.moon, sign(c.moonSign.signName), c.confidence.moonSignStable ? T.rashi : T.unc],
            [T.nak, c.janmaNakshatra.name, `pada ${c.janmaNakshatra.pada}${c.confidence.nakshatraStable ? "" : ` · ${T.unc}`}`],
            [T.sun, sign(c.sunSign.signName), T.sid],
            [T.md, md.mahadasha ? D.planet[md.mahadasha.lord] : "—", md.antardasha ? `${D.planet[md.antardasha.lord]} ${T.ad}` : ""],
          ].map(([k, v, sub]) => (
            <div key={k} className="bg-navy p-5"><dt className="text-xs tracking-[0.2em] text-slate uppercase">{k}</dt><dd className="mt-2 font-display text-2xl">{v}</dd><dd className="text-xs text-slate">{sub}</dd></div>
          ))}
        </dl>
        {c.confidence.notes.length > 0 && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-gold/30 bg-gold/[.05] p-4 text-sm text-gold/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <ul className="space-y-1">{c.confidence.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
      </section>

      {s.guide && (
        <section className="mb-14" aria-label={T.guide}>
          <h2 className="mb-6 font-display text-4xl sm:text-5xl">{T.guide}</h2>
          {switching && <p className="mb-4 text-sm text-gold" role="status">{T.switching}</p>}
          <LifeGuideView g={s.guide} lang={lang} compact langHref={(l) => `/chart?lang=${l}`} askHref={() => saveHref} />
        </section>
      )}

      <section className="mb-10 grid gap-6 lg:grid-cols-[1fr]">
        <AskPreview birth={s.birth} T={T} />
      </section>

      <h2 className="mb-6 font-display text-4xl">{T.kundli}</h2>
      <KundliExplorer chart={c} />
      <section className="glass mt-6 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl">{T.dasha}</h2>
        <p className="mt-1 mb-6 text-sm text-slate">{T.balance}: {D.planet[c.dasha.balanceAtBirth.lord]} {c.dasha.balanceAtBirth.years}y {c.dasha.balanceAtBirth.months}m {c.dasha.balanceAtBirth.days}d</p>
        <DashaTimeline mahadashas={c.dasha.mahadashas} birthIso={c.input.utc} reliable={c.confidence.dashaTimingReliable} compact />
      </section>
      <section className="mt-10 overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[.08] via-surface/60 to-violet/10 p-8 text-center sm:p-12">
        <h2 className="font-display text-4xl sm:text-5xl">{T.keep}</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate">{T.keepSub}</p>
        <Link href={saveHref} className="btn-primary mt-8">{session ? T.save : T.create}</Link>
        <p className="mt-4 text-xs text-slate/80">{T.notReady}</p>
      </section>
    </div>
  );
}

function AskPreview({ birth, T }: { birth: PreviewState["birth"]; T: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [ans, setAns] = useState<{ answer?: string | null; guard?: string; error?: string } | null>(null);
  const ask = async (question: string) => {
    setQ(question); setLoading(true); setAns(null);
    try {
      const r = await fetch("/api/aura/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth, question }) });
      const j = await r.json();
      setAns(r.ok ? j : { error: j.error ?? T.again });
    } catch { setAns({ error: T.net }); } finally { setLoading(false); }
  };
  return (
    <div className="glass flex flex-col rounded-[1.75rem] p-6 sm:p-8">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-amethyst"><Sparkles className="h-4 w-4" /></span><p className="font-display text-2xl">{T.ask}</p></div>
      <p className="mt-2 text-sm text-slate">{T.askSub}</p>
      <div className="mt-4 flex flex-wrap gap-2">{[T.q1, T.q2, T.q3].map((x) => <button key={x} onClick={() => ask(x)} className="rounded-full border hairline px-3 py-1.5 text-xs text-slate hover:text-moon">{x}</button>)}</div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) ask(q); }}>
        <label htmlFor="q" className="sr-only">{T.ph}</label>
        <input id="q" className="field" placeholder={T.ph} value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary !px-4" aria-label={T.ask} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
      </form>
      <div className="prose-aura mt-5 flex-1 text-sm leading-relaxed" aria-live="polite">
        {ans?.guard && <p className="text-moon/90">{ans.guard}</p>}
        {ans?.error && <p className="text-[#F0A08A]">{ans.error}</p>}
        {ans?.answer && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(ans.answer) }} />}
      </div>
    </div>
  );
}
