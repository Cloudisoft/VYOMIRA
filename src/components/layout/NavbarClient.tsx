"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#birth-chart", label: "Birth Chart" },
  { href: "/#aura", label: "AI Astrologer" },
  { href: "/pricing", label: "Pricing" },
  { href: "/learn", label: "Learn" },
];

export function NavbarClient() {
  const { data: session } = useSession();
  const signedIn = Boolean(session);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-4")}>
      <nav aria-label="Primary" className={cn("mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2 transition-all duration-500 sm:px-6", scrolled && "glass mx-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,.8)] xl:mx-auto")}>
        <Link href="/" aria-label="VYOMIRA home" className="shrink-0"><Logo /></Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group relative rounded-full px-3.5 py-2 text-sm text-moon/75 transition-colors hover:text-moon">
                {l.label}
                <span className="absolute inset-x-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-gold/0 via-gold to-gold/0 transition-transform duration-500 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary !py-2.5 !px-5 text-sm">My Universe</Link>
          ) : (
            <>
              <Link href="/sign-in" className="rounded-full px-4 py-2 text-sm text-moon/80 hover:text-moon">Sign In</Link>
              <Link href="/onboarding" className="btn-primary !py-2.5 !px-5 text-sm">Get Started</Link>
            </>
          )}
        </div>
        <button className="rounded-full p-2 text-moon lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-0 -z-10 bg-navy/95 backdrop-blur-xl lg:hidden">
            <motion.ul initial={{ y: 12 }} animate={{ y: 0 }} className="flex h-full flex-col justify-center gap-2 px-8">
              {LINKS.map((l) => (
                <li key={l.href}><Link onClick={() => setOpen(false)} href={l.href} className="block py-3 font-display text-3xl text-moon">{l.label}</Link></li>
              ))}
              <li className="mt-8 flex flex-col gap-3">
                {signedIn ? (
                  <Link onClick={() => setOpen(false)} href="/dashboard" className="btn-primary">My Universe</Link>
                ) : (
                  <>
                    <Link onClick={() => setOpen(false)} href="/onboarding" className="btn-primary">Get Started</Link>
                    <Link onClick={() => setOpen(false)} href="/sign-in" className="btn-ghost">Sign In</Link>
                  </>
                )}
              </li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
