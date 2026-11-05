"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export const SUGGESTIONS: Record<string, string[]> = {
  Career: ["When is a traditionally favorable phase for career changes?", "What does my 10th house say about my work style?"],
  Relationships: ["Which relationship patterns appear in my chart?", "How is Venus placed in my chart?"],
  Timing: ["What does my current Mahadasha indicate?", "What changes when my next Antardasha begins?"],
  Growth: ["How do current planetary transits relate to my personal growth?", "What does my Moon nakshatra say about my emotional nature?"],
};

export function AskBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (x: string) => router.push(`/dashboard/aura?q=${encodeURIComponent(x)}`);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) go(q.trim()); }} className="flex gap-2">
        <label htmlFor="ask" className="sr-only">Ask AURA</label>
        <input id="ask" className="field" placeholder="What would you like to understand about your chart?" value={q} onChange={(e) => setQ(e.target.value)} maxLength={600} />
        <button className="btn-primary !px-4" aria-label="Ask"><Send className="h-4 w-4" /></button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(SUGGESTIONS).flat().slice(0, 4).map((s) => <button key={s} onClick={() => go(s)} className="rounded-full border hairline px-3 py-1.5 text-left text-xs text-slate hover:border-amethyst/40 hover:text-moon">{s}</button>)}
      </div>
    </div>
  );
}
