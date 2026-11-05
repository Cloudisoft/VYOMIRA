import "server-only";
import { regionFor } from "@/lib/pricing";
import { getConfig } from "./config";
import { detectCountry } from "./country";
import { features } from "./env";

/**
 * The region whose prices a visitor is actually charged. When PayU (INR-only) is the processor and
 * Stripe isn't serving other currencies, everyone pays the INR price — and we show that, not a
 * foreign-currency price we can't charge.
 */
export async function chargeRegion() {
  const [pricing, flags, country] = await Promise.all([getConfig("pricing"), getConfig("flags"), detectCountry()]);
  const f = features();
  const r = regionFor(country, pricing);
  const inrOnly = f.payu && r.region.currency !== "INR" && !(flags.stripe && f.stripe);
  return { pricing, country, key: inrOnly ? "IN" : r.key, region: inrOnly ? pricing.regions.IN : r.region, inrOnly };
}
