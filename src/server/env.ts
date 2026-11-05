import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Deployment stage. Only APP_ENV=production enforces live-payment and secret-strength rules. */
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BIRTH_DATA_ENCRYPTION_KEY: z.string().min(40, "32-byte key, base64-encoded"),
  // Payments
  PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYU_CLIENT_ID: z.string().optional(),
  PAYU_CLIENT_SECRET: z.string().optional(),
  PAYU_MERCHANT_ID: z.string().optional(),
  PAYU_ENV: z.enum(["production", "uat"]).default("production"),
  /** Merchant Key + Salt (PayU Dashboard → Developers → API keys): enable automatic monthly mandate debits. */
  PAYU_MERCHANT_KEY: z.string().optional(),
  PAYU_SALT: z.string().optional(),
  /** Shared secret for the scheduled renewal job (POST /api/cron/subscriptions). */
  CRON_SECRET: z.string().min(16).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // AI
  AI_PROVIDER: z.enum(["anthropic", "openai-compatible", "none"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_COMPAT_API_KEY: z.string().optional(),
  OPENAI_COMPAT_BASE_URL: z.string().url().optional(),
  AI_MODEL_FAST: z.string().optional(),
  AI_MODEL_DEEP: z.string().optional(),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(50),
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("VYOMIRA <hello@vyomira.app>"),
  // Admin bootstrap
  ADMIN_EMAILS: z.string().default(""),
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${msg}`);
  }
  if (parsed.data.APP_ENV === "production") {
    if (parsed.data.PAYMENTS_MODE === "test") throw new Error("PAYMENTS_MODE=test is refused when APP_ENV=production. Configure Razorpay and set PAYMENTS_MODE=live.");
    if (parsed.data.BETTER_AUTH_SECRET.startsWith("dev-only") || parsed.data.BIRTH_DATA_ENCRYPTION_KEY === "ZGV2LW9ubHkta2V5LWRvLW5vdC11c2UtaW4tcHJvZCE=") throw new Error("Development secrets are refused when APP_ENV=production.");
  }
  cached = parsed.data;
  return cached;
}

export const features = () => {
  const e = env();
  return {
    google: Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET),
    payu: Boolean(e.PAYU_CLIENT_ID && e.PAYU_CLIENT_SECRET && e.PAYU_MERCHANT_ID),
    razorpay: Boolean(e.RAZORPAY_KEY_ID && e.RAZORPAY_KEY_SECRET),
    stripe: Boolean(e.STRIPE_SECRET_KEY),
    testPayments: e.PAYMENTS_MODE === "test",
    ai: e.AI_PROVIDER !== "none" && Boolean(e.AI_PROVIDER === "anthropic" ? e.ANTHROPIC_API_KEY : e.OPENAI_COMPAT_API_KEY),
    email: Boolean(e.RESEND_API_KEY),
  };
};
