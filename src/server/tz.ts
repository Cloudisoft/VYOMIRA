import "server-only";
import { cookies } from "next/headers";
import { isValidTimeZone } from "@/lib/astro/timezone";

export async function userTimeZone(fallback = "Asia/Kolkata") {
  const v = (await cookies()).get("vy_tz")?.value;
  const tz = v ? decodeURIComponent(v) : fallback;
  return isValidTimeZone(tz) ? tz : fallback;
}
