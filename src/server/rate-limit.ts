import "server-only";
import { headers } from "next/headers";
import { redis } from "./redis";
import { hashIp } from "./crypto";

const memory = new Map<string, { count: number; reset: number }>();

export interface Limit {
  key: string;
  limit: number;
  windowSeconds: number;
}

/** Fixed-window limiter. Redis when available (multi-instance safe), memory otherwise. */
export async function rateLimit({ key, limit, windowSeconds }: Limit): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const k = `rl:${key}:${bucket}`;
  const r = redis();
  if (r) {
    try {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, windowSeconds);
      return { ok: n <= limit, remaining: Math.max(0, limit - n), retryAfter: windowSeconds };
    } catch {
      /* degrade to memory */
    }
  }
  const now = Date.now();
  const e = memory.get(k);
  if (!e || e.reset < now) {
    memory.set(k, { count: 1, reset: now + windowSeconds * 1000 });
    if (memory.size > 10000) for (const [kk, v] of memory) if (v.reset < now) memory.delete(kk);
    return { ok: true, remaining: limit - 1, retryAfter: windowSeconds };
  }
  e.count++;
  return { ok: e.count <= limit, remaining: Math.max(0, limit - e.count), retryAfter: Math.ceil((e.reset - now) / 1000) };
}

export async function clientIpHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return hashIp(ip);
}

/** Apply both an IP limit and (when signed in) a per-user limit. */
export async function limitRequest(name: string, opts: { perIp: number; perUser?: number; windowSeconds: number; userId?: string }) {
  const ip = await clientIpHash();
  const a = await rateLimit({ key: `${name}:ip:${ip}`, limit: opts.perIp, windowSeconds: opts.windowSeconds });
  if (!a.ok) return a;
  if (opts.userId && opts.perUser) return rateLimit({ key: `${name}:u:${opts.userId}`, limit: opts.perUser, windowSeconds: opts.windowSeconds });
  return a;
}
