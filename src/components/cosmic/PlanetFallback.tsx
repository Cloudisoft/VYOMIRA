import { cn } from "@/lib/utils";

/** CSS-only planet used on mobile, low-power devices, reduced motion, and while WebGL loads. */
export function PlanetFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative aspect-square", className)}>
      <div className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(114,86,216,.35),transparent_62%)] blur-2xl" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 30%, #6d5bd0 0%, #3b2d8f 22%, #1b1854 48%, #0b0d2a 72%, #070a1c 100%)",
          boxShadow: "inset -40px -30px 80px rgba(0,0,0,.65), inset 10px 6px 40px rgba(165,139,255,.25), 0 0 80px rgba(114,86,216,.35)",
        }}
      />
      <div className="absolute inset-0 rounded-full opacity-40 mix-blend-screen" style={{ background: "repeating-linear-gradient(-18deg, transparent 0 14px, rgba(165,139,255,.12) 14px 18px)", maskImage: "radial-gradient(circle at 35% 35%, black 30%, transparent 70%)" }} />
      <div className="absolute inset-[-1px] rounded-full border border-amethyst/30" />
      <svg viewBox="0 0 200 200" className="absolute inset-[-28%] h-[156%] w-[156%] -rotate-12">
        <ellipse cx="100" cy="100" rx="96" ry="22" fill="none" stroke="url(#ring)" strokeWidth=".6" />
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor="#D8B477" stopOpacity="0" />
            <stop offset=".5" stopColor="#D8B477" stopOpacity=".9" />
            <stop offset="1" stopColor="#D8B477" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
