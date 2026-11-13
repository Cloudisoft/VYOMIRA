import { CARD, type Suit } from "@/lib/readings/tarot";

/**
 * VYOMIRA's own tarot artwork, drawn in SVG (no third-party card images, so no licensing issues).
 * Majors: a unique celestial emblem per card. Minors: suit emblem arranged by rank; court cards crowned.
 */
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const SUIT_COLOR: Record<Suit, string> = { major: "#E8C98B", wands: "#F0A35E", cups: "#7FB6F0", swords: "#C9D2E6", pentacles: "#9BD08A" };

function SuitGlyph({ suit, x, y, s = 1 }: { suit: Suit; x: number; y: number; s?: number }) {
  const c = SUIT_COLOR[suit];
  const t = `translate(${x} ${y}) scale(${s})`;
  if (suit === "wands") return <g transform={t} stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round"><path d="M0 -14 L0 14" /><path d="M0 -8 l5 -4 M0 -2 l-5 -4 M0 4 l5 -4" /><circle cx={0} cy={-15} r={2} fill={c} /></g>;
  if (suit === "cups") return <g transform={t} stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round"><path d="M-9 -10 h18 q0 12 -9 13 q-9 -1 -9 -13z" /><path d="M0 3 v7 M-6 11 h12" /></g>;
  if (suit === "swords") return <g transform={t} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"><path d="M0 -15 L0 8" /><path d="M-7 8 h14 M0 8 v6" /><path d="M-2 -11 L0 -15 L2 -11" /></g>;
  if (suit === "pentacles") return <g transform={t} stroke={c} strokeWidth={1.8} fill="none"><circle r={11} /><path d="M0 -8 L4.7 6.5 L-7.6 -2.5 L7.6 -2.5 L-4.7 6.5 Z" strokeLinejoin="round" /></g>;
  return null;
}

/** 22 distinct major-arcana emblems built from a small celestial vocabulary. */
function MajorEmblem({ n }: { n: number }) {
  const g = "#E8C98B", v = "#B9A2FF";
  const rays = (k: number, r1: number, r2: number) => Array.from({ length: k }, (_, i) => { const a = (i / k) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} />; });
  const star = (r: number, p = 5, inner = 0.42) => { const pts = Array.from({ length: p * 2 }, (_, i) => { const a = (i / (p * 2)) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * inner : r; return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`; }); return <polygon points={pts.join(" ")} />; };
  const emblems: React.ReactNode[] = [
    /* 0 Fool */ <g key={0}><circle r={16} stroke={v} /><path d="M-22 22 Q0 -6 22 22" stroke={g} /><circle cx={10} cy={-20} r={3} fill={g} /></g>,
    /* I Magician */ <g key={1}><path d="M-18 0 C-18 -12 -2 -12 0 0 C2 12 18 12 18 0 C18 -12 2 -12 0 0 C-2 12 -18 12 -18 0Z" stroke={g} /><line y1={14} y2={30} stroke={v} /></g>,
    /* II Priestess */ <g key={2}><path d="M-6 -22 a18 18 0 1 0 0 44 a14 14 0 1 1 0 -44" stroke={g} /><line x1={-26} x2={-26} y1={-24} y2={24} stroke={v} /><line x1={26} x2={26} y1={-24} y2={24} stroke={v} /></g>,
    /* III Empress */ <g key={3}><circle cy={-6} r={12} stroke={g} /><path d="M0 6 V28 M-9 18 H9" stroke={g} />{<g stroke={v}>{rays(8, 16, 22)}</g>}</g>,
    /* IV Emperor */ <g key={4}><rect x={-18} y={-18} width={36} height={36} stroke={g} /><path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke={v} /></g>,
    /* V Hierophant */ <g key={5}><path d="M0 -26 V26 M-14 -14 H14 M-10 -4 H10 M-6 6 H6" stroke={g} /><circle cy={-26} r={3} fill={v} /></g>,
    /* VI Lovers */ <g key={6}><circle cx={-8} r={14} stroke={g} /><circle cx={8} r={14} stroke={v} /><g stroke={g}>{rays(6, 22, 26)}</g></g>,
    /* VII Chariot */ <g key={7}><rect x={-20} y={-10} width={40} height={20} rx={4} stroke={g} /><circle cx={-12} cy={16} r={6} stroke={v} /><circle cx={12} cy={16} r={6} stroke={v} /><g transform="translate(0 -20)" stroke={g}>{star(7)}</g></g>,
    /* VIII Strength */ <g key={8}><path d="M-20 0 C-20 -14 -4 -14 0 0 C4 14 20 14 20 0 C20 -14 4 -14 0 0 C-4 14 -20 14 -20 0Z" stroke={v} /><circle r={26} stroke={g} /></g>,
    /* IX Hermit */ <g key={9}><path d="M-8 -6 L0 -18 L8 -6 Z" stroke={g} /><rect x={-6} y={-6} width={12} height={14} stroke={g} /><g transform="translate(0 0)" stroke={v}>{rays(10, 14, 22)}</g></g>,
    /* X Wheel */ <g key={10}><circle r={24} stroke={g} /><circle r={8} stroke={v} /><g stroke={g}>{rays(8, 8, 24)}</g></g>,
    /* XI Justice */ <g key={11}><path d="M0 -24 V24 M-22 -12 H22" stroke={g} /><path d="M-22 -12 L-28 4 H-16 Z M22 -12 L16 4 H28 Z" stroke={v} /></g>,
    /* XII Hanged */ <g key={12}><path d="M-20 -24 H20 M0 -24 V4" stroke={g} /><path d="M0 4 L-10 22 L10 22 Z" stroke={v} /><circle cy={-10} r={5} stroke={g} /></g>,
    /* XIII Death */ <g key={13}><path d="M-22 12 Q0 -30 22 12" stroke={g} /><line x1={-26} x2={26} y1={12} y2={12} stroke={v} /><circle cy={-4} r={4} fill={g} /></g>,
    /* XIV Temperance */ <g key={14}><path d="M-16 -18 h10 v10 h-10z M6 8 h10 v10 h-10z" stroke={g} /><path d="M-6 -8 C10 -4 -8 4 6 12" stroke={v} /></g>,
    /* XV Devil */ <g key={15}><g transform="rotate(180)" stroke={g}>{star(22)}</g><circle cy={24} r={4} stroke={v} /><circle cy={-26} r={4} stroke={v} /></g>,
    /* XVI Tower */ <g key={16}><rect x={-10} y={-18} width={20} height={42} stroke={g} /><path d="M-10 -18 L0 -26 L10 -18" stroke={g} /><path d="M18 -28 L6 -6 L14 -6 L2 16" stroke={v} /></g>,
    /* XVII Star */ <g key={17}><g stroke={g}>{star(22, 8, 0.45)}</g>{[-22, 22].map((x) => <g key={x} transform={`translate(${x} 20)`} stroke={v}>{star(5)}</g>)}</g>,
    /* XVIII Moon */ <g key={18}><path d="M6 -22 a22 22 0 1 0 0 44 a17 17 0 1 1 0 -44" stroke={g} /><g transform="translate(18 -14)" stroke={v}>{star(4)}</g></g>,
    /* XIX Sun */ <g key={19}><circle r={13} stroke={g} /><g stroke={g}>{rays(16, 17, 27)}</g><circle r={5} fill={v} stroke="none" /></g>,
    /* XX Judgement */ <g key={20}><path d="M-22 10 L14 -16 L18 -10 L-18 16 Z" stroke={g} /><g stroke={v}>{rays(5, 22, 28)}</g></g>,
    /* XXI World */ <g key={21}><ellipse rx={18} ry={26} stroke={g} /><g stroke={v}>{star(8)}</g>{[[-26, -26], [26, -26], [-26, 26], [26, 26]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={3} fill={g} stroke="none" />)}</g>,
  ];
  return <g fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{emblems[n]}</g>;
}

function pipLayout(n: number): [number, number][] {
  const L: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[0, -24], [0, 24]], 3: [[0, -30], [0, 0], [0, 30]], 4: [[-16, -22], [16, -22], [-16, 22], [16, 22]],
    5: [[-16, -24], [16, -24], [0, 0], [-16, 24], [16, 24]], 6: [[-16, -28], [16, -28], [-16, 0], [16, 0], [-16, 28], [16, 28]],
    7: [[-16, -30], [16, -30], [0, -15], [-16, 0], [16, 0], [-16, 30], [16, 30]], 8: [[-16, -33], [16, -33], [-16, -11], [16, -11], [-16, 11], [16, 11], [-16, 33], [16, 33]],
    9: [[-16, -34], [16, -34], [-16, -12], [16, -12], [0, 0], [-16, 12], [16, 12], [-16, 34], [16, 34]],
    10: [[-16, -36], [16, -36], [0, -24], [-16, -12], [16, -12], [-16, 12], [16, 12], [0, 24], [-16, 36], [16, 36]],
  };
  return L[n];
}

export function TarotFace({ cardId, reversed = false, className }: { cardId: string; reversed?: boolean; className?: string }) {
  const c = CARD[cardId];
  if (!c) return null;
  const color = SUIT_COLOR[c.suit];
  const court = c.suit !== "major" && c.rank > 10;
  return (
    <svg viewBox="0 0 120 200" className={className} role="img" aria-label={`${c.name}${reversed ? ", reversed" : ""}`}>
      <defs>
        <linearGradient id={`bg-${cardId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a1440" /><stop offset="1" stopColor="#0b0a20" /></linearGradient>
        <radialGradient id={`glow-${cardId}`}><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="1" y="1" width="118" height="198" rx="9" fill={`url(#bg-${cardId})`} stroke="#E8C98B" strokeOpacity=".7" />
      <rect x="6" y="6" width="108" height="188" rx="6" fill="none" stroke="#E8C98B" strokeOpacity=".25" />
      <g transform={reversed ? "rotate(180 60 100)" : undefined}>
        <text x="60" y="22" textAnchor="middle" fontSize="10" fill="#E8C98B" fontFamily="Georgia, serif" letterSpacing="1">{c.suit === "major" ? ROMAN[c.rank] : c.rank <= 10 ? (c.rank === 1 ? "A" : String(c.rank)) : ["P", "Kn", "Q", "K"][c.rank - 11]}</text>
        <circle cx="60" cy="96" r="44" fill={`url(#glow-${cardId})`} />
        <g transform="translate(60 96)">
          {c.suit === "major" ? <MajorEmblem n={c.rank} /> : court ? (
            <g>
              <path d={["M-14 -26 h28 v8 h-28z", "M-16 -22 L-8 -32 L0 -24 L8 -32 L16 -22 Z", "M-16 -18 L-12 -32 L-4 -22 L0 -34 L4 -22 L12 -32 L16 -18 Z", "M-18 -18 L-14 -34 L-6 -24 L0 -38 L6 -24 L14 -34 L18 -18 Z"][c.rank - 11]} fill="none" stroke="#E8C98B" strokeWidth="1.8" strokeLinejoin="round" />
              <SuitGlyph suit={c.suit} x={0} y={12} s={1.6} />
            </g>
          ) : pipLayout(c.rank).map(([x, y], i) => <SuitGlyph key={i} suit={c.suit} x={x} y={y} s={c.rank === 1 ? 2 : 0.82} />)}
        </g>
        <text x="60" y="172" textAnchor="middle" fontSize={c.name.length > 16 ? 7.6 : 8.6} fill="#F4EFE3" fontFamily="Georgia, serif">{c.name}</text>
        <text x="60" y="184" textAnchor="middle" fontSize="6" fill={color} letterSpacing="1.5" opacity=".85">{c.suit === "major" ? "MAJOR ARCANA" : c.suit.toUpperCase()}</text>
      </g>
    </svg>
  );
}

export function TarotBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="tb-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a1d63" /><stop offset="1" stopColor="#0e0b26" /></linearGradient>
        <pattern id="tb-p" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r=".9" fill="#E8C98B" opacity=".35" /></pattern>
      </defs>
      <rect x="1" y="1" width="118" height="198" rx="9" fill="url(#tb-bg)" stroke="#E8C98B" strokeOpacity=".7" />
      <rect x="8" y="8" width="104" height="184" rx="6" fill="url(#tb-p)" stroke="#E8C98B" strokeOpacity=".3" />
      <g transform="translate(60 100)" fill="none" stroke="#E8C98B" strokeWidth="1.4">
        <circle r="26" /><circle r="18" strokeOpacity=".5" />
        <path d="M6 -14 a15 15 0 1 0 0 28 a11 11 0 1 1 0 -28" fill="#E8C98B" fillOpacity=".15" />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 36} y2={Math.sin(a) * 36} strokeOpacity=".6" />; })}
      </g>
    </svg>
  );
}
