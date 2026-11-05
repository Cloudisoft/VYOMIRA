import { authed, err, json } from "@/server/http";
import { loadChart } from "@/server/charts";
import { transitsFor } from "@/server/ai/aura";

export const GET = authed("transits", async (_req, { user }) => {
  const c = await loadChart(user.id);
  if (!c) return err(404, "No chart yet");
  return json({ transits: await transitsFor(c.chartId, c.chart) });
});
