import { authed, err } from "@/server/http";
import { db } from "@/server/db";
import { renderReadingPdf } from "@/server/readings/pdf";
import type { ReportDoc } from "@/lib/readings/report";
import { rs } from "@/lib/readings/strings";
import { toRLang } from "@/lib/readings/lang";
import { positionL, type SpreadId } from "@/lib/readings/tarot";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authed<Ctx>("reading-pdf", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id, status: "READY" } });
  const res = r?.result as { report?: ReportDoc; profile?: { loShu: { grid: { n: number; count: number }[][] } }; cards?: { position: string; name: string; reversed: boolean }[] } | null;
  if (!r || !res?.report) return err(404, "Not found");
  const lang = toRLang(r.language), S = rs(lang);
  const extra = res.profile ? { heading: S.loShu, lines: res.profile.loShu.grid.map((row) => row.map((c) => (c.count ? String(c.n).repeat(c.count) : "-")).join("    ")) }
    : res.cards ? { heading: S.yourCards, lines: res.cards.map((c) => `${positionL(r.tier as SpreadId, c.position, lang).label}: ${c.name}${c.reversed ? ` (${S.reversedTag})` : ""}`) } : undefined;
  const bytes = await renderReadingPdf(res.report, { preparedFor: user.name, date: r.generatedAt ?? r.createdAt, lang, extra });
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="vyomira-${r.category}-${r.id.slice(-6)}.pdf"`, "Cache-Control": "private, no-store" } });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
