"use client";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const COUNTRIES: [string, string][] = [["IN", "India · ₹ INR"], ["US", "United States · $ USD"], ["GB", "United Kingdom · £ GBP"], ["DE", "Eurozone · € EUR"], ["AE", "UAE · AED"], ["SG", "Singapore · S$ SGD"], ["CA", "Canada · CA$ CAD"], ["AU", "Australia · A$ AUD"], ["NP", "Nepal · ₹ INR"], ["ZZ", "Other · $ USD"]];

export function CountrySelect({ current }: { current: string; regionKey: string; currency: string }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-3 rounded-full border hairline bg-navy/60 px-4 py-2 text-sm text-slate">
      Prices for
      <select
        className="bg-transparent text-moon outline-none"
        defaultValue={COUNTRIES.some(([c]) => c === current) ? current : "ZZ"}
        onChange={(e) => {
          document.cookie = `vy_country=${e.target.value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
          router.refresh();
        }}
      >
        {COUNTRIES.map(([c, l]) => <option key={c} value={c} className="bg-navy">{l}</option>)}
      </select>
    </label>
  );
}

export function BuyButton({ planId, label, highlight }: { planId: string; label: string; highlight?: boolean }) {
  const router = useRouter();
  const { data } = useSession();
  return (
    <button
      className={cn("mt-8", highlight ? "btn-primary" : "btn-ghost")}
      onClick={() => router.push(data ? `/dashboard/billing?plan=${planId}` : `/sign-up?next=${encodeURIComponent(`/dashboard/billing?plan=${planId}`)}`)}
    >
      {label}
    </button>
  );
}
