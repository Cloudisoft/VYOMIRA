import { z } from "zod";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { sendEmail, emailLayout } from "@/server/email";
import { clientIpHash } from "@/server/rate-limit";
import { err, json, parseBody, publicLimited } from "@/server/http";
import { logError } from "@/server/audit";

const Body = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(160),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  topic: z.enum(["general", "billing", "account", "privacy", "partnership"]).default("general"),
  message: z.string().trim().min(10, "Please write a little more (10+ characters)").max(4000),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Website contact form. The destination inbox lives only in server config and is never exposed. */
export async function POST(req: Request) {
  const limited = await publicLimited("contact", 5, 3600);
  if (limited) return limited;
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.res;
  const d = parsed.data;
  if (d.website) return json({ ok: true }); // bot: pretend success, store nothing
  try {
    const msg = await db.contactMessage.create({ data: { name: d.name, email: d.email, phone: d.phone || null, topic: d.topic, message: d.message, ipHash: await clientIpHash() } });
    const inbox = env().CONTACT_INBOX;
    if (inbox) {
      const html = emailLayout(`New enquiry: ${esc(d.topic)}`, `<p><strong>${esc(d.name)}</strong> &lt;${esc(d.email)}&gt;${d.phone ? ` · ${esc(d.phone)}` : ""}</p><p style="white-space:pre-wrap">${esc(d.message)}</p><p style="font-size:12px">Reply to this email to answer them directly.</p>`);
      const r = await sendEmail(inbox, `VYOMIRA enquiry (${d.topic}) from ${d.name}`, html, { replyTo: d.email });
      if (r.sent) await db.contactMessage.update({ where: { id: msg.id }, data: { delivered: true } });
    }
    return json({ ok: true });
  } catch (e) {
    logError("contact", e);
    return err(500, "We couldn't send your message. Please try WhatsApp or email instead.");
  }
}
