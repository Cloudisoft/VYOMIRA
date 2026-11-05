import "server-only";
import { db } from "./db";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

export interface AiConfig {
  modelFast: string;
  modelDeep: string;
  maxOutputTokensChat: number;
  maxOutputTokensReport: number;
  monthlyBudgetUsd: number;
  perUserDailyMessageCap: number;
  /** USD per 1M tokens [input, output] — used for usage accounting only. */
  prices: Record<string, [number, number]>;
}

export interface FeatureFlags {
  aura: boolean;
  reports: boolean;
  compatibility: boolean;
  stripe: boolean;
  signups: boolean;
}

export const DEFAULT_AI: AiConfig = {
  modelFast: process.env.AI_MODEL_FAST || "claude-haiku-5-5",
  modelDeep: process.env.AI_MODEL_DEEP || "claude-opus-5-5",
  maxOutputTokensChat: 3000,
  maxOutputTokensReport: 8000,
  monthlyBudgetUsd: Number(process.env.AI_MONTHLY_BUDGET_USD || 50),
  perUserDailyMessageCap: 40,
  prices: {
    "claude-haiku-5-5": [0.1, 0.5],
    "claude-sonnet-5-5": [2, 10],
    "claude-opus-5-5": [4, 20],
  },
};

export const DEFAULT_FLAGS: FeatureFlags = { aura: true, reports: true, compatibility: true, stripe: false, signups: true };

const DEFAULTS = { pricing: DEFAULT_PRICING, ai: DEFAULT_AI, flags: DEFAULT_FLAGS } as const;
type Key = keyof typeof DEFAULTS;
type Val<K extends Key> = (typeof DEFAULTS)[K] extends PricingConfig ? PricingConfig : K extends "ai" ? AiConfig : FeatureFlags;

const memo = new Map<string, { at: number; v: unknown }>();

export async function getConfig<K extends Key>(key: K): Promise<Val<K>> {
  const m = memo.get(key);
  if (m && Date.now() - m.at < 30_000) return m.v as Val<K>;
  let v: unknown = DEFAULTS[key];
  try {
    const row = await db.adminConfig.findUnique({ where: { key } });
    if (row) v = { ...(DEFAULTS[key] as object), ...(row.value as object) };
  } catch {
    /* DB unavailable → defaults */
  }
  memo.set(key, { at: Date.now(), v });
  return v as Val<K>;
}

export async function setConfig(key: Key, value: unknown, by: string) {
  await db.adminConfig.upsert({ where: { key }, create: { key, value: value as never, updatedBy: by }, update: { value: value as never, updatedBy: by } });
  memo.delete(key);
}
