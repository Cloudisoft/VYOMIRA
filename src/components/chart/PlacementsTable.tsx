import { PLANET_INFO } from "@/lib/astro/constants";
import { dms } from "@/lib/astro/math";
import type { ChartResult } from "@/lib/astro/chart";
import { cn } from "@/lib/utils";

const DIG: Record<string, string> = { exalted: "text-gold", moolatrikona: "text-gold/80", own: "text-amethyst", debilitated: "text-[#E07A5F]", neutral: "text-slate" };

export function PlacementsTable({ chart, selected }: { chart: ChartResult; selected?: string | null }) {
  const lagnaKnown = chart.confidence.housesReliable;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Sidereal planetary positions (Lahiri ayanamsa)</caption>
        <thead>
          <tr className="border-b hairline text-[11px] tracking-[0.18em] text-slate uppercase">
            <th className="py-3 pr-4 font-medium">Graha</th>
            <th className="py-3 pr-4 font-medium">Sign</th>
            <th className="py-3 pr-4 font-medium">Degree</th>
            <th className="py-3 pr-4 font-medium">{lagnaKnown ? "House" : "From Moon"}</th>
            <th className="py-3 pr-4 font-medium">Nakshatra · Pada</th>
            <th className="py-3 pr-4 font-medium">Dignity</th>
            <th className="py-3 font-medium">D9</th>
          </tr>
        </thead>
        <tbody>
          {chart.lagna && (
            <tr className="border-b hairline">
              <td className="py-3 pr-4 font-medium text-gold">Lagna</td>
              <td className="py-3 pr-4">{chart.lagna.signName}</td>
              <td className="py-3 pr-4 tabular-nums">{dms(chart.lagna.degree)}</td>
              <td className="py-3 pr-4">1</td>
              <td className="py-3 pr-4">{chart.lagna.nakshatra} · {chart.lagna.pada}</td>
              <td className="py-3 pr-4 text-slate">—</td>
              <td className="py-3">{chart.vargas.D9.Lagna !== null ? ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"][chart.vargas.D9.Lagna as number] : "—"}</td>
            </tr>
          )}
          {chart.placements.map((p) => (
            <tr key={p.planet} className={cn("border-b hairline transition-colors", selected === p.planet && "bg-gold/[.06]")}>
              <td className="py-3 pr-4"><span className="mr-2 text-slate">{PLANET_INFO[p.planet].glyph}</span>{p.planet}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" && <span className="ml-1.5 rounded bg-amethyst/15 px-1 text-[10px] text-amethyst">R</span>}{p.combust && <span className="ml-1.5 rounded bg-gold/15 px-1 text-[10px] text-gold">C</span>}</td>
              <td className="py-3 pr-4">{p.signName}</td>
              <td className="py-3 pr-4 tabular-nums">{dms(p.degree)}</td>
              <td className="py-3 pr-4">{p.house ?? p.houseFromMoon}</td>
              <td className="py-3 pr-4">{p.nakshatra} · {p.pada}</td>
              <td className={cn("py-3 pr-4 capitalize", DIG[p.dignity])}>{p.dignity}</td>
              <td className="py-3">{["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"][p.navamsaSign]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate/80">R = retrograde (Rahu/Ketu mean nodes are always retrograde) · C = combust · Sidereal zodiac, Lahiri ayanamsa {dms(chart.ayanamsa)}</p>
    </div>
  );
}
