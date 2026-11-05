import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { env } from "./env";
import { sendEmail, emailLayout } from "./email";

const e = env();

export const auth = betterAuth({
  appName: "VYOMIRA",
  baseURL: e.BETTER_AUTH_URL ?? e.NEXT_PUBLIC_APP_URL,
  secret: e.BETTER_AUTH_SECRET,
  trustedOrigins: [e.NEXT_PUBLIC_APP_URL, ...(process.env.TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
  database: prismaAdapter(db, { provider: "postgresql" }),
  account: { modelName: "authIdentity", accountLinking: { enabled: true, trustedProviders: ["google"] } },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "USER" },
      locale: { type: "string", input: false, defaultValue: "en" },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, "Reset your VYOMIRA password", emailLayout("Reset your password", `<p>Use the link below to choose a new password. It expires shortly.</p><p><a style="color:#D8B477" href="${url}">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p>`));
    },
  },
  socialProviders:
    e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET, prompt: "select_account" } }
      : {},
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 300 } },
  rateLimit: { enabled: true, window: 60, max: 30, storage: "memory" },
  advanced: { useSecureCookies: (e.BETTER_AUTH_URL ?? e.NEXT_PUBLIC_APP_URL).startsWith("https://") },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const admins = e.ADMIN_EMAILS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          return { data: { ...user, role: admins.includes(user.email.toLowerCase()) ? "ADMIN" : "USER" } };
        },
        after: async (user) => {
          // Free tier: one short personalized AURA question.
          await db.entitlement.create({ data: { userId: user.id, kind: "ai_messages", quantity: 1, remaining: 1, source: "free" } });
          await sendEmail(user.email, "Welcome to VYOMIRA", emailLayout("Your universe is ready", "<p>Thank you for joining VYOMIRA. Your Kundli, planetary periods and AURA, your cosmic companion, are waiting in your dashboard.</p>"));
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
