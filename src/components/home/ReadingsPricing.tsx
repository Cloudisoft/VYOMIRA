import Link from "next/link";
import { getConfig } from "@/server/config";
import { chargePrice, rupees } from "@/lib/pricing";

const LABEL = { numerology: "Numerology", tarot: "Tarot", palmistry: "Palmistry" } as const;

/** One-time reading prices (INR), straight from admin config. */
export async function ReadingsPricing() {
  const [pricing, flags] = await Promise.all([getConfig("pricing"), getConfig("flags")]);
  const cats = (Object.keys(LABEL) as (keyof typeof LABEL)[]).filter((c) => flags[c] !== false);
  const bundle = pricing.readings.find((p) => p.active && p.category === "bundle");
  if (!cats.length) return null;
  return (
    <section aria-labelledby="readings-pricing" className="mx-auto -mt-12 max-w-6xl px-6 pb-24">
      <h3 id="readings-pricing" className="text-center font-display text-3xl">One-time readings</h3>
      <p className="mt-2 text-center text-sm text-slate">Pay once, keep it forever. No subscription needed.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cats.map((c) => (
          <div key={c} className="glass rounded-[1.5rem] p-6">
            <Link href={`/${c}`} className="font-display text-2xl hover:text-gold">{LABEL[c]}</Link>
            <ul className="mt-3 space-y-1.5 text-sm">
              {pricing.readings.filter((p) => p.active && p.category === c).map((p) => (
                <li key={p.id} className="flex justify-between gap-3"><span className="text-slate">{p.name.replace(/^(Numerology|Palm Reading) /, "")}</span><span>{chargePrice(p) < p.priceMinor && <span className="mr-1.5 text-xs text-slate line-through">{rupees(p.priceMinor)}</span>}<span className="text-gold">{rupees(chargePrice(p))}</span></span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {bundle && <p className="mt-6 text-center text-sm text-slate"><span className="text-moon">{bundle.name}</span> — {bundle.description} <span className="text-gold">{rupees(chargePrice(bundle))}</span>{chargePrice(bundle) < bundle.priceMinor && <span className="ml-1 line-through">{rupees(bundle.priceMinor)}</span>}</p>}
    </section>
  );
}
