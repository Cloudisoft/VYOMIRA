import { z } from "zod";
import { authed, err, json, parseBody } from "@/server/http";
import { getConfig, setConfig } from "@/server/config";
import { audit } from "@/server/audit";

type Ctx = { params: Promise<{ key: string }> };
const KEYS = ["pricing", "ai", "flags"] as const;

const validators = {
  pricing: z.object({
    plans: z.array(z.object({ id: z.enum(["starter", "cosmic_plus"]), name: z.string().min(1), tagline: z.string(), aiMessages: z.number().int().min(1).max(1000), detailedReports: z.boolean(), features: z.array(z.string()), highlight: z.boolean().optional() })),
    free: z.object({ aiMessages: z.number().int().min(0).max(10), features: z.array(z.string()) }),
    regions: z.record(z.string(), z.object({ currency: z.string().length(3), symbol: z.string().min(1), prices: z.object({ starter: z.number().int().min(100), cosmic_plus: z.number().int().min(100) }) })),
    euCountries: z.array(z.string().length(2)),
  }),
  ai: z.object({ modelFast: z.string().min(3), modelDeep: z.string().min(3), maxOutputTokensChat: z.number().int().min(500).max(16000), maxOutputTokensReport: z.number().int().min(500).max(32000), monthlyBudgetUsd: z.number().min(0), perUserDailyMessageCap: z.number().int().min(1).max(500), prices: z.record(z.string(), z.tuple([z.number(), z.number()])) }),
  flags: z.object({ aura: z.boolean(), reports: z.boolean(), compatibility: z.boolean(), stripe: z.boolean(), signups: z.boolean() }),
};

export const GET = authed<Ctx>("admin-config-get", async (_req, { params }) => {
  const { key } = await params;
  if (!KEYS.includes(key as never)) return err(404, "Unknown key");
  return json({ value: await getConfig(key as (typeof KEYS)[number]) });
}, undefined, { admin: true });

export const PUT = authed<Ctx>("admin-config-put", async (req, { user, params }) => {
  const { key } = await params;
  if (!KEYS.includes(key as never)) return err(404, "Unknown key");
  const p = await parseBody(req, validators[key as (typeof KEYS)[number]]);
  if (!p.ok) return p.res;
  await setConfig(key as (typeof KEYS)[number], p.data, user.id);
  await audit("admin.config_updated", { userId: user.id, target: key });
  return json({ ok: true });
}, { perIp: 30, perUser: 30, windowSeconds: 600 }, { admin: true });
