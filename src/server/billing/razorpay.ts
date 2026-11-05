import "server-only";
import { env } from "../env";
import { hmacSha256Hex, safeEqualHex } from "../crypto";

const API = "https://api.razorpay.com/v1";

function authHeader() {
  const e = env();
  if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET) throw new Error("Razorpay is not configured");
  return "Basic " + Buffer.from(`${e.RAZORPAY_KEY_ID}:${e.RAZORPAY_KEY_SECRET}`).toString("base64");
}

export async function createRazorpayOrder(input: { amountMinor: number; currency: string; receipt: string; notes: Record<string, string> }) {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amountMinor, currency: input.currency, receipt: input.receipt, notes: input.notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  return (await res.json()) as { id: string; amount: number; currency: string; status: string };
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = env().RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return safeEqualHex(hmacSha256Hex(secret, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = env().RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqualHex(hmacSha256Hex(secret, rawBody), signature);
}

export async function fetchOrderPayments(orderId: string) {
  const res = await fetch(`${API}/orders/${orderId}/payments`, { headers: { Authorization: authHeader() } });
  if (!res.ok) throw new Error(`Razorpay fetch failed (${res.status})`);
  return (await res.json()) as { items: { id: string; status: string; amount: number; currency: string }[] };
}
