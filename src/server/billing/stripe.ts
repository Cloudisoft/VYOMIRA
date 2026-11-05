import "server-only";
import { env } from "../env";
import { hmacSha256Hex, safeEqualHex } from "../crypto";

/** Optional Stripe Checkout adapter (international cards). Uses the REST API directly. */
export async function createStripeCheckout(input: { amountMinor: number; currency: string; name: string; paymentId: string; successUrl: string; cancelUrl: string; email: string }) {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  const body = new URLSearchParams({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.email,
    client_reference_id: input.paymentId,
    "metadata[paymentId]": input.paymentId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(input.amountMinor),
    "line_items[0][price_data][product_data][name]": input.name,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": input.paymentId },
    body,
  });
  if (!res.ok) throw new Error(`Stripe checkout failed (${res.status})`);
  return (await res.json()) as { id: string; url: string };
}

export function verifyStripeSignature(rawBody: string, header: string | null, toleranceSec = 300) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const expected = hmacSha256Hex(secret, `${t}.${rawBody}`);
  return sigs.some((s) => safeEqualHex(expected, s));
}
