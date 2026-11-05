import { z } from "zod";
import { birthInputSchema } from "@/lib/schemas";
import { saveChart, ChartError } from "@/server/charts";
import { authed, err, json, parseBody } from "@/server/http";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { CONSENT_VERSION } from "@/server/consent";

const schema = z.object({
  birth: birthInputSchema,
  consent: z.object({ storeBirthData: z.literal(true), aiProcessing: z.boolean(), terms: z.literal(true) }),
});

export const POST = authed("chart-save", async (req, { user }) => {
  const p = await parseBody(req, schema);
  if (!p.ok) return p.res;
  try {
    await db.consent.createMany({
      data: [
        { userId: user.id, kind: "terms", version: CONSENT_VERSION, granted: true },
        { userId: user.id, kind: "store_birth_data", version: CONSENT_VERSION, granted: true },
        { userId: user.id, kind: "ai_processing", version: CONSENT_VERSION, granted: p.data.consent.aiProcessing },
      ],
    });
    const r = await saveChart(user.id, p.data.birth);
    await audit("chart.saved", { userId: user.id, target: r.chartId });
    return json({ chartId: r.chartId });
  } catch (e) {
    if (e instanceof ChartError) return err(422, e.message);
    throw e;
  }
}, { perIp: 20, perUser: 10, windowSeconds: 3600 });
