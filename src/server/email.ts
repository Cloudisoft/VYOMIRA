import "server-only";
import { env } from "./env";

/** Transactional email via Resend's HTTP API. No-ops (and says so) when not configured. */
export async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  const e = env();
  if (!e.RESEND_API_KEY) {
    if (e.NODE_ENV !== "production") console.info(`[email] RESEND_API_KEY not set — skipped "${subject}"`);
    return { sent: false, reason: "not-configured" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: e.EMAIL_FROM, to, subject, html }),
  });
  return res.ok ? { sent: true } : { sent: false, reason: `resend-${res.status}` };
}

export const emailLayout = (title: string, body: string) => `
<div style="background:#080D20;padding:32px;font-family:Inter,Arial,sans-serif;color:#E9E3F5">
  <div style="max-width:520px;margin:0 auto;background:#121A35;border:1px solid rgba(165,139,255,.2);border-radius:16px;padding:32px">
    <p style="letter-spacing:.3em;color:#D8B477;font-size:12px;margin:0 0 16px">VYOMIRA</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 16px">${title}</h1>
    <div style="color:#9BA3BC;line-height:1.6;font-size:15px">${body}</div>
  </div>
</div>`;
