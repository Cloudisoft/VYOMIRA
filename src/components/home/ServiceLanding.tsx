import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { getConfig } from "@/server/config";
import { chargePrice, rupees, type ReadingCategory } from "@/lib/pricing";
import { breadcrumbLd, faqLd, ldScript, abs, SITE } from "@/lib/seo";
import { PathArt } from "./PathArt";

export interface LandingCopy {
  category: Exclude<ReadingCategory, "bundle">;
  eyebrow: string;
  title: string;
  intro: string;
  steps: [string, string][];
  includes: string[];
  trust: string[];
  faqs: { q: string; a: string }[];
}

export async function ServiceLanding({ c }: { c: LandingCopy }) {
  const [pricing, flags] = await Promise.all([getConfig("pricing"), getConfig("flags")]);
  const open = flags[c.category] !== false;
  const products = pricing.readings.filter((p) => p.active && p.category === c.category);
  const bundle = pricing.readings.find((p) => p.active && p.category === "bundle");
  const start = `/dashboard/readings/new?category=${c.category}`;
  const path = `/${c.category}`;
  const ld = [
    breadcrumbLd([["Home", "/"], [c.eyebrow, path]]),
    faqLd(c.faqs),
    { "@context": "https://schema.org", "@type": "Service", name: `${c.eyebrow} reading — ${SITE.name}`, provider: { "@id": abs("/#organization") }, url: abs(path), areaServed: "IN", description: c.intro, offers: products.map((p) => ({ "@type": "Offer", name: p.name, price: String(chargePrice(p) / 100), priceCurrency: "INR" })) },
  ];
  return (
    <div className="relative px-6 pt-32 pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(ellipse_55%_80%_at_50%_0%,rgba(114,86,216,.2),transparent)]" />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate"><Link href="/" className="hover:text-moon">Home</Link> / <span>{c.eyebrow}</span></nav>
        <header className="mt-6 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="hero-in">
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">{c.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">{c.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {open ? <Link href={start} className="btn-primary">Start my reading</Link> : <span className="rounded-full border hairline px-5 py-3 text-sm text-slate">Opening soon — we release it once it meets our accuracy bar</span>}
              {products.length > 0 && open && <span className="text-sm text-slate">From <span className="text-gold">{rupees(Math.min(...products.map(chargePrice)))}</span> · one-time, no subscription</span>}
            </div>
          </div>
          <PathArt kind={c.category} className="mx-auto h-64 w-80 max-w-full" />
        </header>

        <section className="mt-24" aria-labelledby="how-h">
          <h2 id="how-h" className="font-display text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-4">
            {c.steps.map(([t, d], i) => <li key={t} className="glass reveal-up rounded-[1.5rem] p-6" style={{ animationDelay: `${i * 80}ms` }}><span className="font-display text-3xl text-gold">0{i + 1}</span><p className="mt-3 font-display text-xl">{t}</p><p className="mt-2 text-sm text-slate">{d}</p></li>)}
          </ol>
        </section>

        {products.length > 0 && (
          <section className="mt-24" aria-labelledby="price-h">
            <h2 id="price-h" className="font-display text-4xl">Choose your depth</h2>
            <div className={`mt-8 grid gap-5 ${products.length > 3 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
              {products.map((p) => (
                <div key={p.id} className="glass flex flex-col rounded-[1.5rem] p-6">
                  <p className="font-display text-2xl">{p.name}</p>
                  <p className="mt-2 flex-1 text-sm text-slate">{p.description}</p>
                  <p className="mt-5"><span className="font-display text-3xl text-gold">{rupees(chargePrice(p))}</span>{chargePrice(p) < p.priceMinor && <><span className="ml-2 text-slate line-through">{rupees(p.priceMinor)}</span><span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] tracking-widest text-gold">LAUNCH PRICE</span></>}</p>
                  {open && <Link href={`${start}`} className="btn-ghost mt-5 !py-2.5 text-sm">Choose</Link>}
                </div>
              ))}
            </div>
            {bundle && <p className="mt-6 text-sm text-slate">Want all three? The <span className="text-moon">{bundle.name}</span> includes palm, numerology and a three-card tarot reading plus Combined Insights for <span className="text-gold">{rupees(chargePrice(bundle))}</span>. <Link href="/dashboard/readings" className="text-gold hover:underline">See the bundle</Link></p>}
          </section>
        )}

        <section className="mt-24 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">What you get</h2>
            <ul className="mt-6 space-y-3">{c.includes.map((x) => <li key={x} className="flex gap-3 text-moon/85"><Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" />{x}</li>)}</ul>
          </div>
          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="flex items-center gap-2 font-display text-3xl"><ShieldCheck className="h-6 w-6 text-gold" /> Accuracy &amp; trust</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate">{c.trust.map((x) => <li key={x}>• {x}</li>)}</ul>
          </div>
        </section>

        <section className="mt-24 max-w-3xl" aria-labelledby="faq-h">
          <h2 id="faq-h" className="font-display text-4xl">Questions</h2>
          <div className="mt-6 divide-y divide-[rgba(165,139,255,.14)] border-y hairline">
            {c.faqs.map((f) => <details key={f.q} className="group py-5"><summary className="cursor-pointer list-none font-display text-xl marker:hidden">{f.q}<span className="float-right text-gold transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 text-slate">{f.a}</p></details>)}
          </div>
        </section>
      </div>
      {ld.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={ldScript(d)} />)}
    </div>
  );
}
