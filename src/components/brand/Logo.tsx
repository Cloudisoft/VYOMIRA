import { cn } from "@/lib/utils";
import { useId } from "react";

/**
 * VYOMIRA mark: a V-shaped constellation (five stellar points) cradling a single lotus petal,
 * held inside a thin orbital ring with one luminous star at its zenith.
 */
export function LogoMark({ className, title = "VYOMIRA" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} role="img" aria-label={title} fill="none">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1DCAE" />
          <stop offset=".55" stopColor="#D8B477" />
          <stop offset="1" stopColor="#B98D4F" />
        </linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A58BFF" />
          <stop offset="1" stopColor="#7256D8" />
        </linearGradient>
        <radialGradient id={`s${id}`}>
          <stop offset="0" stopColor="#FFF6E3" />
          <stop offset="1" stopColor="#D8B477" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M40.21 11.45A24 24 0 1 1 23.79 11.45" stroke={`url(#g${id})`} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M32 50C27.2 42.4 27.4 34.6 32 27.6C36.6 34.6 36.8 42.4 32 50Z" fill={`url(#v${id})`} opacity=".9" />
      <polyline points="17.5,25 23.5,36 32,50 40.5,36 46.5,25" stroke={`url(#g${id})`} strokeWidth="1.1" strokeLinejoin="round" opacity=".85" />
      {[[17.5, 25], [23.5, 36], [40.5, 36], [46.5, 25]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.7" fill="#F1DCAE" />
      ))}
      <circle cx="32" cy="50" r="2.3" fill="#FFF3D6" />
      <circle cx="32" cy="10" r="6" fill={`url(#s${id})`} opacity=".7" />
      <path d="M32 3.2L33.4 8.6L38.8 10L33.4 11.4L32 16.8L30.6 11.4L25.2 10L30.6 8.6Z" fill="#FFF3D6" />
    </svg>
  );
}

export function Logo({ variant = "horizontal", className, showTagline = false }: { variant?: "horizontal" | "stacked" | "icon"; className?: string; showTagline?: boolean }) {
  if (variant === "icon") return <LogoMark className={className} />;
  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-2", className)}>
        <LogoMark className="h-16 w-16" />
        <span className="font-display text-3xl tracking-[0.28em] text-gradient-gold">VYOMIRA</span>
        {showTagline && <span className="text-[0.62rem] tracking-[0.4em] text-moon/80 uppercase">Your Universe. Your Story.</span>}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] tracking-[0.24em] text-gradient-gold">VYOMIRA</span>
        {showTagline && <span className="mt-1 text-[0.55rem] tracking-[0.36em] text-moon/70 uppercase">Your Universe. Your Story.</span>}
      </span>
    </span>
  );
}
