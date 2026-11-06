/** Minimal, safe markdown → HTML (escape first, then a tiny subset: headings, bold, italic, bullets, paragraphs). */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])_(.+?)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");

export function renderMarkdown(md: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${l}</li>`).join("")}</ul>`); list = []; } };
  for (const block of md.split(/\n/)) {
    const line = block.trimEnd();
    if (/^\s*[-•*]\s+/.test(line)) { list.push(inline(line.replace(/^\s*[-•*]\s+/, ""))); continue; }
    flush();
    const h = /^(#{2,4})\s+(.+)$/.exec(line.trim());
    if (h) { out.push(`<h4 class="md-h">${inline(h[2])}</h4>`); continue; }
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join("");
}
