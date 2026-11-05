import { authed, err, json } from "@/server/http";
import { loadChart } from "@/server/charts";

export const GET = authed("chart-current", async (_req, { user }) => {
  const c = await loadChart(user.id);
  if (!c) return err(404, "No chart yet");
  return json({ chartId: c.chartId, fullName: c.fullName, chart: c.chart }, { headers: { "Cache-Control": "private, no-store" } });
});
