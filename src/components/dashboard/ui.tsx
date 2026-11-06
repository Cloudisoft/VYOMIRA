import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, intro, action }: { eyebrow: string; title: ReactNode; intro?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-slate">{intro}</p>}
      </div>
      {action}
    </header>
  );
}

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn("glass rounded-[1.5rem] p-6", className)}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-4">{title && <h2 className="font-display text-2xl">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export function NoChart({ t }: { t?: { title: string; text: string; cta: string } }) {
  const x = t ?? { title: "Your sky awaits", text: "Add your birth details to calculate your Kundli. It takes about a minute.", cta: "Enter birth details" };
  return (
    <div className="glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
      <h2 className="font-display text-4xl">{x.title}</h2>
      <p className="mt-3 text-slate">{x.text}</p>
      <Link href="/onboarding" className="btn-primary mt-8">{x.cta}</Link>
    </div>
  );
}
