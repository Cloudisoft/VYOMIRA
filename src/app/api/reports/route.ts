import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { loadChart } from "@/server/charts";
import { db } from "@/server/db";
import { getConfig } from "@/server/config";
import { balance } from "@/server/billing/entitlements";
import { buildReport, REPORT_TYPES, reportContextKey, type ReportType } from "@/server/reports";
import { transitsFor } from "@/server/ai/aura";

const schema = z.object({ type: z.enum(Object.keys(REPORT_TYPES) as [ReportType, ...ReportType[]]) });

export const GET = authed("reports-list", async (_req, { user }) => {
  const reports = await db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, type: true, createdAt: true, generator: true } });
  return json({ reports });
});

export const POST = authed("reports-create", async (req, { user }) => {
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  if (!(await getConfig("flags")).reports) return err(503, "Reports are temporarily unavailable.");
  const def = REPORT_TYPES[p.data.type];
  if (def.premium && !(await balance(user.id)).detailedReports) return err(402, "Detailed reports are part of Cosmic Plus.", { code: "NEEDS_PLUS" });
  const loaded = await loadChart(user.id);
  if (!loaded) return err(409, "Create your birth chart first.");
  const { factsHash } = reportContextKey(p.data.type, loaded.chart);
  // Same chart facts + same date context ⇒ return the existing report; never regenerate or charge twice.
  const existing = await db.report.findUnique({ where: { chartSnapshotId_type_factsHash: { chartSnapshotId: loaded.chartId, type: p.data.type, factsHash } } });
  if (existing) return json({ id: existing.id, reused: true });
  const content = buildReport(p.data.type, loaded.chart, loaded.fullName, await transitsFor(loaded.chartId, loaded.chart));
  const r = await db.report.create({ data: { userId: user.id, chartSnapshotId: loaded.chartId, type: p.data.type, factsHash, content: content as never, generator: content.reading.generator } });
  await db.usageLedger.create({ data: { userId: user.id, kind: "report", delta: 0, refId: r.id } });
  return json({ id: r.id, reused: false });
}, { perIp: 30, perUser: 20, windowSeconds: 600 });
