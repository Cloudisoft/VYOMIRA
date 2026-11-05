import "server-only";
import { createHash } from "node:crypto";
import { env } from "../env";

/**
 * PayU Standing Instructions (recurring) — hash-authenticated merchant APIs.
 * Source: docs.payu.in reference pages "pre_debit_notification_api" and "recurring_payment_api".
 *   POST https://info.payu.in/merchant/postservice.php?form=2   (test: test.payu.in)
 *   form fields: key, command, var1 (JSON), hash = sha512(key|command|var1|SALT)
 * These require the merchant Key + Salt (PAYU_MERCHANT_KEY / PAYU_SALT); the OAuth client
 * credentials cannot sign them. Without them, subscriptions renew via monthly payment links.
 */
export const siAutoDebitAvailable = () => Boolean(env().PAYU_MERCHANT_KEY && env().PAYU_SALT);

const postservice = () => (env().PAYU_ENV === "uat" ? "https://test.payu.in/merchant/postservice.php?form=2" : "https://info.payu.in/merchant/postservice.php?form=2");

async function command<T>(cmd: string, var1: object | string): Promise<T> {
  const e = env();
  if (!e.PAYU_MERCHANT_KEY || !e.PAYU_SALT) throw new Error("PayU merchant key/salt not configured");
  const v1 = typeof var1 === "string" ? var1 : JSON.stringify(var1);
  const hash = createHash("sha512").update(`${e.PAYU_MERCHANT_KEY}|${cmd}|${v1}|${e.PAYU_SALT}`).digest("hex");
  const res = await fetch(postservice(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ form: "2", key: e.PAYU_MERCHANT_KEY, command: cmd, var1: v1, hash }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`PayU ${cmd}: unexpected response (${res.status})`);
  }
}

const ymd = (d: Date) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

/** RBI-mandated pre-debit notification (≥ 48 h before a monthly debit for UPI). */
export async function preDebitNotify(input: { authpayuid: string; requestId: string; debitDate: Date; amountMinor: number; invoiceDisplayNumber: string }) {
  const r = await command<{ status: number | string; message?: string; msg?: string }>("pre_debit_SI", {
    authpayuid: input.authpayuid,
    requestId: input.requestId,
    debitDate: ymd(input.debitDate),
    amount: (input.amountMinor / 100).toFixed(2),
    invoiceDisplayNumber: input.invoiceDisplayNumber,
  });
  return { ok: String(r.status) === "1", message: r.message ?? r.msg ?? "" };
}

export type SiStatus = "captured" | "pending" | "failed" | "in-progress";

/** Recurring debit against a registered mandate. */
export async function siTransaction(input: { authpayuid: string; txnid: string; amountMinor: number; email: string; phone?: string; invoiceDisplayNumber: string; subscriptionId: string }) {
  const r = await command<{ status: number; message?: string; msg?: string; details?: Record<string, { status?: string; payuid?: string; transactionid?: string }> }>("si_transaction", {
    authpayuid: input.authpayuid,
    invoiceDisplayNumber: input.invoiceDisplayNumber,
    amount: (input.amountMinor / 100).toFixed(2),
    txnid: input.txnid,
    phone: input.phone ?? "",
    email: input.email,
    udf1: `sub:${input.subscriptionId}`,
    udf2: "",
    udf3: "",
    udf4: "",
    udf5: "",
  });
  const d = r.details?.[input.txnid];
  const status = ((d?.status || "failed").toLowerCase() as SiStatus) ?? "failed";
  return { accepted: r.status === 1, status, payuid: d?.payuid ?? null, message: r.message ?? r.msg ?? "" };
}

/** Final status of a (possibly pending) transaction. */
export async function verifyPayment(txnid: string) {
  const r = await command<{ status: number; transaction_details?: Record<string, { status?: string; mihpayid?: string; amt?: string }> }>("verify_payment", txnid);
  const d = r.transaction_details?.[txnid];
  return { status: (d?.status ?? "").toLowerCase(), mihpayid: d?.mihpayid ?? null, amount: d?.amt ? Number(d.amt) : null };
}
