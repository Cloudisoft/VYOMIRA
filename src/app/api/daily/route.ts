import { authed, err, json } from "@/server/http";
import { loadChart } from "@/server/charts";
import { dailyInsight, cosmicCalendar } from "@/lib/interpret/daily";
import { isValidTimeZone } from "@/lib/astro/timezone";

export const GET = authed("daily", async (req, { user }) => {
  const tz = new URL(req.url).searchParams.get("tz") ?? "Asia/Kolkata";
  if (!isValidTimeZone(tz)) return err(400, "Invalid timezone");
  const c = await loadChart(user.id);
  if (!c) return err(404, "No chart yet");
  return json({ today: dailyInsight(c.chart, tz), calendar: cosmicCalendar(c.chart, tz, 14) });
});
