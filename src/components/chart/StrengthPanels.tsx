import type { AdvancedChart } from "@/lib/astro/advanced";
import { AV_PLANETS } from "@/lib/astro/ashtakavarga";
import { cn } from "@/lib/utils";

const SIGNS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

export function AshtakavargaPanel({ av, lagnaSign }: { av: NonNullable<AdvancedChart["ashtakavarga"]>; lagnaSign: number }) {
  const max = Math.max(...av.sav);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-center text-xs tabular-nums">
        <caption className="sr-only">Bhinnashtakavarga and Sarvashtakavarga bindus per sign</caption>
        <thead className="text-slate">
          <tr><th className="py-2 text-left font-medium">Graha</th>{SIGNS.map((s, i) => <th key={s} className={cn("font-medium", i === lagnaSign && "text-gold")}>{s}{i === lagnaSign && " ↑"}</th>)}<th className="font-medium">Σ</th></tr>
        </thead>
        <tbody>
          {AV_PLANETS.map((p) => (
            <tr key={p} className="border-t hairline">
              <td className="py-1.5 text-left text-moon">{p}</td>
              {av.bav[p].map((b, i) => <td key={i} className={b >= 5 ? "text-gold" : b <= 2 ? "text-slate/50" : "text-moon/80"}>{b}</td>)}
              <td className="text-slate">{av.totals[p]}</td>
            </tr>
          ))}
          <tr className="border-t border-gold/40">
            <td className="py-2 text-left font-medium text-gold">SAV</td>
            {av.sav.map((v, i) => (
              <td key={i} className="py-2">
                <span className="inline-block min-w-[2rem] rounded-md px-1 py-0.5" style={{ background: `rgba(216,180,119,${(v / max) * 0.35})`, color: v >= 28 ? "#F1DCAE" : "#9BA3BC" }}>{v}</span>
              </td>
            ))}
            <td className="text-gold">{av.sav.reduce((a, b) => a + b, 0)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate/80">Bindus (benefic points) by BPHS tables. Signs with 28+ Sarvashtakavarga bindus are traditionally considered supportive for transits; ↑ marks your Lagna.</p>
    </div>
  );
}

export function ShadbalaPanel({ sb }: { sb: NonNullable<AdvancedChart["shadbala"]> }) {
  const maxR = Math.max(...sb.rows.map((r) => r.ratio), 1.4);
  return (
    <div>
      <ul className="space-y-3">
        {sb.rows.map((r) => (
          <li key={r.planet}>
            <div className="flex justify-between text-sm"><span className="text-moon">{r.planet}</span><span className={r.ratio >= 1 ? "text-gold" : "text-slate"}>{r.rupas.toFixed(2)} rupas <span className="text-xs text-slate">/ {r.required} required · {(r.ratio * 100).toFixed(0)}%</span></span></div>
            <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-moon/10">
              <div className={cn("h-full rounded-full", r.ratio >= 1 ? "bg-gradient-to-r from-violet to-gold" : "bg-amethyst/50")} style={{ width: `${(r.ratio / maxR) * 100}%` }} />
              <div className="absolute top-0 bottom-0 w-px bg-moon/60" style={{ left: `${(1 / maxR) * 100}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate/80">Sthana {r.sthana.total.toFixed(0)} · Dig {r.dig.toFixed(0)} · Kala {r.kala.total.toFixed(0)} · Cheshta {r.cheshta.toFixed(0)} · Naisargika {r.naisargika.toFixed(0)} · Drik {r.drik.toFixed(0)} virupas</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-slate/80">Shadbala ({sb.version}) per BPHS. Conventions vary between software — notably year/month lords, cheshta method and house reckoning — so compare patterns, not exact virupas. The line marks each planet's classical minimum.</p>
    </div>
  );
}
