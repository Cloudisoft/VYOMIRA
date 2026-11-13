import "server-only";
import "regenerator-runtime/runtime";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ReportDoc } from "@/lib/readings/report";
import { rs } from "@/lib/readings/strings";
import type { RLang } from "@/lib/readings/lang";

const FONT_DIR = path.join(process.cwd(), "assets/fonts");
const read = (f: string) => fs.readFileSync(path.join(FONT_DIR, f));
const safe = (s: string) => s.replace(/→/g, "–").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[✓×·]/g, (c) => ({ "✓": "", "×": "x", "·": "-" })[c] ?? c);
const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|\s)_(.+?)_(?=\s|$|[.,])/g, "$1$2").replace(/^#{1,4}\s+/gm, "");

/** PDF for any section-based reading (numerology / tarot / palmistry). English + Devanagari. */
export async function renderReadingPdf(doc0: ReportDoc, opts: { preparedFor: string; date: Date; lang?: RLang; extra?: { heading: string; lines: string[] } }) {
  const S = rs(opts.lang ?? "en");
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${doc0.title} — VYOMIRA`);
  doc.setAuthor("VYOMIRA");
  const fonts = {
    latin: await doc.embedFont(read("NotoSans-Regular.ttf"), { subset: false }),
    bold: await doc.embedFont(read("NotoSans-SemiBold.ttf"), { subset: false }),
    serif: await doc.embedFont(read("NotoSerif-Regular.ttf"), { subset: false }),
    deva: await doc.embedFont(read("NotoSansDevanagari-Regular.ttf"), { subset: true }),
    devaBold: await doc.embedFont(read("NotoSansDevanagari-SemiBold.ttf"), { subset: true }),
  };
  type Style = "sans" | "bold" | "serif";
  const isDeva = (s: string) => /[ऀ-ॿ]/.test(s);
  const pick = (st: Style, d: boolean): PDFFont => (d ? (st === "bold" ? fonts.devaBold : fonts.deva) : st === "bold" ? fonts.bold : st === "serif" ? fonts.serif : fonts.latin);
  const runs = (t: string) => t.match(/[ऀ-ॿ‌‍]+(?:[\s।॥,.()]*[ऀ-ॿ‌‍]+)*|[^ऀ-ॿ‌‍]+/g) ?? [];
  const widthOf = (t: string, st: Style, size: number) => runs(safe(t)).reduce((w, r) => w + pick(st, isDeva(r)).widthOfTextAtSize(r, size), 0);
  const draw = (pg: PDFPage, t: string, x: number, y: number, size: number, st: Style, color: ReturnType<typeof rgb>) => { let cx = x; for (const r of runs(safe(t))) { const f = pick(st, isDeva(r)); pg.drawText(r, { x: cx, y, size, font: f, color }); cx += f.widthOfTextAtSize(r, size); } };
  const navy = rgb(8 / 255, 13 / 255, 32 / 255), gold = rgb(216 / 255, 180 / 255, 119 / 255), violet = rgb(114 / 255, 86 / 255, 216 / 255), slate = rgb(0.35, 0.38, 0.47), moon = rgb(0.91, 0.89, 0.96);
  const W = 595, H = 842, M = 56;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const newPage = () => { page = doc.addPage([W, H]); y = H - M; draw(page, "VYOMIRA", M, H - 30, 8, "bold", gold); draw(page, doc0.title, W - M - widthOf(doc0.title, "sans", 8), H - 30, 8, "sans", slate); };
  const ensure = (h: number) => { if (y - h < M) newPage(); };
  const wrap = (text: string, st: Style, size: number, width: number) => {
    const lines: string[] = [];
    for (const p of text.split("\n")) { let line = ""; for (const w of p.split(/\s+/)) { const t = line ? `${line} ${w}` : w; if (widthOf(t, st, size) > width && line) { lines.push(line); line = w; } else line = t; } lines.push(line); }
    return lines;
  };
  const para = (text: string, o: { st?: Style; size?: number; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const st = o.st ?? "sans", size = o.size ?? 10.5, lh = size * (isDeva(text) ? 1.75 : 1.5);
    for (const line of wrap(text, st, size, W - 2 * M - (o.indent ?? 0))) { ensure(lh); draw(page, line, M + (o.indent ?? 0), y, size, st, o.color ?? navy); y -= lh; }
    y -= o.gap ?? 6;
  };
  const heading = (t: string) => { ensure(44); y -= 10; draw(page, t, M, y, 15, "bold", violet); y -= 9; page.drawLine({ start: { x: M, y }, end: { x: M + 60, y }, thickness: 1, color: gold }); y -= 18; };

  page.drawRectangle({ x: 0, y: H - 250, width: W, height: 250, color: navy });
  draw(page, "VYOMIRA", M, H - 80, 12, "bold", gold);
  draw(page, S.tagline, M, H - 97, 9, "sans", moon);
  for (const [i, line] of wrap(doc0.title, "serif", 26, W - 2 * M).entries()) draw(page, line, M, H - 150 - i * 32, 26, "serif", moon);
  draw(page, `${doc0.subtitle ? doc0.subtitle + " · " : ""}${S.preparedFor}: ${opts.preparedFor} · ${opts.date.toISOString().slice(0, 10)}`, M, H - 220, 9.5, "sans", gold);
  y = H - 290;

  if (opts.extra) { heading(opts.extra.heading); for (const l of opts.extra.lines) para(l, { st: "bold", size: 11, gap: 2 }); y -= 6; }
  for (const s of doc0.sections) {
    heading(strip(s.title));
    for (const block of s.body.split(/\n{2,}/)) {
      for (const ln of block.split("\n")) {
        const bullet = /^\s*[-*•]\s+/.test(ln);
        para(strip(bullet ? `• ${ln.replace(/^\s*[-*•]\s+/, "")}` : ln), { indent: bullet ? 8 : 0, gap: bullet ? 2 : 6 });
      }
      y -= 4;
    }
  }
  heading(S.method);
  for (const m of doc0.method) para(m, { size: 9, color: slate });
  heading(S.note);
  para(doc0.disclaimer, { size: 9, color: slate });
  return doc.save();
}
