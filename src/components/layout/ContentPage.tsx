import type { ReactNode } from "react";

export function ContentPage({ eyebrow, title, intro, children, notice }: { eyebrow: string; title: string; intro?: string; children: ReactNode; notice?: ReactNode }) {
  return (
    <article className="relative px-6 pt-36 pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,rgba(114,86,216,.18),transparent)]" />
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">{title}</h1>
        {intro && <p className="mt-5 text-lg leading-relaxed text-slate">{intro}</p>}
        {notice && <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/[.05] p-4 text-sm text-gold/90">{notice}</div>}
        <div className="prose-legal mt-10">{children}</div>
      </div>
    </article>
  );
}
