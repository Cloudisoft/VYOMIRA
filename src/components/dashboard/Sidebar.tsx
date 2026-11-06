"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Orbit, CircleDot, Sparkles, CalendarRange, Sun, HeartHandshake, FileText, Bookmark, CreditCard, Settings, Shield, LogOut, Menu, X, BookOpen } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export type NavLabels = { home: string; guide: string; kundli: string; aura: string; timeline: string; daily: string; compat: string; reports: string; saved: string; billing: string; settings: string; admin: string; signOut: string };
const NAV = (L: NavLabels) => [
  { href: "/dashboard", label: L.home, icon: Orbit },
  { href: "/dashboard/guide", label: L.guide, icon: BookOpen },
  { href: "/dashboard/kundli", label: L.kundli, icon: CircleDot },
  { href: "/dashboard/aura", label: L.aura, icon: Sparkles },
  { href: "/dashboard/timeline", label: L.timeline, icon: CalendarRange },
  { href: "/dashboard/daily", label: L.daily, icon: Sun },
  { href: "/dashboard/compatibility", label: L.compat, icon: HeartHandshake },
  { href: "/dashboard/reports", label: L.reports, icon: FileText },
  { href: "/dashboard/saved", label: L.saved, icon: Bookmark },
  { href: "/dashboard/billing", label: L.billing, icon: CreditCard },
  { href: "/dashboard/settings", label: L.settings, icon: Settings },
];

export function Sidebar({ name, email, isAdmin, labels }: { name: string; email: string; isAdmin: boolean; labels: NavLabels }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...NAV(labels), { href: "/admin", label: labels.admin, icon: Shield }] : NAV(labels);
  const content = (
    <div className="flex h-full flex-col">
      <Link href="/" className="px-2" aria-label="VYOMIRA home"><Logo /></Link>
      <nav aria-label="Dashboard" className="mt-10 flex-1">
        <ul className="space-y-1">
          {items.map((n) => {
            const active = n.href === "/dashboard" ? path === n.href : path.startsWith(n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-gradient-to-r from-gold/15 to-transparent text-moon" : "text-slate hover:bg-moon/5 hover:text-moon")}>
                  {active && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-gold" />}
                  <n.icon className={cn("h-4 w-4", active ? "text-gold" : "text-slate group-hover:text-amethyst")} />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6 rounded-2xl border hairline bg-surface/50 p-4">
        <p className="truncate text-sm text-moon">{name}</p>
        <p className="truncate text-xs text-slate">{email}</p>
        <button onClick={async () => { await signOut(); router.push("/"); router.refresh(); }} className="mt-3 inline-flex items-center gap-2 text-xs text-slate hover:text-moon"><LogOut className="h-3.5 w-3.5" /> {labels.signOut}</button>
      </div>
    </div>
  );
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b hairline bg-navy/85 px-5 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard"><Logo /></Link>
        <button onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} className="p-2">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-navy/97 px-6 pt-20 pb-6 lg:hidden">{content}</div>}
      <aside className="sticky top-0 hidden h-dvh border-r hairline bg-space/60 px-4 py-8 lg:block">{content}</aside>
    </>
  );
}
