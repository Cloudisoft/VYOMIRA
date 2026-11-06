import { db } from "@/server/db";
import { env } from "@/server/env";

export default async function AdminEnquiries() {
  const items = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const inbox = Boolean(env().CONTACT_INBOX) && Boolean(env().RESEND_API_KEY);
  return (
    <div>
      <h1 className="text-4xl">Enquiries</h1>
      <p className="mt-2 text-sm text-slate">Messages from the website contact form. {inbox ? "Each one is also emailed to the private inbox." : "Email forwarding is off until RESEND_API_KEY and CONTACT_INBOX are set — messages are kept here meanwhile."}</p>
      <ul className="mt-6 space-y-3">
        {items.length === 0 && <li className="text-sm text-slate">No messages yet.</li>}
        {items.map((m) => (
          <li key={m.id} className="glass rounded-2xl p-4 text-sm">
            <p className="text-xs text-slate">{m.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })} IST · {m.topic} · {m.delivered ? <span className="text-gold">emailed</span> : <span className="text-slate/70">not emailed</span>}</p>
            <p className="mt-1 text-moon">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <> · <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a></>}</p>
            <p className="mt-2 whitespace-pre-wrap text-moon/90">{m.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
