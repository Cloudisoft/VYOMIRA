"use client";
import Link from "next/link";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 text-5xl">A cloud passed over.</h1>
      <p className="mt-4 max-w-md text-slate">We couldn't load this page. Nothing you entered has been lost. Please try again.</p>
      <div className="mt-8 flex gap-3"><button onClick={reset} className="btn-primary">Try again</button><Link href="/" className="btn-ghost">Home</Link></div>
    </main>
  );
}
