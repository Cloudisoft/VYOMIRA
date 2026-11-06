import { cn } from "@/lib/utils";

/**
 * CSS-only rotating planet (phones, low-power devices, while WebGL loads).
 * The surface is a seamless strip twice the sphere's width that slides sideways inside a circular
 * mask; fixed lighting layers on top give the 3D shading, so it reads as a turning globe. The ring is
 * split into a back half (behind the sphere) and a front half (over it). GPU cost: transforms only.
 * Freezes under prefers-reduced-motion (see globals.css).
 */
export function PlanetFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("vy-planet relative aspect-square", className)}>
      <div className="absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,rgba(114,86,216,.38),transparent_62%)] blur-2xl vy-breathe" />

      {/* ring — back half */}
      <svg viewBox="0 0 200 200" className="absolute inset-[-34%] h-[168%] w-[168%] -rotate-[14deg]">
        <defs>
          <linearGradient id="vyRing" x1="0" x2="1">
            <stop offset="0" stopColor="#D8B477" stopOpacity="0" />
            <stop offset=".5" stopColor="#D8B477" stopOpacity=".85" />
            <stop offset="1" stopColor="#A58BFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id="vyBack"><rect x="0" y="0" width="200" height="100" /></clipPath>
          <clipPath id="vyFront"><rect x="0" y="100" width="200" height="100" /></clipPath>
        </defs>
        <g clipPath="url(#vyBack)" opacity=".55">
          <ellipse cx="100" cy="100" rx="90" ry="19.3" fill="none" stroke="url(#vyRing)" strokeWidth="9" opacity=".12" />
          <ellipse cx="100" cy="100" rx="94" ry="20" fill="none" stroke="url(#vyRing)" strokeWidth="1.6" opacity=".45" />
          <ellipse cx="100" cy="100" rx="80" ry="17" fill="none" stroke="url(#vyRing)" strokeWidth="1.2" />
        </g>
      </svg>

      {/* sphere */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[#0b0d2a]">
        <div className="vy-surface absolute inset-y-0 left-0 w-[200%]" />
        <div className="vy-clouds absolute inset-y-0 left-0 w-[200%] opacity-50 mix-blend-screen" />
        {/* lighting: day side top-left, terminator, night side, limb glow */}
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 28%, rgba(255,240,220,.18) 0%, transparent 38%), radial-gradient(circle at 70% 72%, rgba(3,4,14,.92) 18%, transparent 62%), linear-gradient(120deg, transparent 45%, rgba(216,180,119,.10) 52%, transparent 60%)" }} />
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: "inset -36px -28px 70px rgba(0,0,0,.7), inset 8px 6px 30px rgba(165,139,255,.35)" }} />
      </div>
      <div className="absolute inset-[-1px] rounded-full border border-amethyst/30 shadow-[0_0_80px_rgba(114,86,216,.35)]" />

      {/* ring — front half */}
      <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-[-34%] h-[168%] w-[168%] -rotate-[14deg]">
        <g clipPath="url(#vyFront)">
          <ellipse cx="100" cy="100" rx="90" ry="19.3" fill="none" stroke="url(#vyRing)" strokeWidth="9" opacity=".16" />
          <ellipse cx="100" cy="100" rx="94" ry="20" fill="none" stroke="url(#vyRing)" strokeWidth="1.6" opacity=".55" />
          <ellipse cx="100" cy="100" rx="80" ry="17" fill="none" stroke="url(#vyRing)" strokeWidth="1.2" />
          <ellipse cx="100" cy="100" rx="87" ry="18.5" fill="none" stroke="#F1DCAE" strokeWidth=".5" strokeLinecap="round" strokeDasharray="0.01 3.5" opacity=".7" className="vy-ring-dust" />
        </g>
      </svg>

      {/* orbiting moon */}
      <div className="vy-orbit absolute inset-[-22%]">
        <span className="absolute top-1/2 left-0 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#C9B8FF] shadow-[0_0_14px_rgba(201,184,255,.9)]" />
      </div>
    </div>
  );
}
