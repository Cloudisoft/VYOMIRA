import "server-only";
import { db } from "./db";

/**
 * Audit / operational events. NEVER put birth details, chart payloads, message text,
 * payment card data or raw IPs in `meta`.
 */
export async function audit(action: string, opts: { userId?: string | null; target?: string; level?: "info" | "warn" | "error"; meta?: Record<string, unknown> } = {}) {
  try {
    await db.auditEvent.create({
      data: { action, userId: opts.userId ?? null, target: opts.target, level: opts.level ?? "info", meta: (opts.meta ?? undefined) as never },
    });
  } catch (e) {
    console.error("[audit] failed to record", action, e instanceof Error ? e.message : "unknown");
  }
}

export function logError(scope: string, err: unknown, userId?: string | null) {
  const message = err instanceof Error ? err.message.slice(0, 300) : "unknown error";
  console.error(`[${scope}]`, message);
  void audit(`error:${scope}`, { userId, level: "error", meta: { message } });
}
