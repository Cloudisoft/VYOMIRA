import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiUser } from "../session";
import { limitRequest } from "../rate-limit";
import { logError } from "../audit";

export const json = (data: unknown, init?: number | ResponseInit) => NextResponse.json(data, typeof init === "number" ? { status: init } : init);
export const err = (status: number, message: string, extra?: Record<string, unknown>) => NextResponse.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: err(400, "Invalid JSON") };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { ok: false, res: err(422, "Validation failed", { issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  return { ok: true, data: r.data };
}

type Handler<C> = (req: Request, ctx: C & { user: NonNullable<Awaited<ReturnType<typeof apiUser>>> }) => Promise<Response>;

/** Wraps a private route: auth required, optional rate limit, uniform error handling (no PII in logs). */
export function authed<C = { params: Promise<Record<string, string>> }>(name: string, handler: Handler<C>, limit?: { perIp: number; perUser: number; windowSeconds: number }, opts: { admin?: boolean } = {}) {
  return async (req: Request, ctx: C) => {
    const user = await apiUser();
    if (!user) return err(401, "Sign in required");
    if (opts.admin && user.role !== "ADMIN") return err(403, "Forbidden");
    if (limit) {
      const rl = await limitRequest(name, { ...limit, userId: user.id });
      if (!rl.ok) return err(429, "Too many requests. Please slow down.", { retryAfter: rl.retryAfter });
    }
    try {
      return await handler(req, { ...ctx, user });
    } catch (e) {
      logError(name, e, user.id);
      return err(500, "Something went wrong on our side. Please try again.");
    }
  };
}

export async function publicLimited(name: string, perIp: number, windowSeconds: number) {
  const rl = await limitRequest(name, { perIp, windowSeconds });
  return rl.ok ? null : err(429, "Too many requests. Please try again shortly.", { retryAfter: rl.retryAfter });
}
