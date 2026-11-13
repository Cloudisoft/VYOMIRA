import { TarotBack } from "@/components/readings/TarotCard";

/** Small original illustrations for the four paths (pure SVG, no image downloads). */
export function PathArt({ kind, className }: { kind: "astrology" | "palmistry" | "numerology" | "tarot"; className?: string }) {
  if (kind === "tarot") return <div className={`relative ${className ?? ""}`}><TarotBack className="absolute left-1/2 top-1/2 h-[86%] -translate-x-[78%] -translate-y-1/2 -rotate-12 opacity-70" /><TarotBack className="absolute left-1/2 top-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 rotate-3 drop-shadow-[0_8px_24px_rgba(114,86,216,.45)]" /></div>;
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden fill="none" stroke="#E8C98B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {kind === "astrology" && <g>
        <rect x="40" y="20" width="80" height="80" strokeOpacity=".9" />
        <path d="M40 20 L120 100 M120 20 L40 100 M80 20 L120 60 L80 100 L40 60 Z" strokeOpacity=".6" />
        <circle cx="80" cy="60" r="4" fill="#E8C98B" stroke="none" />
        <g className="motion-safe:animate-[spin_40s_linear_infinite]" style={{ transformOrigin: "80px 60px" }}><circle cx="80" cy="60" r="52" stroke="#B9A2FF" strokeOpacity=".35" strokeDasharray="2 6" /><circle cx="132" cy="60" r="3" fill="#B9A2FF" stroke="none" /></g>
      </g>}
      {kind === "palmistry" && <g>
        <path d="M58 108 C50 90 46 74 48 60 L44 34 C43 28 51 27 52 33 L56 54 L56 22 C56 16 64 16 64 22 L65 52 L67 18 C67 12 75 12 75 18 L75 52 L79 24 C80 18 88 19 87 25 L84 58 L94 48 C99 43 106 49 101 55 L86 80 C82 92 80 100 80 108" strokeOpacity=".9" />
        <path d="M54 76 C60 68 64 64 74 62" stroke="#B9A2FF" strokeOpacity=".8" />
        <path d="M52 66 C62 60 72 58 84 60" stroke="#B9A2FF" strokeOpacity=".6" />
        <path d="M60 96 C56 86 56 78 62 70" stroke="#B9A2FF" strokeOpacity=".7" />
      </g>}
      {kind === "numerology" && <g>
        {[[4, 9, 2], [3, 5, 7], [8, 1, 6]].map((row, r) => row.map((n, c) => (
          <g key={`${r}${c}`}><rect x={47 + c * 23} y={15 + r * 31} width="20" height="28" rx="4" strokeOpacity={n === 5 ? 1 : 0.45} fill={n === 5 ? "rgba(232,201,139,.12)" : "none"} /><text x={57 + c * 23} y={34 + r * 31} textAnchor="middle" fontSize="13" fill={n === 5 ? "#E8C98B" : "#B9A2FF"} stroke="none" fontFamily="Georgia, serif">{n}</text></g>
        )))}
      </g>}
    </svg>
  );
}
