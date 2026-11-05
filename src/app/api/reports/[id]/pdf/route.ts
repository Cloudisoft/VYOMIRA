import { authed, err } from "@/server/http";
import { db } from "@/server/db";
import { renderReportPdf } from "@/server/pdf";
import type { ReportContent } from "@/server/reports";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authed<Ctx>("report-pdf", async (_req, { user, params }) => {
  const { id } = await params;
  const r = await db.report.findFirst({ where: { id, userId: user.id } });
  if (!r) return err(404, "Not found");
  const bytes = await renderReportPdf(r.content as unknown as ReportContent);
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="vyomira-${r.type}.pdf"`, "Cache-Control": "private, no-store" },
  });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
