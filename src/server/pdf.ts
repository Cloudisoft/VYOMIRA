import "server-only";
import "regenerator-runtime/runtime"; // fontkit's Indic shaper (pdf-lib build) needs this global
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ReportContent } from "./reports";

/**
 * Report PDFs with embedded Noto fonts (SIL OFL). Devanagari is shaped by fontkit's Indic shaper
 * (conjuncts, pre-base matras, reph). Mixed-script lines are split into runs per script.
 */
const FONT_DIR = path.join(process.cwd(), "assets/fonts");
const read = (f: string) => fs.readFileSync(path.join(FONT_DIR, f));

export type PdfLang = "en" | "hi";

const LABELS: Record<PdfLang, Record<string, string>> = {
  en: { prepared: "Prepared for", summary: "Chart summary", placements: "Planetary placements (sidereal, Lahiri)", overview: "Summary", factors: "Chart factors and traditional interpretation", timing: "Periods to watch", indications: "Supportive and challenging indications", dasha: "Vimshottari Dasha timeline", reflect: "Reflection prompts", method: "Methodology", disclaimer: "Disclaimer & uncertainty", planet: "Planet", sign: "Sign", degree: "Degree", house: "House", nak: "Nakshatra", dignity: "Dignity", tagline: "Your Universe. Your Story.", maha: "Mahadasha" },
  hi: { prepared: "के लिए तैयार", summary: "कुंडली सारांश", placements: "ग्रह स्थिति (निरयण, लाहिड़ी)", overview: "सार", factors: "कुंडली के तथ्य और पारंपरिक व्याख्या", timing: "ध्यान देने योग्य अवधियाँ", indications: "सहायक और चुनौतीपूर्ण संकेत", dasha: "विंशोत्तरी दशा क्रम", reflect: "चिंतन के प्रश्न", method: "कार्यप्रणाली", disclaimer: "अस्वीकरण और अनिश्चितता", planet: "ग्रह", sign: "राशि", degree: "अंश", house: "भाव", nak: "नक्षत्र", dignity: "बल", tagline: "आपका ब्रह्मांड। आपकी कहानी।", maha: "महादशा" },
};

const HI_PLANET: Record<string, string> = { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" };
const HI_SIGN: Record<string, string> = { Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या", Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन" };
const HI_DIGNITY: Record<string, string> = { exalted: "उच्च", debilitated: "नीच", moolatrikona: "मूलत्रिकोण", own: "स्वराशि", neutral: "सम" };
/** Glyphs missing from the embedded fonts are mapped to safe equivalents. */
const safe = (s: string) => s.replace(/→/g, "–").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

export async function renderReportPdf(r: ReportContent, lang: PdfLang = "en"): Promise<Uint8Array> {
  const L = LABELS[lang];
  if (lang === "hi") r = { ...r, placements: r.placements.map((p) => ({ ...p, planet: HI_PLANET[p.planet] ?? p.planet, sign: HI_SIGN[p.sign] ?? p.sign, dignity: HI_DIGNITY[p.dignity] ?? p.dignity })) };
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${r.title} — VYOMIRA`);
  doc.setAuthor("VYOMIRA");
  doc.setLanguage(lang === "hi" ? "hi-IN" : "en-IN");
  const fonts = {
    // Latin Noto files are embedded whole: fontkit's subsetter drops glyphs from these builds.
    latin: await doc.embedFont(read("NotoSans-Regular.ttf"), { subset: false }),
    latinBold: await doc.embedFont(read("NotoSans-SemiBold.ttf"), { subset: false }),
    serif: await doc.embedFont(read("NotoSerif-Regular.ttf"), { subset: false }),
    deva: await doc.embedFont(read("NotoSansDevanagari-Regular.ttf"), { subset: true }),
    devaBold: await doc.embedFont(read("NotoSansDevanagari-SemiBold.ttf"), { subset: true }),
    devaSerif: await doc.embedFont(read("NotoSerifDevanagari-Regular.ttf"), { subset: true }),
  };
  type Style = "sans" | "bold" | "serif";
  const pick = (style: Style, devanagari: boolean): PDFFont =>
    devanagari ? (style === "bold" ? fonts.devaBold : style === "serif" ? fonts.devaSerif : fonts.deva) : style === "bold" ? fonts.latinBold : style === "serif" ? fonts.serif : fonts.latin;
  const runs = (text: string) => text.match(/[ऀ-ॿ‌‍]+(?:[\s।॥,.()]*[ऀ-ॿ‌‍]+)*|[^ऀ-ॿ‌‍]+/g) ?? [];
  const isDeva = (s: string) => /[ऀ-ॿ]/.test(s);
  const widthOf = (text: string, style: Style, size: number) => runs(safe(text)).reduce((w, run) => w + pick(style, isDeva(run)).widthOfTextAtSize(run, size), 0);
  const drawMixed = (pg: PDFPage, text: string, x: number, y: number, size: number, style: Style, color: ReturnType<typeof rgb>) => {
    let cx = x;
    for (const run of runs(safe(text))) {
      const f = pick(style, isDeva(run));
      pg.drawText(run, { x: cx, y, size, font: f, color });
      cx += f.widthOfTextAtSize(run, size);
    }
  };

  const navy = rgb(8 / 255, 13 / 255, 32 / 255), gold = rgb(216 / 255, 180 / 255, 119 / 255), violet = rgb(114 / 255, 86 / 255, 216 / 255), slate = rgb(0.35, 0.38, 0.47), moon = rgb(0.91, 0.89, 0.96);
  const W = 595, H = 842, M = 56;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
    drawMixed(page, "VYOMIRA", M, H - 30, 8, "bold", gold);
    drawMixed(page, r.title, W - M - widthOf(r.title, "sans", 8), H - 30, 8, "sans", slate);
  };
  const ensure = (h: number) => { if (y - h < M) newPage(); };
  const wrap = (text: string, style: Style, size: number, width: number) => {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const t = line ? `${line} ${word}` : word;
        if (widthOf(t, style, size) > width && line) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  };
  const para = (text: string, o: { style?: Style; size?: number; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const style = o.style ?? "sans", size = o.size ?? 10, lh = size * (lang === "hi" ? 1.75 : 1.5);
    for (const line of wrap(text, style, size, W - 2 * M - (o.indent ?? 0))) {
      ensure(lh);
      drawMixed(page, line, M + (o.indent ?? 0), y, size, style, o.color ?? navy);
      y -= lh;
    }
    y -= o.gap ?? 6;
  };
  const heading = (t: string) => { ensure(44); y -= 10; drawMixed(page, t, M, y, 15, "bold", violet); y -= 9; page.drawLine({ start: { x: M, y }, end: { x: M + 60, y }, thickness: 1, color: gold }); y -= 18; };

  // Cover
  page.drawRectangle({ x: 0, y: H - 270, width: W, height: 270, color: navy });
  drawMixed(page, "VYOMIRA", M, H - 80, 12, "bold", gold);
  drawMixed(page, L.tagline, M, H - 97, 9, "sans", moon);
  for (const [i, line] of wrap(r.title, "serif", 28, W - 2 * M).entries()) drawMixed(page, line, M, H - 165 - i * 34, 28, "serif", moon);
  drawMixed(page, `${L.prepared}: ${r.preparedFor} · ${r.generatedAt.slice(0, 10)}`, M, H - 235, 10, "sans", gold);
  y = H - 310;

  heading(L.summary);
  for (const s of r.chartSummary) { ensure(17); drawMixed(page, s.label, M, y, 10, "bold", slate); drawMixed(page, s.value, M + 170, y, 10, "sans", navy); y -= 17; }

  heading(L.placements);
  const cols = [0, 70, 150, 225, 310, 420];
  ensure(16);
  [L.planet, L.sign, L.degree, L.house, L.nak, L.dignity].forEach((h, i) => drawMixed(page, h, M + cols[i], y, 9, "bold", slate));
  y -= 15;
  for (const p of r.placements) {
    ensure(15);
    [p.planet + (p.retro ? " (R)" : ""), p.sign, p.degree, p.house, p.nakshatra, p.dignity].forEach((v, i) => drawMixed(page, v, M + cols[i], y, 9, "sans", navy));
    y -= 15;
  }

  heading(L.overview);
  para(r.reading.summary, { style: "serif", size: 12 });
  heading(L.factors);
  for (const f of r.reading.factors) { para(f.statement, { style: "bold", size: 10, gap: 2 }); para(f.interpretation, { size: 10, color: slate, gap: 10 }); }
  if (r.reading.timing.length) {
    heading(L.timing);
    for (const t of r.reading.timing) para(`• ${t.label}: ${t.start.slice(0, 10)}${t.end !== t.start ? ` → ${t.end.slice(0, 10)}` : ""} — ${t.basis}`, { size: 10 });
  }
  if (r.reading.supportive.length || r.reading.challenging.length) {
    heading(L.indications);
    for (const s of r.reading.supportive) para(`+ ${s}`, { size: 10 });
    for (const s of r.reading.challenging) para(`– ${s}`, { size: 10 });
  }
  if (r.dashaTable) {
    heading(L.dasha);
    for (const m of r.dashaTable) { para(`${lang === "hi" ? HI_PLANET[m.lord] ?? m.lord : m.lord} ${L.maha}  ${m.start} → ${m.end}`, { style: "bold", size: 10, gap: 2 }); para(m.antardashas.map((a) => `${a.lord} ${a.start}`).join("  ·  "), { size: 8, color: slate, gap: 8 }); }
  }
  heading(L.reflect);
  for (const q of r.reading.reflections) para(`• ${q}`, { style: "serif", size: 11 });
  heading(L.method);
  for (const m of r.methodology) para(m, { size: 9, color: slate });
  heading(L.disclaimer);
  for (const d of r.disclaimer) para(d, { size: 9, color: slate });

  return doc.save();
}
