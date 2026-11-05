import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ReportContent } from "./reports";

/** Map text into WinAnsi-safe characters for the standard PDF fonts. */
const clean = (s: string) =>
  s.replace(/[′]/g, "'").replace(/[″]/g, '"').replace(/→/g, "->").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–]/g, "-").replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ—•°]/g, "");

export async function renderReportPdf(r: ReportContent): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${r.title} — VYOMIRA`);
  doc.setAuthor("VYOMIRA");
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(8 / 255, 13 / 255, 32 / 255);
  const gold = rgb(216 / 255, 180 / 255, 119 / 255);
  const violet = rgb(114 / 255, 86 / 255, 216 / 255);
  const slate = rgb(0.35, 0.38, 0.47);
  const W = 595, H = 842, M = 56;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;

  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
    page.drawText("VYOMIRA", { x: M, y: H - 30, size: 8, font: sansBold, color: gold });
    page.drawText(clean(r.title), { x: W - M - sans.widthOfTextAtSize(clean(r.title), 8), y: H - 30, size: 8, font: sans, color: slate });
  };
  const ensure = (h: number) => { if (y - h < M) newPage(); };
  const wrap = (text: string, font: PDFFont, size: number, width: number) => {
    const lines: string[] = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const t = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(t, size) > width && line) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  };
  const para = (text: string, o: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const font = o.font ?? sans, size = o.size ?? 10, lh = size * 1.45;
    for (const line of wrap(text, font, size, W - 2 * M - (o.indent ?? 0))) {
      ensure(lh);
      page.drawText(line, { x: M + (o.indent ?? 0), y, size, font, color: o.color ?? navy });
      y -= lh;
    }
    y -= o.gap ?? 6;
  };
  const heading = (t: string) => { ensure(40); y -= 8; page.drawText(clean(t), { x: M, y, size: 15, font: serifBold, color: violet }); y -= 8; page.drawLine({ start: { x: M, y }, end: { x: M + 60, y }, thickness: 1, color: gold }); y -= 16; };

  // Cover
  page.drawRectangle({ x: 0, y: H - 260, width: W, height: 260, color: navy });
  page.drawText("VYOMIRA", { x: M, y: H - 80, size: 12, font: sansBold, color: gold });
  page.drawText("Your Universe. Your Story.", { x: M, y: H - 96, size: 9, font: sans, color: rgb(0.8, 0.78, 0.9) });
  page.drawText(clean(r.title), { x: M, y: H - 170, size: 28, font: serif, color: rgb(0.91, 0.89, 0.96) });
  page.drawText(clean(`Prepared for ${r.preparedFor} · ${r.generatedAt.slice(0, 10)}`), { x: M, y: H - 200, size: 10, font: sans, color: gold });
  y = H - 300;

  heading("Chart summary");
  for (const s of r.chartSummary) { ensure(16); page.drawText(clean(s.label), { x: M, y, size: 10, font: sansBold, color: slate }); page.drawText(clean(s.value), { x: M + 150, y, size: 10, font: sans, color: navy }); y -= 16; }

  heading("Planetary placements (sidereal, Lahiri)");
  const cols = [0, 70, 150, 220, 300, 410];
  const hdr = ["Planet", "Sign", "Degree", "House", "Nakshatra", "Dignity"];
  ensure(16);
  hdr.forEach((h, i) => page.drawText(h, { x: M + cols[i], y, size: 9, font: sansBold, color: slate }));
  y -= 14;
  for (const p of r.placements) {
    ensure(14);
    [p.planet + (p.retro ? " (R)" : ""), p.sign, p.degree, p.house, p.nakshatra, p.dignity].forEach((v, i) => page.drawText(clean(v), { x: M + cols[i], y, size: 9, font: sans, color: navy }));
    y -= 14;
  }

  heading("Summary");
  para(r.reading.summary, { font: serif, size: 12 });
  heading("Chart factors and traditional interpretation");
  for (const f of r.reading.factors) {
    para(f.statement, { font: sansBold, size: 10, gap: 2 });
    para(f.interpretation, { size: 10, color: slate, gap: 10 });
  }
  if (r.reading.timing.length) {
    heading("Periods to watch");
    for (const t of r.reading.timing) para(`• ${t.label}: ${t.start.slice(0, 10)}${t.end !== t.start ? ` -> ${t.end.slice(0, 10)}` : ""} — ${t.basis}`, { size: 10 });
  }
  if (r.reading.supportive.length || r.reading.challenging.length) {
    heading("Supportive and challenging indications");
    for (const s of r.reading.supportive) para(`+ ${s}`, { size: 10 });
    for (const s of r.reading.challenging) para(`– ${s}`, { size: 10 });
  }
  if (r.dashaTable) {
    heading("Vimshottari Dasha timeline");
    for (const m of r.dashaTable) {
      para(`${m.lord} Mahadasha  ${m.start} -> ${m.end}`, { font: sansBold, size: 10, gap: 2 });
      para(m.antardashas.map((a) => `${a.lord} ${a.start}`).join("  ·  "), { size: 8, color: slate, gap: 8 });
    }
  }
  heading("Reflection prompts");
  for (const q of r.reading.reflections) para(`• ${q}`, { font: serif, size: 11 });
  heading("Methodology");
  for (const m of r.methodology) para(m, { size: 9, color: slate });
  heading("Disclaimer & uncertainty");
  for (const d of r.disclaimer) para(d, { size: 9, color: slate });

  return doc.save();
}
