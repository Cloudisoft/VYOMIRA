import type { EvidencePackage, Factor, TimingWindow } from "./evidence";

/** Structured reading — the same shape is produced by the deterministic writer and the LLM path. */
export interface Reading {
  summary: string;
  factors: { id: string; statement: string; interpretation: string; polarity: Factor["polarity"] }[];
  traditionalInterpretation: string;
  timing: TimingWindow[];
  supportive: string[];
  challenging: string[];
  reflections: string[];
  notes: string[];
  generator: string; // "rules@interp-x" | "provider:model"
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

const REFLECTIONS: Record<string, string[]> = {
  general: ["Which part of your chart description feels most familiar, and which feels least like you?", "What would you like the current planetary period to help you build?"],
  career: ["What kind of work leaves you energized rather than depleted?", "Which skill would you invest in if you knew progress would be slow but durable?", "Where do you want more visibility, and where do you need more depth?"],
  love: ["What do you most need to feel emotionally safe with someone?", "Which relationship pattern would you like to grow beyond?"],
  marriage: ["What does a fair partnership look like to you in daily life?", "Which shared values matter more to you than compatibility on paper?"],
  wealth: ["Is your current focus on earning, keeping or growing resources?", "What does 'enough' look like for you over the next two years?"],
  education: ["Do you learn best through structure, mentors or self-directed exploration?", "Which subject would you study even without an exam?"],
  growth: ["What are you ready to let go of this year?", "Where in your life do you want more stillness, and where more courage?"],
};

export function deterministicReading(ev: EvidencePackage, question?: string): Reading {
  const top = ev.factors.slice(0, 8);
  const supportive = ev.factors.filter((f) => f.polarity === "supportive").slice(0, 5).map((f) => f.statement);
  const challenging = ev.factors.filter((f) => f.polarity === "challenging").slice(0, 5).map((f) => f.statement);
  const md = ev.core.currentMahadasha;
  const ad = ev.core.currentAntardasha;
  const balance = supportive.length > challenging.length ? "leans supportive" : supportive.length < challenging.length ? "asks for patience and conscious effort" : "is mixed";

  const summary = [
    question ? `You asked: “${question.trim().slice(0, 200)}”.` : null,
    `For ${ev.topicLabel.toLowerCase()}, the chart evidence ${balance}.`,
    md ? `You are in the ${md.lord} Mahadasha${ad ? ` with a ${ad.lord} Antardasha running until ${fmtDate(ad.end)}` : ""}.` : null,
    ev.timing[0] ? `The next period traditionally linked to this theme begins ${fmtDate(ev.timing[0].start)} (${ev.timing[0].label}).` : null,
  ].filter(Boolean).join(" ");

  const trad = top.map((f) => `${f.statement}. ${f.interpretation}`).join("\n\n");

  const notes = [
    "This reading was assembled by VYOMIRA's rule engine directly from your computed chart (no AI language model was used).",
    "Astrological interpretations are traditional and symbolic, not scientifically established predictions. Use them for reflection, not for medical, legal or financial decisions.",
    ...ev.confidence.notes,
  ];

  return {
    summary,
    factors: top.map(({ id, statement, interpretation, polarity }) => ({ id, statement, interpretation, polarity })),
    traditionalInterpretation: trad,
    timing: ev.timing,
    supportive,
    challenging,
    reflections: REFLECTIONS[ev.topic] ?? REFLECTIONS.general,
    notes,
    generator: `rules@${ev.rulesVersion}`,
  };
}

export function readingToMarkdown(r: Reading): string {
  const parts = [r.summary, "", "**What the chart shows**", ...r.factors.slice(0, 5).map((f) => `- ${f.statement} — ${f.interpretation}`)];
  if (r.timing.length) parts.push("", "**Periods to watch**", ...r.timing.slice(0, 4).map((t) => `- ${t.label}: ${fmtDate(t.start)}${t.end !== t.start ? ` → ${fmtDate(t.end)}` : ""} (${t.basis})`));
  if (r.reflections.length) parts.push("", "**To reflect on**", ...r.reflections.slice(0, 2).map((q) => `- ${q}`));
  return parts.join("\n");
}
