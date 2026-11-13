/**
 * Centralised report architecture shared by every reading type.
 *
 * Each section declares what it may talk about (scope), the evidence it needs, and which earlier
 * sections it builds on. Writers receive the scope and the *titles + first lines* of earlier
 * sections so they reference rather than repeat them. A final validation pass removes repeated
 * paragraphs, repeated intros/disclaimers and near-duplicates, and reports what it removed.
 */
export interface SectionSpec {
  id: string;
  title: string;
  /** What this section covers — and implicitly, what it must not re-explain. */
  scope: string;
  /** Evidence keys the section must be grounded in. */
  requires: string[];
  /** Earlier sections this one may refer back to (never restate). */
  dependsOn?: string[];
}

export interface ReportSection { id: string; title: string; body: string; evidence?: string[] }

export interface ReportDoc {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  /** Shown once, at the end — never generated per section. */
  disclaimer: string;
  method: string[];
  validation?: { removed: { section: string; reason: string; text: string }[] };
}

const words = (s: string) => s.toLowerCase().replace(/[*_`#>\[\]()]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

function shingles(s: string, n = 3) {
  const w = words(s);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

export function similarity(a: string, b: string) {
  const A = shingles(a), B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => { if (B.has(x)) inter++; });
  return inter / Math.min(A.size, B.size);
}

/** Paragraph openers that signal boilerplate when they recur. */
const BOILERPLATE = [
  /^(in this (section|report)|this (section|report) (will|covers|explores))/i,
  /^(remember|please note|note that|disclaimer)[,:]?\s/i,
  /(for entertainment|not (a substitute|professional) (for )?(medical|legal|financial)|interpretive practice)/i,
  /^(in (summary|conclusion)|to (sum up|conclude)|overall,)/i,
];

/**
 * Remove repeated content across sections. Keeps the first occurrence; drops later paragraphs
 * that are exact or near duplicates (≥ threshold shingle overlap) and recurring boilerplate.
 * The final section (summary) may use one concluding opener; other sections may not.
 */
export function dedupeReport(doc: ReportDoc, threshold = 0.6): ReportDoc {
  const seen: string[] = [];
  const removed: { section: string; reason: string; text: string }[] = [];
  const lastId = doc.sections[doc.sections.length - 1]?.id;
  const sections = doc.sections.map((sec) => {
    const paras = sec.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const kept: string[] = [];
    for (const p of paras) {
      const isHeading = /^#{1,4}\s/.test(p) || p.length < 25;
      if (!isHeading) {
        const dup = seen.find((q) => similarity(p, q) >= threshold);
        if (dup) { removed.push({ section: sec.id, reason: "repeats earlier content", text: p.slice(0, 120) }); continue; }
        const boiler = BOILERPLATE.findIndex((re) => re.test(p));
        if (boiler === 2) { removed.push({ section: sec.id, reason: "disclaimer belongs only at the end", text: p.slice(0, 120) }); continue; }
        if (boiler === 3 && sec.id !== lastId) { removed.push({ section: sec.id, reason: "concluding filler outside the summary", text: p.slice(0, 120) }); continue; }
        if (boiler === 0 || boiler === 1) { removed.push({ section: sec.id, reason: "filler intro", text: p.slice(0, 120) }); continue; }
        seen.push(p);
      }
      kept.push(p);
    }
    return { ...sec, body: kept.join("\n\n") };
  }).filter((s) => s.body.trim().length > 0);
  return { ...doc, sections, validation: { removed } };
}

/** Throws if a report still contains duplicated paragraphs (used in tests and before saving). */
export function assertNoRepetition(doc: ReportDoc, threshold = 0.6) {
  const paras = doc.sections.flatMap((s) => s.body.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length >= 25 && !/^#/.test(p)));
  for (let i = 0; i < paras.length; i++) for (let j = i + 1; j < paras.length; j++) {
    if (similarity(paras[i], paras[j]) >= threshold) throw new Error(`Repeated content: "${paras[j].slice(0, 60)}…"`);
  }
}

export const READING_DISCLAIMER = {
  numerology: "Numerology is a traditional interpretive practice, not a science. The numbers above are calculated exactly; what they mean is a matter of tradition and reflection, not prediction. Please don't base medical, legal or financial decisions on this reading.",
  tarot: "Tarot is a reflective, interpretive practice. The cards you drew were chosen with secure randomness and are interpreted by tradition; they do not predict fixed outcomes. Please don't base medical, legal or financial decisions on this reading.",
  palmistry: "Palmistry is a traditional interpretive practice, not a science. Observations describe only what is visible in your photos; interpretations are traditional meanings, not predictions. Please don't base medical, legal or financial decisions on this reading.",
} as const;
