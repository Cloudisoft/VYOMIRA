import { authed, err } from "@/server/http";
import { db } from "@/server/db";
import { renderReportPdf } from "@/server/pdf";
import type { ReportContent } from "@/server/reports";
import { hasConsent } from "@/server/consent";
import { translateReportToHindi } from "@/server/ai/translate";
import { recordTokenUsage } from "@/server/billing/entitlements";

type Ctx = { params: Promise<{ id: string }> };
type Stored = ReportContent & { translations?: { hi?: ReportContent } };

export const maxDuration = 120;

/** GET /api/reports/:id/pdf?lang=hi — Hindi is translated once (with AI consent) and stored with the report. */
export const GET = authed<Ctx>("report-pdf", async (req, { user, params }) => {
  const { id } = await params;
  const lang = new URL(req.url).searchParams.get("lang") === "hi" ? "hi" : "en";
  const r = await db.report.findFirst({ where: { id, userId: user.id } });
  if (!r) return err(404, "Not found");
  const stored = r.content as unknown as Stored;
  let content: ReportContent = stored;
  if (lang === "hi") {
    if (stored.translations?.hi) content = stored.translations.hi;
    else {
      if (!(await hasConsent(user.id, "ai_processing"))) return err(409, "Hindi reports are translated with AI. Turn on AI processing in Settings to enable them.", { code: "NEEDS_AI_CONSENT" });
      const t = await translateReportToHindi(stored);
      if (!t) return err(503, "Hindi translation is unavailable right now. Please try again later.");
      content = t.content;
      await db.report.update({ where: { id: r.id }, data: { content: { ...stored, translations: { ...(stored.translations ?? {}), hi: t.content } } as never } });
      await recordTokenUsage(user.id, `translate:${t.model}`, t.tokensIn, t.tokensOut, t.costMicros, r.id);
    }
  }
  const bytes = await renderReportPdf(content, lang);
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="vyomira-${r.type}${lang === "hi" ? "-hi" : ""}.pdf"`, "Cache-Control": "private, no-store" },
  });
}, { perIp: 30, perUser: 30, windowSeconds: 600 });
