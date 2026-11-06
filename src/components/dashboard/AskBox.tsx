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

/** Suggested questions per language (plain, everyday wording). */
export const SUGGESTIONS_L: Record<"en" | "hi" | "hinglish", Record<string, string[]>> = {
  en: { Career: ["How will my career be in the next 2 years?", "Is this a good time to change jobs?"], "Love & marriage": ["When is a good time for marriage?", "How will my relationship be this year?"], "Money & business": ["Is this a good time to start a business?", "How will my finances be next year?"], "Family & luck": ["How will my family life be this year?", "When will luck support me?"] },
  hi: { "करियर": ["अगले 2 साल में मेरा करियर कैसा रहेगा?", "क्या यह नौकरी बदलने का अच्छा समय है?"], "प्रेम और विवाह": ["विवाह के लिए अच्छा समय कब है?", "इस साल मेरा रिश्ता कैसा रहेगा?"], "धन और व्यापार": ["क्या यह व्यापार शुरू करने का अच्छा समय है?", "अगले साल मेरी आर्थिक स्थिति कैसी रहेगी?"], "परिवार और भाग्य": ["इस साल मेरा पारिवारिक जीवन कैसा रहेगा?", "भाग्य मेरा साथ कब देगा?"] },
  hinglish: { Career: ["Agle 2 saal mein mera career kaisa rahega?", "Kya yeh job badalne ka achha time hai?"], "Pyaar & shaadi": ["Shaadi ke liye achha time kab hai?", "Is saal mera rishta kaisa rahega?"], "Paisa & business": ["Kya yeh business shuru karne ka achha time hai?", "Agle saal meri financial condition kaisi rahegi?"], "Parivaar & bhagya": ["Is saal meri family life kaisi rahegi?", "Bhagya mera saath kab dega?"] },
};

export function AskBox({ lang = "en" }: { lang?: "en" | "hi" | "hinglish" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (x: string) => router.push(`/dashboard/aura?q=${encodeURIComponent(x)}`);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) go(q.trim()); }} className="flex gap-2">
        <label htmlFor="ask" className="sr-only">Ask AURA</label>
        <input id="ask" className="field" placeholder={lang === "hi" ? "अपनी कुंडली के बारे में क्या जानना चाहेंगे?" : lang === "hinglish" ? "Apni kundli ke baare mein kya jaanna chahenge?" : "What would you like to understand about your chart?"} value={q} onChange={(e) => setQ(e.target.value)} maxLength={600} />
        <button className="btn-primary !px-4" aria-label="Ask"><Send className="h-4 w-4" /></button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(SUGGESTIONS_L[lang]).flat().filter((_, i) => i % 2 === 0).map((s) => <button key={s} onClick={() => go(s)} className="rounded-full border hairline px-3 py-1.5 text-left text-xs text-slate hover:border-amethyst/40 hover:text-moon">{s}</button>)}
      </div>
    </div>
  );
}
