import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** "Back to home" pill used on every page outside the dashboard. */
export function BackHome({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 rounded-full border border-amethyst/25 bg-navy/60 px-3.5 py-1.5 text-sm text-slate backdrop-blur transition-colors hover:border-amethyst/50 hover:text-moon ${className}`}>
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
    </Link>
  );
}
