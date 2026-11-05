import "server-only";
import Redis from "ioredis";

const g = globalThis as unknown as { redis?: Redis | null };

/** Returns a shared Redis client, or null when REDIS_URL is not configured. */
export function redis(): Redis | null {
  if (g.redis !== undefined) return g.redis;
  const url = process.env.REDIS_URL;
  if (!url) return (g.redis = null);
  const client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false, enableOfflineQueue: false });
  client.on("error", () => {
    /* surfaced via failed commands; avoid log spam */
  });
  return (g.redis = client);
}

const mem = new Map<string, { v: string; exp: number }>();
export async function cacheGet(key: string): Promise<string | null> {
  const r = redis();
  if (r) {
    try {
      return await r.get(key);
    } catch {
      /* fall through */
    }
  }
  const hit = mem.get(key);
  if (!hit || hit.exp < Date.now()) return null;
  return hit.v;
}
export async function cacheSet(key: string, value: string, ttlSeconds: number) {
  const r = redis();
  if (r) {
    try {
      await r.set(key, value, "EX", ttlSeconds);
      return;
    } catch {
      /* fall through */
    }
  }
  if (mem.size > 5000) mem.clear();
  mem.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
}
