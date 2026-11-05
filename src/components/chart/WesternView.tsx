import type { WesternChart } from "@/lib/astro/western";

const fmt = (l: number) => `${Math.floor(l % 30)}°${String(Math.floor(((l % 30) % 1) * 60)).padStart(2, "0")}′`;
const SIGN_ABBR = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

/** Western (tropical) wheel + table: Placidus cusps, outer planets, Ptolemaic aspects. */
export function WesternView({ western }: { western: WesternChart }) {
  const asc = western.ascendant ?? 0;
  const pt = (lon: number, r: number) => { const a = ((180 + lon - asc) * Math.PI) / 180; return [Number((Math.cos(a) * r).toFixed(2)), Number((-Math.sin(a) * r).toFixed(2))]; };
  return (
    <div>
      <svg viewBox="-210 -210 420 420" className="h-auto w-full" role="img" aria-label="Western tropical chart wheel">
        <circle r="200" fill="rgba(13,18,48,.55)" stroke="rgba(216,180,119,.45)" />
        <circle r="170" fill="none" stroke="rgba(165,139,255,.3)" />
        <circle r="110" fill="none" stroke="rgba(165,139,255,.2)" />
        {Array.from({ length: 12 }, (_, i) => { const [x1, y1] = pt(i * 30, 170); const [x2, y2] = pt(i * 30, 200); const [tx, ty] = pt(i * 30 + 15, 185); return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(216,180,119,.4)" /><text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fill="#9BA3BC">{SIGN_ABBR[i]}</text></g>; })}
        {western.cusps?.map((c, i) => { const [x1, y1] = pt(c, 110); const [x2, y2] = pt(c, 170); const [tx, ty] = pt(c + 4, 120); return <g key={`c${i}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 === 0 ? "#D8B477" : "rgba(233,227,245,.25)"} strokeWidth={i % 3 === 0 ? 1.2 : 0.6} /><text x={tx} y={ty + 3} textAnchor="middle" fontSize="7" fill="#9BA3BC">{i + 1}</text></g>; })}
        {western.aspects.filter((a) => a.aspect !== "Conjunction").map((a, i) => {
          const pa = western.positions.find((p) => p.body === a.a)!, pb = western.positions.find((p) => p.body === a.b)!;
          const [x1, y1] = pt(pa.longitude, 105), [x2, y2] = pt(pb.longitude, 105);
          const c = a.aspect === "Trine" || a.aspect === "Sextile" ? "rgba(165,139,255,.55)" : "rgba(224,122,95,.5)";
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth=".7" />;
        })}
        {western.positions.map((p) => { const [x, y] = pt(p.longitude, 140); return <g key={p.body}><circle cx={x} cy={y} r="10" fill="rgba(8,13,32,.9)" stroke="rgba(216,180,119,.5)" /><text x={x} y={y + 3} textAnchor="middle" fontSize="7.5" fill="#F1DCAE">{p.body.slice(0, 2)}</text></g>; })}
      </svg>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Western tropical positions</caption>
          <thead className="text-slate"><tr><th className="py-1.5">Body</th><th>Sign</th><th>Degree</th><th>House</th></tr></thead>
          <tbody>
            {western.ascendant !== null && <tr className="border-t hairline"><td className="py-1.5 text-gold">Ascendant</td><td>{SIGN_ABBR[Math.floor(western.ascendant / 30)]}</td><td>{fmt(western.ascendant)}</td><td>1</td></tr>}
            {western.midheaven !== null && <tr className="border-t hairline"><td className="py-1.5 text-gold">Midheaven</td><td>{SIGN_ABBR[Math.floor(western.midheaven / 30)]}</td><td>{fmt(western.midheaven)}</td><td>10</td></tr>}
            {western.positions.map((p) => <tr key={p.body} className="border-t hairline"><td className="py-1.5">{p.body}{p.retrograde ? " ℞" : ""}</td><td>{p.sign}</td><td>{fmt(p.longitude)}</td><td>{p.house ?? "—"}</td></tr>)}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate">Aspects: {western.aspects.map((a) => `${a.a} ${a.aspect.toLowerCase()} ${a.b} (${a.orb}°${a.applying ? ", applying" : ""})`).join(" · ") || "none within orb"}.</p>
        <p className="mt-2 text-xs text-slate/80">Tropical zodiac, {western.houseSystem === "placidus" ? "Placidus houses" : western.houseSystem === "whole-sign" ? "whole-sign houses" : "no houses"}. {western.notes.join(" ")}</p>
      </div>
    </div>
  );
}
