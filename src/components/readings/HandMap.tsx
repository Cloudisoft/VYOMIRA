"use client";
import { useState } from "react";
import { LINE_IDS, MOUNT_IDS, MOUNT_NAME, type PalmHand } from "@/lib/readings/palm";
import { rs } from "@/lib/readings/strings";
import type { RLang } from "@/lib/readings/lang";

/**
 * VYOMIRA's palm map: an original, hand-drawn-style diagram that redraws the person's palm from what
 * was actually observed — each line's visibility, length and marks, and the mounts' prominence.
 * Base drawing is a LEFT palm (thumb on the left); right hands are mirrored.
 */
const OUTLINE = "M95 392 C 88 352, 82 322, 80 292 C 60 272, 38 246, 30 212 C 25 190, 42 176, 54 190 C 66 205, 78 226, 92 236 L 92 172 L 92 78 C 92 56, 124 56, 124 78 L 127 166 L 128 52 C 128 28, 162 28, 162 52 L 164 166 L 166 64 C 166 42, 198 42, 198 64 L 200 170 L 203 108 C 203 88, 232 88, 232 108 L 234 202 C 242 262, 240 332, 226 392 Z";
const CREASES = ["M96 120 h24", "M131 100 h28", "M169 112 h26", "M206 140 h22", "M44 214 c 8 4, 16 6, 26 6"];
const PATH: Record<string, string> = {
  heart: "M233 206 C 200 200, 166 206, 128 182",
  head: "M92 240 C 130 251, 176 262, 222 276",
  life: "M95 246 C 140 270, 152 330, 136 386",
  fate: "M165 388 C 162 322, 156 260, 148 196",
  sun: "M192 322 C 190 272, 187 236, 184 198",
  mercury: "M198 366 C 205 320, 212 270, 220 214",
};
const MARK_AT: Record<string, [number, number]> = { heart: [178, 201], head: [162, 258], life: [146, 318], fate: [158, 292], sun: [189, 262], mercury: [210, 290] };
const LABEL_AT: Record<string, [number, number, "start" | "end"]> = { heart: [246, 200, "start"], head: [246, 280, "start"], life: [64, 372, "end"], fate: [170, 410, "start"], sun: [246, 240, "start"], mercury: [246, 330, "start"] };
const MOUNT_AT: Record<string, [number, number]> = { jupiter: [108, 196], saturn: [146, 190], sun: [183, 194], mercury: [218, 214], venus: [112, 322], moon: [206, 334], mars_upper: [224, 250], mars_lower: [100, 266] };
export const LINE_COLOR: Record<string, string> = { life: "#E8C98B", head: "#B9A2FF", heart: "#FF8FA3", fate: "#7FB6F0", sun: "#F0A35E", mercury: "#9BD08A" };
const LEN = { short: 55, medium: 80, long: 100, unclear: 100 } as const;

function Mark({ f, x, y, c }: { f: string; x: number; y: number; c: string }) {
  const p = { stroke: c, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const };
  if (f === "star") return <path d={`M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8} Z`} {...p} fill={c} fillOpacity={0.5} />;
  if (f === "cross") return <path d={`M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}`} {...p} />;
  if (f === "island") return <ellipse cx={x} cy={y} rx={7} ry={3.5} {...p} />;
  if (f === "fork") return <path d={`M${x} ${y} l 8 -7 M${x} ${y} l 9 3`} {...p} />;
  if (f === "break") return <path d={`M${x - 3} ${y - 6} L${x + 3} ${y + 6}`} stroke="#0b0a20" strokeWidth={5} />;
  if (f === "chain") return <path d={`M${x - 9} ${y} q 3 -4 6 0 q 3 4 6 0 q 3 -4 6 0`} {...p} />;
  if (f === "branch_up") return <path d={`M${x} ${y} l 4 -10`} {...p} />;
  if (f === "branch_down") return <path d={`M${x} ${y} l 4 10`} {...p} />;
  return null;
}

export function HandMap({ hand, dominant, lang, photoUrl, className }: { hand: PalmHand; dominant?: string; lang: RLang; photoUrl?: string; className?: string }) {
  const S = rs(lang);
  const [sel, setSel] = useState<string | null>(null);
  const mirror = hand.side === "right";
  const lineOf = (id: string) => hand.lines.find((l) => l.line === id);
  const focus = sel ? lineOf(sel) : null;
  const tx = (x: number) => (mirror ? 300 - x : x);
  return (
    <figure className={className}>
      <figcaption className="mb-3 font-display text-xl">{hand.side === "left" ? S.left : S.right} {S.hand}{hand.side === dominant ? ` (${S.dominantTag})` : ""} · <span className="text-sm text-slate">{S.palmShape}: {S.shapes[hand.palmShape.type]}</span></figcaption>
      <div className="flex flex-col gap-4 sm:flex-row">
        <svg viewBox="-56 0 412 420" className="w-full max-w-[400px] shrink-0" role="img" aria-label={`${S.palmTitle}: ${hand.side}`}>
          <defs>
            <radialGradient id={`palm-bg-${hand.side}`} cx="50%" cy="60%" r="60%"><stop offset="0" stopColor="#2a2160" /><stop offset="1" stopColor="#120f2e" /></radialGradient>
            <filter id={`glow-${hand.side}`}><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g transform={mirror ? "translate(300 0) scale(-1 1)" : undefined}>
            <path d={OUTLINE} fill={`url(#palm-bg-${hand.side})`} stroke="#E8C98B" strokeOpacity=".55" strokeWidth="1.4" />
            {CREASES.map((d) => <path key={d} d={d} stroke="#E8C98B" strokeOpacity=".18" strokeWidth="1" fill="none" strokeLinecap="round" />)}
            {MOUNT_IDS.map((m) => {
              const mt = hand.mounts.find((x) => x.mount === m);
              const pr = mt?.prominence ?? "unclear";
              if (pr === "unclear") return null;
              const [x, y] = MOUNT_AT[m];
              return <circle key={m} cx={x} cy={y} r={pr === "prominent" ? 15 : pr === "average" ? 10 : 6} fill="#B9A2FF" fillOpacity={pr === "prominent" ? 0.22 : pr === "average" ? 0.12 : 0.05} stroke="#B9A2FF" strokeOpacity={0.25} strokeDasharray={pr === "flat" ? "2 3" : undefined}><title>{MOUNT_NAME[lang][m]}: {mt?.observation}</title></circle>;
            })}
            {LINE_IDS.map((id, i) => {
              const l = lineOf(id);
              const vis = l?.visibility ?? "not_visible";
              const c = LINE_COLOR[id];
              const dim = sel && sel !== id;
              if (vis === "not_visible") return <path key={id} d={PATH[id]} stroke="#8a8fa8" strokeOpacity={dim ? 0.12 : 0.3} strokeWidth="1.2" strokeDasharray="1 5" fill="none" strokeLinecap="round" onClick={() => setSel(sel === id ? null : id)} className="cursor-pointer" />;
              const len = LEN[l!.length];
              return (
                <g key={id} opacity={dim ? 0.25 : 1} onClick={() => setSel(sel === id ? null : id)} className="cursor-pointer">
                  <path d={PATH[id]} stroke="transparent" strokeWidth="14" fill="none" />
                  <path d={PATH[id]} pathLength={100} stroke={c} strokeWidth={vis === "clear" ? (sel === id ? 3.6 : 2.6) : 1.6} fill="none" strokeLinecap="round" filter={vis === "clear" ? `url(#glow-${hand.side})` : undefined}
                    strokeDasharray={vis === "faint" ? "3 4" : `${len} 100`} className={vis === "clear" ? "palm-draw" : undefined} style={vis === "clear" ? { ["--len" as string]: len, animationDelay: `${i * 180}ms` } : undefined} />
                  {l!.features.map((f, k) => { const [x, y] = MARK_AT[id]; return <Mark key={f} f={f} x={x + k * 9} y={y} c={c} />; })}
                </g>
              );
            })}
          </g>
          {LINE_IDS.map((id) => {
            const l = lineOf(id);
            const [x, y, anchor] = LABEL_AT[id];
            const X = tx(x);
            return <text key={id} x={X} y={y} textAnchor={mirror ? (anchor === "start" ? "end" : "start") : anchor} fontSize="10" fill={l && l.visibility !== "not_visible" ? LINE_COLOR[id] : "#8a8fa8"} opacity={sel && sel !== id ? 0.35 : 0.95} onClick={() => setSel(sel === id ? null : id)} className="cursor-pointer select-none">{S.lines[id].split(" (")[0]}</text>;
          })}
        </svg>
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          {photoUrl && (
            // Private, per-user photo served by an authenticated route; next/image optimisation would cache it.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="mb-3 h-40 w-full rounded-xl border hairline object-cover sm:h-48" />
          )}
          <ul className="space-y-1.5">
            {LINE_IDS.map((id) => {
              const l = lineOf(id);
              const vis = l?.visibility ?? "not_visible";
              return (
                <li key={id}>
                  <button type="button" onClick={() => setSel(sel === id ? null : id)} aria-pressed={sel === id} className={`flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left transition ${sel === id ? "bg-moon/10" : "hover:bg-moon/5"}`}>
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: vis === "not_visible" ? "#8a8fa8" : LINE_COLOR[id], opacity: vis === "faint" ? 0.6 : 1 }} />
                    <span><span className="text-moon">{S.lines[id]}</span> <span className="text-slate">— {S.vis[vis]}</span></span>
                  </button>
                </li>
              );
            })}
          </ul>
          {focus && focus.visibility !== "not_visible" && focus.observation && <p role="status" className="rounded-xl border hairline bg-navy/50 p-3 text-moon/85">{focus.observation}</p>}
        </div>
      </div>
    </figure>
  );
}
