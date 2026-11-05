import "server-only";
import { cookies, headers } from "next/headers";

/** Country for regional pricing: explicit user choice > CDN geo header > India (primary market). */
export async function detectCountry(): Promise<string> {
  const c = (await cookies()).get("vy_country")?.value;
  if (c && /^[A-Z]{2}$/.test(c)) return c;
  const h = await headers();
  const geo = h.get("cf-ipcountry") || h.get("x-vercel-ipcountry") || h.get("cloudfront-viewer-country") || h.get("x-country");
  if (geo && /^[A-Z]{2}$/i.test(geo) && geo.toUpperCase() !== "XX") return geo.toUpperCase();
  return "IN";
}
