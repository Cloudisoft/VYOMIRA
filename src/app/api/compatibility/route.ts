import { z } from "zod";
import { birthInputSchema } from "@/lib/schemas";
import { authed, err, json, parseBody } from "@/server/http";
import { calculate, loadChart, ChartError } from "@/server/charts";
import { compatibilityFromCharts } from "@/lib/astro/compatibility";
import { getConfig } from "@/server/config";

/** Partner data is used for this calculation only and is not stored. */
export const POST = authed("compatibility", async (req, { user }) => {
  if (!(await getConfig("flags")).compatibility) return err(503, "Compatibility is unavailable.");
  const p = await parseBody(req, z.object({ partner: birthInputSchema, myRole: z.enum(["bride", "groom"]).default("bride") }));
  if (!p.ok) return p.res;
  const mine = await loadChart(user.id);
  if (!mine) return err(409, "Create your birth chart first.");
  try {
    const partner = calculate(p.data.partner);
    return json({ result: compatibilityFromCharts(mine.chart, partner, p.data.myRole), me: { moonSign: mine.chart.moonSign.signName, nakshatra: mine.chart.janmaNakshatra.name }, partner: { moonSign: partner.moonSign.signName, nakshatra: partner.janmaNakshatra.name, lagna: partner.lagna?.signName ?? null } });
  } catch (e) {
    if (e instanceof ChartError) return err(422, e.message);
    throw e;
  }
}, { perIp: 20, perUser: 20, windowSeconds: 600 });
