import { db } from "@/server/db";

export default async function AdminFeedback() {
  const items = await db.message.findMany({ where: { OR: [{ reported: true }, { rating: { not: null } }] }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, rating: true, reported: true, feedback: true, generator: true, validation: true, createdAt: true, content: true } });
  return (
    <div>
      <h1 className="text-4xl">Customer feedback</h1>
      <p className="mt-2 text-sm text-slate">Rated and reported AURA answers. Answer text is shown for quality review; it never contains birth details.</p>
      <ul className="mt-6 space-y-3">
        {items.map((m) => (
          <li key={m.id} className="glass rounded-2xl p-4 text-sm">
            <p className="text-xs text-slate">{m.createdAt.toLocaleString("en-GB")} · {m.generator} · {m.validation} · {m.rating === 1 ? "👍" : m.rating === -1 ? "👎" : ""} {m.reported && <span className="text-[#F0A08A]">reported</span>}</p>
            <p className="mt-2 line-clamp-4 text-moon/90">{m.content}</p>
            {m.feedback && <p className="mt-2 text-gold">“{m.feedback}”</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
