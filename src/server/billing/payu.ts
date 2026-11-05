import "server-only";
import { createHash } from "node:crypto";
import { env } from "../env";
import { safeEqualHex } from "../crypto";

/**
 * PayU India — Payment Links API (OAuth 2.0 client-credentials; docs.payu.in/reference/payment-links).
 * Flow: create a single-use link per order → redirect the buyer → on return and via webhook,
 * confirm by fetching the link's transactions server-side. We never trust the redirect alone.
 */
const hosts = () =>
  env().PAYU_ENV === "uat"
    ? { auth: "https://uat-accounts.payu.in", api: "https://uatoneapi.payu.in" }
    : { auth: "https://accounts.payu.in", api: "https://oneapi.payu.in" };

let token: { value: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const e = env();
  if (!e.PAYU_CLIENT_ID || !e.PAYU_CLIENT_SECRET) throw new Error("PayU is not configured");
  const res = await fetch(`${hosts().auth}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: e.PAYU_CLIENT_ID, client_secret: e.PAYU_CLIENT_SECRET, grant_type: "client_credentials", scope: "create_payment_links read_payment_links update_payment_links" }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`PayU auth failed (${res.status})`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${hosts().api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, merchantId: env().PAYU_MERCHANT_ID ?? "", "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
  });
  const j = (await res.json().catch(() => ({}))) as { status?: number; message?: string; result?: unknown };
  if (!res.ok || j.status !== 0) throw new Error(`PayU API error: ${j.message ?? res.status}`);
  return j.result as T;
}

const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3600000).toISOString().replace("T", " ").slice(0, 19);

/** Invoice numbers: alphanumeric, ≤ 25 chars. Our payment ids are 25-char cuids. */
export const payuInvoiceFor = (paymentId: string) => paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);

export async function createPayuLink(input: { paymentId: string; amountMinor: number; description: string; name: string; email: string; returnUrl: string }) {
  if (input.amountMinor % 100 !== 0) throw new Error("PayU links are created in whole rupees");
  const result = await api<{ paymentLink: string; invoiceNumber: string; totalAmount: number }>("/payment-links", {
    method: "POST",
    body: JSON.stringify({
      subAmount: input.amountMinor / 100,
      currency: "INR",
      description: input.description.slice(0, 255),
      source: "API",
      invoiceNumber: payuInvoiceFor(input.paymentId),
      expiryDate: ist(new Date(Date.now() + 60 * 60000)),
      maxPaymentsAllowed: 1,
      isPartialPaymentAllowed: false,
      isAmountFilledByCustomer: false,
      viaEmail: false,
      viaSms: false,
      customer: { name: input.name.slice(0, 60), email: input.email },
      udf: { udf1: input.paymentId },
      // PayU rejects non-public callback URLs (e.g. http://localhost → HTTP 403); only send real HTTPS origins.
      ...(/^https:\/\/(?!localhost|127\.)/.test(input.returnUrl) ? { successURL: input.returnUrl, failureURL: input.returnUrl } : {}),
    }),
  });
  return { url: result.paymentLink, invoiceNumber: result.invoiceNumber, totalAmount: result.totalAmount };
}

export interface PayuTxn { transactionId: string; paymentId: number; status: string; settledAmount: number; mode: string; createdOn: string }

export async function payuLinkTransactions(invoiceNumber: string): Promise<PayuTxn[]> {
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const r = await api<{ data?: PayuTxn[] }>(`/payment-links/${encodeURIComponent(invoiceNumber)}/txns?dateFrom=${from}&dateTo=${to}&pageSize=20`);
  return r.data ?? [];
}

/**
 * Webhook hash (Payment Links use client_secret, not salt):
 * sha512(client_secret|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayuWebhook(f: Record<string, string>) {
  const secret = env().PAYU_CLIENT_SECRET;
  if (!secret || !f.hash) return false;
  const seq = [secret, f.status ?? "", "", "", "", "", "", f.udf5 ?? "", f.udf4 ?? "", f.udf3 ?? "", f.udf2 ?? "", f.udf1 ?? "", f.email ?? "", f.firstname ?? "", f.productinfo ?? "", f.amount ?? "", f.txnid ?? "", f.key ?? ""].join("|");
  return safeEqualHex(createHash("sha512").update(seq).digest("hex"), f.hash.toLowerCase());
}
