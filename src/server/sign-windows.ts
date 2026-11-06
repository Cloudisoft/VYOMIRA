import "server-only";
import { slowSignWindows, type SignWindow } from "@/lib/interpret/life-guide";
import { cacheGet, cacheSet } from "./redis";

/** Jupiter/Saturn sign windows are the same for everyone on a given day — compute once, cache 12 h. */
export async function signWindows(now: Date): Promise<SignWindow[]> {
  const key = `sw:v1:${now.toISOString().slice(0, 10)}`;
  const hit = await cacheGet(key);
  if (hit) return JSON.parse(hit);
  const w = slowSignWindows(now, 8);
  await cacheSet(key, JSON.stringify(w), 12 * 3600);
  return w;
}
