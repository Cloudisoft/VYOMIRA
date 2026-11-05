import { Check } from "lucide-react";
import { chargeRegion } from "@/server/pricing-region";
import { formatMoney } from "@/lib/pricing";
import { SectionHeading, Reveal } from "@/components/ui/Reveal";
import { CountrySelect, BuyButton } from "./PricingClient";
import { cn } from "@/lib/utils";

export async function Pricing({ compact = false }: { compact?: boolean }) {
  const { pricing, country, key, region, inrOnly } = await chargeRegion();
  return (
    <section id="pricing" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        {!compact && <SectionHeading align="center" eyebrow="Transparent pricing" title="Start free. Ask more when you're ready." intro="Your complete Kundli is always free. One-time message packs or a monthly plan you can cancel anytime — no unlimited claims we can't honour." />}
        <Reveal className="mt-8 flex justify-center">
          <CountrySelect current={country} regionKey={key} currency={region.currency} />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Reveal>
            <div className="flex h-full flex-col rounded-[2rem] border hairline bg-surface/40 p-8">
              <h3 className="text-3xl">Free</h3>
              <p className="mt-1 text-sm text-slate">Your chart, always yours</p>
              <p className="mt-6 font-display text-5xl">{formatMoney(0, region)}</p>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {pricing.free.features.map((f) => <li key={f} className="flex gap-3 text-slate"><Check className="mt-0.5 h-4 w-4 shrink-0 text-amethyst" />{f}</li>)}
              </ul>
              <a href="/onboarding" className="btn-ghost mt-8">Reveal my chart</a>
            </div>
          </Reveal>
          {pricing.plans.map((p, i) => (
            <Reveal key={p.id} delay={0.1 * (i + 1)}>
              <div className={cn("relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8", p.highlight ? "border border-gold/50 bg-gradient-to-b from-gold/[.08] via-surface/60 to-surface/40 shadow-[0_30px_80px_-40px_rgba(216,180,119,.5)]" : "glass")}>
                {p.highlight && <span className="absolute top-6 right-6 rounded-full bg-gold/15 px-3 py-1 text-[10px] tracking-[0.2em] text-gold">MOST COMPLETE</span>}
                <h3 className="text-3xl">{p.name}</h3>
                <p className="mt-1 text-sm text-slate">{p.tagline}</p>
                <p className="mt-6 font-display text-5xl">{formatMoney(region.prices[p.id], region)}</p>
                <p className="mt-1 text-xs text-slate">one-time · {p.aiMessages} messages · ≈ {formatMoney(Math.round(region.prices[p.id] / p.aiMessages), region)} per message</p>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => <li key={f} className="flex gap-3 text-moon/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{f}</li>)}
                </ul>
                <BuyButton planId={p.id} highlight={p.highlight} label={`Get ${p.name}`} />
              </div>
            </Reveal>
          ))}
        </div>
        {inrOnly && <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-gold/90">International cards are charged in Indian rupees; your bank converts the amount to your currency.</p>}
        {pricing.subscriptions?.length > 0 && (
          <Reveal className="mt-14">
            <p className="text-center eyebrow">Monthly plans · cancel anytime</p>
            <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
              {pricing.subscriptions.map((p) => (
                <div key={p.id} className={cn("flex flex-col rounded-[2rem] p-8", p.highlight ? "border border-gold/50 bg-gradient-to-b from-gold/[.08] to-surface/40" : "glass")}>
                  <div className="flex items-baseline justify-between gap-3"><h3 className="text-3xl">{p.name}</h3><p className="font-display text-4xl">₹{p.priceMinor / 100}<span className="text-base text-slate">/month</span></p></div>
                  <p className="mt-1 text-sm text-slate">{p.tagline}</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">{p.features.map((f) => <li key={f} className="flex gap-3 text-moon/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{f}</li>)}</ul>
                  <BuyButton planId={p.id} highlight={p.highlight} label={`Subscribe to ${p.name}`} />
                </div>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-slate/80">Renews monthly via UPI Autopay or card mandate. We notify you before every charge. Monthly messages refresh each period and don't roll over.</p>
          </Reveal>
        )}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate/80">Prices include applicable taxes where required. Payments are processed by PayU; we never see or store your card details. A message is one AURA reply; guardrail responses, repeated identical questions and failed generations are never charged. See our <a className="underline" href="/legal/refunds">refund policy</a>.</p>
      </div>
    </section>
  );
}
